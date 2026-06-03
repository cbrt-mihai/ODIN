import type { Entity } from "@/lib/types";
import { fieldValueToSearchText } from "@/lib/search/field-text";
import {
  digitsOnly,
  isPlausibleHostname,
  isPlausiblePhone,
  isStructuredPhone,
  normalizeHostname,
  normalizeUrl,
} from "@/lib/osint/indicator-validation";

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE =
  /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const PHONE_RE =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?/g;
const DOMAIN_RE =
  /(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g;

export interface IndicatorSource {
  entityId: string;
  displayName: string;
}

export interface IndicatorItem {
  value: string;
  sources: IndicatorSource[];
}

export interface ExtractedIndicators {
  emails: IndicatorItem[];
  urls: IndicatorItem[];
  phones: IndicatorItem[];
  domains: IndicatorItem[];
}

type IndicatorKind = keyof ExtractedIndicators;

function collectTextFromEntity(entity: Entity): string {
  const chunks = [
    entity.displayName,
    entity.slug ?? "",
    ...(entity.aliases ?? []),
    ...(entity.tags ?? []),
  ];
  for (const section of entity.sections) {
    for (const field of section.fields) {
      chunks.push(fieldValueToSearchText(field.value.data, field.type));
    }
  }
  return chunks.join("\n");
}

function maskMatches(text: string, re: RegExp): string {
  return text.replace(re, (match) => " ".repeat(match.length));
}

function addIndicator(
  map: Map<string, IndicatorItem>,
  kind: IndicatorKind,
  value: string,
  source: IndicatorSource,
  normalizeKey: (v: string) => string,
) {
  const key = normalizeKey(value);
  if (!key) return;
  const existing = map.get(`${kind}:${key}`);
  if (existing) {
    if (!existing.sources.some((s) => s.entityId === source.entityId)) {
      existing.sources.push(source);
    }
    return;
  }
  map.set(`${kind}:${key}`, { value, sources: [source] });
}

function itemsFromMap(
  map: Map<string, IndicatorItem>,
  kind: IndicatorKind,
): IndicatorItem[] {
  return [...map.entries()]
    .filter(([key]) => key.startsWith(`${kind}:`))
    .map(([, item]) => item)
    .sort((a, b) => a.value.localeCompare(b.value));
}

function extractFromEntityText(
  entity: Entity,
  map: Map<string, IndicatorItem>,
) {
  const source: IndicatorSource = {
    entityId: entity.id,
    displayName: entity.displayName,
  };
  const text = collectTextFromEntity(entity);

  const emails = text.match(EMAIL_RE) ?? [];
  for (const email of emails) {
    addIndicator(map, "emails", email, source, (v) => v.trim().toLowerCase());
  }

  const urls = (text.match(URL_RE) ?? []).map(normalizeUrl).filter(Boolean);
  for (const url of urls) {
    addIndicator(map, "urls", url, source, (v) => v.trim().toLowerCase());
  }

  for (const section of entity.sections) {
    for (const field of section.fields) {
      if (typeof field.value.data !== "string") continue;
      const raw = field.value.data.trim();
      if (!raw) continue;

      if (field.type === "phone" && isStructuredPhone(raw)) {
        addIndicator(map, "phones", raw, source, (v) => digitsOnly(v));
      }
      if (field.type === "email") {
        addIndicator(map, "emails", raw, source, (v) => v.trim().toLowerCase());
      }
      if (field.type === "url") {
        const normalized = normalizeUrl(raw);
        addIndicator(map, "urls", normalized, source, (v) =>
          v.trim().toLowerCase(),
        );
        try {
          const host = normalizeHostname(new URL(normalized).hostname);
          if (isPlausibleHostname(host)) {
            addIndicator(map, "domains", host, source, (v) => v);
          }
        } catch {
          /* ignore invalid url field */
        }
      }
    }
  }

  const domainScanText = maskMatches(maskMatches(text, EMAIL_RE), URL_RE);
  const rawDomains = domainScanText.match(DOMAIN_RE) ?? [];
  for (const raw of rawDomains) {
    const host = normalizeHostname(raw);
    if (isPlausibleHostname(host)) {
      addIndicator(map, "domains", host, source, (v) => v);
    }
  }

  for (const email of emails) {
    const host = normalizeHostname(email.split("@")[1] ?? "");
    if (isPlausibleHostname(host)) {
      addIndicator(map, "domains", host, source, (v) => v);
    }
  }

  for (const url of urls) {
    try {
      const host = normalizeHostname(new URL(url).hostname);
      if (isPlausibleHostname(host)) {
        addIndicator(map, "domains", host, source, (v) => v);
      }
    } catch {
      /* ignore */
    }
  }

  const phoneScanText = maskMatches(maskMatches(text, EMAIL_RE), URL_RE);
  const phones = phoneScanText.match(PHONE_RE) ?? [];
  for (const phone of phones) {
    const trimmed = phone.trim();
    if (!isPlausiblePhone(trimmed)) continue;
    addIndicator(map, "phones", trimmed, source, (v) => digitsOnly(v));
  }
}

export function extractIndicatorsFromEntities(
  entities: Entity[],
): ExtractedIndicators {
  const map = new Map<string, IndicatorItem>();
  for (const entity of entities) {
    extractFromEntityText(entity, map);
  }

  return {
    emails: itemsFromMap(map, "emails"),
    urls: itemsFromMap(map, "urls"),
    phones: itemsFromMap(map, "phones"),
    domains: itemsFromMap(map, "domains"),
  };
}

export function entityTypeCounts(entities: Entity[]) {
  const counts: Record<string, number> = {};
  for (const e of entities) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

export function confidenceCounts(
  entities: Entity[],
  confidenceLabels: Record<string, string>,
) {
  const counts: Record<string, number> = {};
  for (const entity of entities) {
    for (const section of entity.sections) {
      for (const field of section.fields) {
        const id = field.provenance.confidence;
        const label = confidenceLabels[id] ?? id;
        counts[label] = (counts[label] ?? 0) + 1;
      }
    }
  }
  return counts;
}
