import { formatProvenanceValidity } from "@/lib/date-range/format";
import { fieldValueUsesDateRangeData } from "@/lib/date-range/migrate";
import { migrateAnnotationsToLists, entriesSearchText } from "@/lib/entries/helpers";
import { proofCount } from "@/lib/proof/helpers";
import { normalizeProvenance } from "@/lib/proof/helpers";
import type { EntryAnnotations, Field, Provenance } from "@/lib/types";

export function hasEntryContext(ann: EntryAnnotations & {
  contextEntries?: Field["contextEntries"];
  noteEntries?: Field["noteEntries"];
}): boolean {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(ann);
  return contextEntries.length > 0 || noteEntries.length > 0;
}

export function hasProvenanceMeta(p: Provenance): boolean {
  const prov = normalizeProvenance(p);
  return Boolean(
    prov.source?.trim() ||
      prov.sourceUrl?.trim() ||
      proofCount(prov) > 0 ||
      hasEntryContext(prov),
  );
}

export function fieldMetaSummary(field: Field): string | null {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
  const parts: string[] = [];
  if (contextEntries.length > 0) {
    parts.push(`${contextEntries.length} context`);
  }
  if (noteEntries.length > 0) {
    parts.push(`${noteEntries.length} note${noteEntries.length === 1 ? "" : "s"}`);
  }
  const proofs = proofCount(field.provenance);
  if (proofs > 0) parts.push(`${proofs} proof${proofs === 1 ? "" : "s"}`);
  if (
    field.provenance.source?.trim() ||
    field.provenance.sourceUrl?.trim()
  ) {
    parts.push("Source");
  }
  if (
    !fieldValueUsesDateRangeData(field.type) &&
    formatProvenanceValidity(field.value.validity)
  ) {
    parts.push("Value period");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function fieldSearchExtras(field: Field): string {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
  return [
    entriesSearchText(contextEntries, noteEntries),
    field.description ?? "",
    field.notes ?? "",
    ...(field.tags ?? []),
  ].join("\n");
}
