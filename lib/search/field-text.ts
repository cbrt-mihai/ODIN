import {
  formatDateRanges,
  formatDates,
  formatLocation,
} from "@/lib/date-range/format";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { migrateFieldValueData } from "@/lib/date-range/migrate";
import { migrateAnnotationsToLists, entriesSearchText } from "@/lib/entries/helpers";
import { proofCount } from "@/lib/proof/helpers";
import type {
  DateRangeValue,
  DatesValue,
  Entity,
  Field,
  FieldTypeId,
  LocationValue,
} from "@/lib/types";

export function fieldValueToSearchText(
  data: unknown,
  type: FieldTypeId,
): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }
  if (type === "dateRange" || type === "date" || type === "datetime") {
    const migrated = migrateFieldValueData(type, data);
    if (migrated && typeof migrated === "object" && "entries" in migrated) {
      return formatDateRanges(migrated as import("@/lib/types").DateRangesValue);
    }
  }
  if (type === "dates" && data && typeof data === "object") {
    return formatDates(data as DatesValue);
  }
  if (type === "location" && data && typeof data === "object") {
    return formatLocation(data as LocationValue);
  }
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        typeof item === "object" && item && "label" in item
          ? String((item as { label?: string }).label ?? "")
          : String(item),
      )
      .join(" ");
  }
  if (type === "entityLink" && typeof data === "object" && data) {
    const link = data as { entityId?: string; label?: string };
    return [link.label, link.entityId].filter(Boolean).join(" ");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

export function entityFieldSearchBlob(entity: Entity): string {
  const parts: string[] = [];
  for (const section of entity.sections) {
    parts.push(section.title);
    for (const field of section.fields) {
      parts.push(field.label);
      const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
      parts.push(entriesSearchText(contextEntries, noteEntries));
      parts.push(field.description ?? "", field.notes ?? "");
      parts.push(...(field.tags ?? []));
      parts.push(fieldValueToSearchText(field.value.data, field.type));
      const vp = formatProvenanceValidity(field.value.validity);
      if (vp) parts.push(vp);
      for (const proof of field.provenance.proofs ?? []) {
        parts.push(proof.title, proof.url ?? "", proof.excerpt ?? "");
      }
    }
  }
  const entityLists = migrateAnnotationsToLists(entity);
  parts.push(entriesSearchText(entityLists.contextEntries, entityLists.noteEntries));
  for (const proof of entity.provenance?.proofs ?? []) {
    parts.push(proof.title, proof.url ?? "", proof.excerpt ?? "");
  }
  for (const img of entity.gallery) {
    const imgLists = migrateAnnotationsToLists(img);
    parts.push(
      img.caption ?? "",
      entriesSearchText(imgLists.contextEntries, imgLists.noteEntries),
      img.description ?? "",
      img.notes ?? "",
    );
    parts.push(...(img.tags ?? []));
  }
  for (const att of entity.attachments ?? []) {
    const attLists = migrateAnnotationsToLists(att);
    parts.push(
      att.filename,
      entriesSearchText(attLists.contextEntries, attLists.noteEntries),
      att.description ?? "",
      att.notes ?? "",
    );
    parts.push(...(att.tags ?? []));
  }
  return parts.join("\n").toLowerCase();
}

export function findFieldMatches(
  entity: Entity,
  query: string,
): {
  sectionId: string;
  fieldId: string;
  sectionTitle: string;
  fieldLabel: string;
  snippet: string;
}[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: {
    sectionId: string;
    fieldId: string;
    sectionTitle: string;
    fieldLabel: string;
    snippet: string;
  }[] = [];

  for (const section of entity.sections) {
    for (const field of section.fields) {
      const text = fieldValueToSearchText(field.value.data, field.type);
      if (!text.toLowerCase().includes(q) && !field.label.toLowerCase().includes(q)) {
        continue;
      }
      const idx = text.toLowerCase().indexOf(q);
      let snippet = text.slice(0, 120);
      if (idx >= 0) {
        const start = Math.max(0, idx - 30);
        snippet = (start > 0 ? "…" : "") + text.slice(start, start + 90);
        if (start + 90 < text.length) snippet += "…";
      }
  matches.push({
        sectionId: section.id,
        fieldId: field.id,
        sectionTitle: section.title,
        fieldLabel: field.label,
        snippet: snippet || field.label,
      });
    }
  }
  return matches.slice(0, 3);
}
