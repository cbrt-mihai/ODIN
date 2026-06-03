import { fieldDisplayValue } from "@/lib/reports/shared";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { normalizeStoredValidity } from "@/lib/date-range/migrate";
import { mergeEntryPreview } from "@/lib/entities/merge-list-display";
import { kindLabel } from "@/lib/entries/helpers";
import { proofUploadLabel, proofItemHref } from "@/lib/proof/file";
import { PROOF_KINDS, CONTEXT_ENTRY_KINDS, NOTE_ENTRY_KINDS } from "@/lib/types";
import type {
  Attachment,
  ContextEntry,
  Entity,
  Field,
  GalleryImage,
  NoteEntry,
  ProofItem,
  Section,
  TimelineEvent,
} from "@/lib/types";

export type SectionMergeStrategy =
  | "keep_primary"
  | "use_secondary"
  | "merge_fields"
  | "keep_both";

export type ValiditySide = "primary" | "secondary";

export type FieldSideKey = `primary:${string}` | `secondary:${string}`;
export type SectionSideKey = `primary:${string}` | `secondary:${string}`;

export type FieldMergeChoice =
  | "primary"
  | "secondary"
  | "both"
  | "exclude";

export interface MergeProofRow {
  id: string;
  source: "primary" | "secondary";
  scope: "entity" | "section" | "field";
  scopeLabel: string;
  proof: ProofItem;
  summary: string;
  validityLabel: string;
}

export interface MergeFieldRow {
  id: string;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  primary?: Field;
  secondary?: Field;
  status: "both_same" | "both_differ" | "primary_only" | "secondary_only";
  valueValidityConflict: boolean;
  sourceValidityConflict: boolean;
}

export interface MergeSectionRow {
  key: string;
  title: string;
  primary?: Section;
  secondary?: Section;
  status: "both" | "primary_only" | "secondary_only";
  fields: MergeFieldRow[];
}

export interface MergeListItem {
  id: string;
  source: "primary" | "secondary";
  label: string;
  summary: string;
  /** Body or other detail shown when comparing primary vs duplicate. */
  detail?: string;
  conflict?: boolean;
}

export interface MergeMetadataRow {
  key: string;
  label: string;
  primary?: string;
  secondary?: string;
  conflict: boolean;
}

export interface MergeAnalysis {
  metadata: MergeMetadataRow[];
  tagItems: MergeListItem[];
  aliasItems: MergeListItem[];
  sections: MergeSectionRow[];
  proofs: MergeProofRow[];
  gallery: MergeListItem[];
  attachments: MergeListItem[];
  events: MergeListItem[];
  contextEntries: MergeListItem[];
  noteEntries: MergeListItem[];
  conflictCount: number;
}

export interface MergeSelections {
  displayName: "primary" | "secondary";
  slug: "primary" | "secondary";
  tags: Record<string, boolean>;
  aliases: Record<string, boolean>;
  primarySections: Record<string, boolean>;
  secondarySections: Record<string, SectionMergeStrategy>;
  fieldChoices: Record<string, FieldMergeChoice>;
  /** Override labels for kept fields. Keys: `primary:{fieldId}` or `secondary:{fieldId}`. */
  fieldLabels: Record<FieldSideKey, string>;
  /** Which side's value.validity to use for paired fields. Key: field row id. */
  fieldValueValidity: Record<string, ValiditySide>;
  /** Which side's provenance.validity to use for paired fields. Key: field row id. */
  fieldSourceValidity: Record<string, ValiditySide>;
  /** Override section titles when both are kept. Keys: `primary:{sectionId}` or `secondary:{sectionId}`. */
  sectionTitles: Record<SectionSideKey, string>;
  proofs: Record<string, boolean>;
  gallery: Record<string, boolean>;
  attachments: Record<string, boolean>;
  events: Record<string, boolean>;
  contextEntries: Record<string, boolean>;
  noteEntries: Record<string, boolean>;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function sectionKey(title: string) {
  return norm(title);
}

function fieldPairId(primary?: Field, secondary?: Field) {
  if (primary && secondary) return `pair:${primary.id}:${secondary.id}`;
  if (primary) return `primary:${primary.id}`;
  if (secondary) return `secondary:${secondary.id}`;
  return "";
}

function validityKey(field: Field, kind: "value" | "source") {
  const range =
    kind === "value" ? field.value.validity : field.provenance.validity;
  const normalized = normalizeStoredValidity(range);
  if (!normalized) return "";
  return JSON.stringify(normalized);
}

function fieldValidityConflicts(primary: Field, secondary: Field) {
  const valueValidityConflict =
    validityKey(primary, "value") !== validityKey(secondary, "value");
  const sourceValidityConflict =
    validityKey(primary, "source") !== validityKey(secondary, "source");
  return { valueValidityConflict, sourceValidityConflict };
}

export function fieldSideKey(
  side: ValiditySide,
  fieldId: string,
): FieldSideKey {
  return `${side}:${fieldId}`;
}

export function sectionSideKey(
  side: ValiditySide,
  sectionId: string,
): SectionSideKey {
  return `${side}:${sectionId}`;
}

export function defaultSecondaryFieldLabel(
  field: Field,
  primary?: Field,
): string {
  if (primary && norm(primary.label) === norm(field.label)) {
    return `${field.label} (duplicate)`;
  }
  return field.label;
}

export function defaultSecondarySectionTitle(title: string): string {
  return `${title} (duplicate)`;
}

function valuesEqual(a?: Field, b?: Field) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  return fieldDisplayValue(a).trim() === fieldDisplayValue(b).trim();
}

/** Types where matching fields pair by normalized value when labels differ. */
const VALUE_MATCH_TYPES = new Set<Field["type"]>([
  "email",
  "phone",
  "url",
  "entityLink",
]);

function fieldValueMatchKey(field: Field): string | null {
  if (!VALUE_MATCH_TYPES.has(field.type)) return null;
  const d = field.value.data;
  if (
    (field.type === "email" || field.type === "phone" || field.type === "url") &&
    typeof d === "string"
  ) {
    const v = d.trim();
    if (!v) return null;
    return `${field.type}:${norm(v)}`;
  }
  if (field.type === "entityLink" && d && typeof d === "object") {
    const entityId = (d as { entityId?: string }).entityId;
    if (entityId) return `entityLink:${entityId}`;
  }
  return null;
}

function fieldRowLabel(primary?: Field, secondary?: Field): string {
  if (primary && secondary && primary.label !== secondary.label) {
    return `${primary.label} ↔ ${secondary.label}`;
  }
  return primary?.label ?? secondary?.label ?? "";
}

function proofSummary(proof: ProofItem): string {
  const kind =
    PROOF_KINDS.find((k) => k.id === proof.kind)?.label ?? proof.kind;
  const href = proofItemHref(proof);
  const detail =
    proof.excerpt?.trim() ||
    href ||
    (proof.path ? proofUploadLabel(proof) : "") ||
  "";
  return [kind, proof.title, detail].filter(Boolean).join(" · ");
}

function collectProofRows(
  entity: Entity,
  source: "primary" | "secondary",
): Omit<MergeProofRow, "summary">[] {
  const rows: Omit<MergeProofRow, "summary">[] = [];
  for (const proof of entity.provenance?.proofs ?? []) {
    rows.push({
      id: `${source}:entity:${proof.id}`,
      source,
      scope: "entity",
      scopeLabel: "Entity",
      proof,
      validityLabel: "",
    });
  }
  for (const sec of entity.sections) {
    for (const proof of sec.provenance?.proofs ?? []) {
      rows.push({
        id: `${source}:section:${sec.id}:${proof.id}`,
        source,
        scope: "section",
        scopeLabel: sec.title,
        proof,
        validityLabel: "",
      });
    }
    for (const field of sec.fields) {
      for (const proof of field.provenance.proofs ?? []) {
        rows.push({
          id: `${source}:field:${field.id}:${proof.id}`,
          source,
          scope: "field",
          scopeLabel: `${sec.title} · ${field.label}`,
          proof,
          validityLabel: "",
        });
      }
    }
  }
  return rows;
}

function buildFieldRows(
  sectionKey: string,
  title: string,
  primary?: Section,
  secondary?: Section,
): MergeFieldRow[] {
  const primaryFields = [...(primary?.fields ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const secondaryFields = [...(secondary?.fields ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const usedPrimary = new Set<string>();
  const usedSecondary = new Set<string>();
  const rows: MergeFieldRow[] = [];

  const pushRow = (pf?: Field, sf?: Field) => {
    let status: MergeFieldRow["status"];
    if (pf && sf) {
      status = valuesEqual(pf, sf) ? "both_same" : "both_differ";
    } else if (pf) {
      status = "primary_only";
    } else {
      status = "secondary_only";
    }
    const validity =
      pf && sf
        ? fieldValidityConflicts(pf, sf)
        : { valueValidityConflict: false, sourceValidityConflict: false };
    rows.push({
      id: fieldPairId(pf, sf),
      sectionKey,
      sectionTitle: title,
      label: fieldRowLabel(pf, sf),
      primary: pf,
      secondary: sf,
      status,
      ...validity,
    });
  };

  const primaryByLabel = new Map<string, Field>();
  const secondaryByLabel = new Map<string, Field>();
  for (const f of primaryFields) {
    const key = norm(f.label);
    if (!primaryByLabel.has(key)) primaryByLabel.set(key, f);
  }
  for (const f of secondaryFields) {
    const key = norm(f.label);
    if (!secondaryByLabel.has(key)) secondaryByLabel.set(key, f);
  }

  const labelKeys = new Set([
    ...primaryByLabel.keys(),
    ...secondaryByLabel.keys(),
  ]);

  for (const label of labelKeys) {
    const pf = primaryByLabel.get(label);
    const sf = secondaryByLabel.get(label);
    if (!pf || !sf) continue;
    usedPrimary.add(pf.id);
    usedSecondary.add(sf.id);
    pushRow(pf, sf);
  }

  const secondaryByValue = new Map<string, Field[]>();
  for (const sf of secondaryFields) {
    if (usedSecondary.has(sf.id)) continue;
    const key = fieldValueMatchKey(sf);
    if (!key) continue;
    const list = secondaryByValue.get(key) ?? [];
    list.push(sf);
    secondaryByValue.set(key, list);
  }

  for (const pf of primaryFields) {
    if (usedPrimary.has(pf.id)) continue;
    const key = fieldValueMatchKey(pf);
    if (!key) continue;
    const candidates = secondaryByValue.get(key);
    const sf = candidates?.shift();
    if (!sf) continue;
    usedPrimary.add(pf.id);
    usedSecondary.add(sf.id);
    pushRow(pf, sf);
  }

  for (const pf of primaryFields) {
    if (!usedPrimary.has(pf.id)) pushRow(pf, undefined);
  }
  for (const sf of secondaryFields) {
    if (!usedSecondary.has(sf.id)) pushRow(undefined, sf);
  }

  return rows.sort((a, b) => {
    const ao = a.primary?.order ?? a.secondary?.order ?? 0;
    const bo = b.primary?.order ?? b.secondary?.order ?? 0;
    return ao - bo;
  });
}

function buildSectionRows(primary: Entity, secondary: Entity): MergeSectionRow[] {
  const byKey = new Map<string, MergeSectionRow>();

  for (const sec of primary.sections) {
    const key = sectionKey(sec.title);
    byKey.set(key, {
      key,
      title: sec.title,
      primary: sec,
      status: "primary_only",
      fields: [],
    });
  }

  for (const sec of secondary.sections) {
    const key = sectionKey(sec.title);
    const existing = byKey.get(key);
    if (existing) {
      existing.secondary = sec;
      existing.status = "both";
    } else {
      byKey.set(key, {
        key,
        title: sec.title,
        secondary: sec,
        status: "secondary_only",
        fields: [],
      });
    }
  }

  const rows = [...byKey.values()];
  for (const row of rows) {
    row.fields = buildFieldRows(row.key, row.title, row.primary, row.secondary);
  }

  return rows.sort((a, b) => {
    const ao = a.primary?.order ?? a.secondary?.order ?? 0;
    const bo = b.primary?.order ?? b.secondary?.order ?? 0;
    return ao - bo;
  });
}

function listUnionItems(
  primaryValues: string[],
  secondaryValues: string[],
  sourceLabel: { primary: string; secondary: string },
): MergeListItem[] {
  const map = new Map<string, MergeListItem>();
  for (const value of primaryValues) {
    const key = norm(value);
    map.set(key, {
      id: `primary:${key}`,
      source: "primary",
      label: value,
      summary: sourceLabel.primary,
    });
  }
  for (const value of secondaryValues) {
    const key = norm(value);
    const existing = map.get(key);
    if (existing) {
      existing.conflict = false;
      existing.summary = "On both records";
    } else {
      map.set(key, {
        id: `secondary:${key}`,
        source: "secondary",
        label: value,
        summary: sourceLabel.secondary,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function galleryItem(item: GalleryImage): MergeListItem {
  const label = item.caption?.trim() || item.url || item.path || "Image";
  return {
    id: item.id,
    source: "primary",
    label,
    summary: item.source === "url" ? "URL" : "Upload",
    detail: item.url || item.path || item.caption?.trim() || "(No preview text)",
  };
}

function attachmentItem(item: Attachment): MergeListItem {
  const label = item.caption?.trim() || item.filename;
  return {
    id: item.id,
    source: "primary",
    label,
    summary: item.mimeType,
    detail: [item.filename, item.caption?.trim()].filter(Boolean).join(" · ") || item.filename,
  };
}

function eventItem(item: TimelineEvent): MergeListItem {
  const date = item.occurredAt.slice(0, 10);
  const extra = item.type ? ` · ${item.type}` : "";
  const desc = item.description?.trim();
  return {
    id: item.id,
    source: "primary",
    label: item.title,
    summary: `${date}${extra}`,
    detail: desc || "(No description)",
  };
}

function contextItem(item: ContextEntry): MergeListItem {
  const kind = kindLabel(CONTEXT_ENTRY_KINDS, item.kind);
  return {
    id: item.id,
    source: "primary",
    label: item.title,
    summary: kind,
    detail: mergeEntryPreview(item.body),
  };
}

function noteItem(item: NoteEntry): MergeListItem {
  const kind = kindLabel(NOTE_ENTRY_KINDS, item.kind);
  return {
    id: item.id,
    source: "primary",
    label: item.title,
    summary: kind,
    detail: mergeEntryPreview(item.body),
  };
}

function sourcedItems<T>(
  primaryItems: T[],
  secondaryItems: T[],
  mapFn: (item: T, source: "primary" | "secondary") => MergeListItem,
): MergeListItem[] {
  return [
    ...primaryItems.map((item) => mapFn(item, "primary")),
    ...secondaryItems.map((item) => mapFn(item, "secondary")),
  ];
}

export function analyzeEntityMerge(
  primary: Entity,
  secondary: Entity,
): MergeAnalysis {
  const metadata: MergeMetadataRow[] = [
    {
      key: "displayName",
      label: "Display name",
      primary: primary.displayName,
      secondary: secondary.displayName,
      conflict: norm(primary.displayName) !== norm(secondary.displayName),
    },
    {
      key: "slug",
      label: "Slug",
      primary: primary.slug,
      secondary: secondary.slug,
      conflict: (primary.slug ?? "") !== (secondary.slug ?? ""),
    },
  ];

  const sections = buildSectionRows(primary, secondary);
  const tagItems = listUnionItems(primary.tags ?? [], secondary.tags ?? [], {
    primary: "Primary only",
    secondary: "Duplicate only",
  });
  const aliasItems = listUnionItems(
    primary.aliases ?? [],
    secondary.aliases ?? [],
    { primary: "Primary only", secondary: "Duplicate only" },
  );

  const proofs = [
    ...collectProofRows(primary, "primary"),
    ...collectProofRows(secondary, "secondary"),
  ].map((row) => ({
    ...row,
    summary: proofSummary(row.proof),
    validityLabel: formatProvenanceValidity(row.proof.validity) || "—",
  }));

  const gallery = sourcedItems(
    primary.gallery,
    secondary.gallery,
    (item, source) => ({ ...galleryItem(item), source, id: `${source}:${item.id}` }),
  );
  const attachments = sourcedItems(
    primary.attachments ?? [],
    secondary.attachments ?? [],
    (item, source) => ({
      ...attachmentItem(item),
      source,
      id: `${source}:${item.id}`,
    }),
  );
  const events = sourcedItems(primary.events, secondary.events, (item, source) => ({
    ...eventItem(item),
    source,
    id: `${source}:${item.id}`,
  }));
  const contextEntries = sourcedItems(
    primary.contextEntries ?? [],
    secondary.contextEntries ?? [],
    (item, source) => ({
      ...contextItem(item),
      source,
      id: `${source}:${item.id}`,
    }),
  );
  const noteEntries = sourcedItems(
    primary.noteEntries ?? [],
    secondary.noteEntries ?? [],
    (item, source) => ({
      ...noteItem(item),
      source,
      id: `${source}:${item.id}`,
    }),
  );

  let conflictCount = metadata.filter((m) => m.conflict).length;
  for (const sec of sections) {
    if (sec.status === "both") conflictCount += 1;
    for (const f of sec.fields) {
      if (f.status === "both_differ") conflictCount += 1;
      if (f.valueValidityConflict || f.sourceValidityConflict) conflictCount += 1;
    }
  }

  return {
    metadata,
    tagItems,
    aliasItems,
    sections,
    proofs,
    gallery,
    attachments,
    events,
    contextEntries,
    noteEntries,
    conflictCount,
  };
}

export function defaultMergeSelections(
  analysis: MergeAnalysis,
): MergeSelections {
  const tags: Record<string, boolean> = {};
  for (const item of analysis.tagItems) tags[item.id] = true;

  const aliases: Record<string, boolean> = {};
  for (const item of analysis.aliasItems) aliases[item.id] = true;

  const primarySections: Record<string, boolean> = {};
  const secondarySections: Record<string, SectionMergeStrategy> = {};
  const fieldChoices: Record<string, FieldMergeChoice> = {};
  const fieldLabels: MergeSelections["fieldLabels"] = {};
  const fieldValueValidity: MergeSelections["fieldValueValidity"] = {};
  const fieldSourceValidity: MergeSelections["fieldSourceValidity"] = {};
  const sectionTitles: MergeSelections["sectionTitles"] = {};

  for (const sec of analysis.sections) {
    if (sec.primary) primarySections[sec.primary.id] = true;
    if (sec.secondary) {
      secondarySections[sec.secondary.id] =
        sec.status === "both" ? "merge_fields" : "use_secondary";
      if (sec.status === "both") {
        sectionTitles[sectionSideKey("secondary", sec.secondary.id)] =
          defaultSecondarySectionTitle(sec.title);
      }
    }
    for (const field of sec.fields) {
      if (field.status === "both_differ") fieldChoices[field.id] = "primary";
      else if (field.status === "both_same") fieldChoices[field.id] = "primary";
      else if (field.status === "primary_only") fieldChoices[field.id] = "primary";
      else fieldChoices[field.id] = "secondary";

      if (field.primary) {
        fieldLabels[fieldSideKey("primary", field.primary.id)] =
          field.primary.label;
      }
      if (field.secondary) {
        fieldLabels[fieldSideKey("secondary", field.secondary.id)] =
          field.status === "both_same" || field.status === "both_differ"
            ? defaultSecondaryFieldLabel(field.secondary, field.primary)
            : field.secondary.label;
      }

      if (field.primary && field.secondary) {
        fieldValueValidity[field.id] = "primary";
        fieldSourceValidity[field.id] = "primary";
      }
    }
  }

  const proofs: Record<string, boolean> = {};
  for (const p of analysis.proofs) proofs[p.id] = true;

  const boolMap = (items: MergeListItem[]) =>
    Object.fromEntries(items.map((i) => [i.id, true]));

  return {
    displayName: "primary",
    slug: "primary",
    tags,
    aliases,
    primarySections,
    secondarySections,
    fieldChoices,
    fieldLabels,
    fieldValueValidity,
    fieldSourceValidity,
    sectionTitles,
    proofs,
    gallery: boolMap(analysis.gallery),
    attachments: boolMap(analysis.attachments),
    events: boolMap(analysis.events),
    contextEntries: boolMap(analysis.contextEntries),
    noteEntries: boolMap(analysis.noteEntries),
  };
}

export function proofSummaryText(proof: ProofItem): string {
  return proofSummary(proof);
}

/** @deprecated legacy shape — mapped for callers still passing old options */
export type LegacyMergeOptions = {
  sectionChoices: Record<string, "primary" | "secondary" | "both">;
  fieldChoices: Record<string, "primary" | "secondary">;
};

export function legacyToSelections(
  primary: Entity,
  secondary: Entity,
  legacy: LegacyMergeOptions,
): MergeSelections {
  const analysis = analyzeEntityMerge(primary, secondary);
  const selections = defaultMergeSelections(analysis);

  for (const sec of secondary.sections) {
    const choice = legacy.sectionChoices[sec.id] ?? "both";
    if (choice === "primary") {
      selections.secondarySections[sec.id] = "keep_primary";
    } else if (choice === "secondary") {
      selections.secondarySections[sec.id] = "use_secondary";
    } else {
      selections.secondarySections[sec.id] = "merge_fields";
    }
  }

  for (const row of analysis.sections.flatMap((s) => s.fields)) {
    if (!row.secondary) continue;
    const legacyChoice = legacy.fieldChoices[row.secondary.id];
    if (legacyChoice === "secondary") selections.fieldChoices[row.id] = "secondary";
    else selections.fieldChoices[row.id] = "primary";
  }

  return selections;
}
