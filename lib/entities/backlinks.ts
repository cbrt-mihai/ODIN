import { extractInternalRefs } from "@/lib/references/parse";
import { buildReferenceIndex } from "@/lib/references/path";
import { resolveInternalRef } from "@/lib/references/resolve";
import { resolveWikilink } from "@/lib/markdown/resolve-wikilink";
import { isMarkdownFlavor } from "@/lib/markdown/flavor";
import { effectiveValueFlavor } from "@/lib/field-value-display";
import type { Case, Entity, Field, Group } from "@/lib/types";

export type EntityLinkBacklink = {
  entityId: string;
  displayName: string;
  sectionTitle: string;
  fieldLabel: string;
};

export type WikilinkBacklink = {
  entityId: string;
  displayName: string;
  sectionTitle: string;
  fieldLabel: string;
  linkText: string;
};

export type FieldBacklink = {
  sourceEntityId: string;
  displayName: string;
  sectionTitle: string;
  fieldLabel: string;
  linkText: string;
};

export type CaseBacklink = {
  sourceEntityId?: string;
  sourceCaseId?: string;
  displayName: string;
  sectionTitle: string;
  fieldLabel: string;
  linkText: string;
};

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function fieldText(field: Field): string {
  if (typeof field.value.data === "string") return field.value.data;
  return "";
}

function isMarkdownBackedField(field: Field): boolean {
  if (field.type === "richMarkdown" || field.type === "obsidianMarkdown") {
    return true;
  }
  if (field.type === "shortText" || field.type === "longText") {
    return isMarkdownFlavor(effectiveValueFlavor(field));
  }
  return false;
}

function scanMarkdownFields(
  entities: Entity[],
  cases: Case[],
  groups: Group[] = [],
  onText: (
    text: string,
    source: {
      entityId?: string;
      caseId?: string;
      displayName: string;
      sectionTitle: string;
      fieldLabel: string;
    },
  ) => void,
) {
  for (const e of entities) {
    for (const s of e.sections) {
      for (const f of s.fields) {
        if (!isMarkdownBackedField(f)) continue;
        const text = fieldText(f);
        if (!text) continue;
        onText(text, {
          entityId: e.id,
          displayName: e.displayName,
          sectionTitle: s.title,
          fieldLabel: f.label,
        });
      }
    }
  }

  for (const c of cases) {
    if (!c.description?.trim()) continue;
    onText(c.description, {
      caseId: c.id,
      displayName: c.title,
      sectionTitle: "Case",
      fieldLabel: "Description",
    });
  }

  for (const g of groups) {
    if (!g.description?.trim()) continue;
    onText(g.description, {
      displayName: g.title,
      sectionTitle: "Group",
      fieldLabel: "Description",
    });
  }
}

export function findEntityLinkBacklinks(
  targetEntityId: string,
  entities: Entity[],
): EntityLinkBacklink[] {
  const out: EntityLinkBacklink[] = [];
  for (const e of entities) {
    if (e.id === targetEntityId) continue;
    for (const s of e.sections) {
      for (const f of s.fields) {
        if (f.type !== "entityLink") continue;
        const data = f.value.data as { entityId?: string } | undefined;
        if (data?.entityId === targetEntityId) {
          out.push({
            entityId: e.id,
            displayName: e.displayName,
            sectionTitle: s.title,
            fieldLabel: f.label,
          });
        }
      }
    }
  }
  return out;
}

export function findWikilinkBacklinks(
  targetEntityId: string,
  entities: Entity[],
  cases: Case[] = [],
  groups: Group[] = [],
): WikilinkBacklink[] {
  const out: WikilinkBacklink[] = [];
  scanMarkdownFields(entities, cases, groups, (text, source) => {
    if (source.entityId === targetEntityId) return;
    let m: RegExpExecArray | null;
    WIKILINK_RE.lastIndex = 0;
    while ((m = WIKILINK_RE.exec(text)) !== null) {
      const resolved = resolveWikilink(m[1], entities, cases);
      const href = resolved?.href ?? "";
      const match = href.match(/^\/entities\/([a-f0-9-]+)$/i);
      if (match?.[1] === targetEntityId) {
        out.push({
          entityId: source.entityId!,
          displayName: source.displayName,
          sectionTitle: source.sectionTitle,
          fieldLabel: source.fieldLabel,
          linkText: m[1],
        });
      }
    }
  });
  return out;
}

export function findFieldBacklinks(
  targetEntityId: string,
  targetFieldId: string,
  entities: Entity[],
  cases: Case[] = [],
  groups: Group[] = [],
): FieldBacklink[] {
  const ctx = { entities, cases, index: buildReferenceIndex(entities, cases) };
  const out: FieldBacklink[] = [];

  scanMarkdownFields(entities, cases, groups, (text, source) => {
    if (source.entityId === targetEntityId) return;
    for (const ref of extractInternalRefs(text)) {
      const resolved = resolveInternalRef(ref, ctx);
      if (
        resolved?.kind === "field" &&
        resolved.meta?.entityId === targetEntityId &&
        resolved.meta?.fieldId === targetFieldId &&
        source.entityId
      ) {
        out.push({
          sourceEntityId: source.entityId,
          displayName: source.displayName,
          sectionTitle: source.sectionTitle,
          fieldLabel: source.fieldLabel,
          linkText: ref,
        });
      }
    }
  });

  return out;
}

export function findCaseBacklinks(
  targetCaseId: string,
  entities: Entity[],
  cases: Case[] = [],
  groups: Group[] = [],
): CaseBacklink[] {
  const ctx = { entities, cases, index: buildReferenceIndex(entities, cases) };
  const out: CaseBacklink[] = [];

  scanMarkdownFields(entities, cases, groups, (text, source) => {
    if (source.caseId === targetCaseId) return;
    for (const ref of extractInternalRefs(text)) {
      const resolved = resolveInternalRef(ref, ctx);
      if (!resolved?.meta?.caseId || resolved.meta.caseId !== targetCaseId) {
        continue;
      }
      out.push({
        sourceEntityId: source.entityId,
        sourceCaseId: source.caseId,
        displayName: source.displayName,
        sectionTitle: source.sectionTitle,
        fieldLabel: source.fieldLabel,
        linkText: ref,
      });
    }
  });

  return out;
}
