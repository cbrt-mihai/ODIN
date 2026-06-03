import { formatProvenanceValidity } from "@/lib/date-range/format";
import type { Field } from "@/lib/types";

export interface MergeFieldMetaLine {
  label: string;
  tone?: "muted" | "accent" | "warn";
}

export function fieldPeriodLabel(
  field: Field,
  kind: "value" | "source",
): string {
  const range =
    kind === "value" ? field.value.validity : field.provenance.validity;
  return formatProvenanceValidity(range) || "(none)";
}

export function mergeFieldMetaLines(field: Field): MergeFieldMetaLine[] {
  const lines: MergeFieldMetaLine[] = [];

  const valuePeriod = formatProvenanceValidity(field.value.validity);
  if (valuePeriod) {
    lines.push({ label: `Value period: ${valuePeriod}`, tone: "accent" });
  }

  const sourcePeriod = formatProvenanceValidity(field.provenance.validity);
  if (sourcePeriod) {
    lines.push({ label: `Source period: ${sourcePeriod}`, tone: "accent" });
  }

  if (field.provenance.notes?.trim()) {
    lines.push({
      label: `Source notes: ${field.provenance.notes.trim().slice(0, 120)}${
        field.provenance.notes.length > 120 ? "…" : ""
      }`,
      tone: "muted",
    });
  }

  const ctx = field.contextEntries ?? [];
  if (ctx.length > 0) {
    lines.push({
      label: `${ctx.length} context ${ctx.length === 1 ? "entry" : "entries"}: ${ctx.map((c) => c.title).join(", ")}`,
      tone: "muted",
    });
  }

  const notes = field.noteEntries ?? [];
  if (notes.length > 0) {
    lines.push({
      label: `${notes.length} investigation ${notes.length === 1 ? "note" : "notes"}: ${notes.map((n) => n.title).join(", ")}`,
      tone: "muted",
    });
  }

  const proofs = field.provenance.proofs ?? [];
  if (proofs.length > 0) {
    lines.push({
      label: `${proofs.length} field evidence item${proofs.length === 1 ? "" : "s"}`,
      tone: "warn",
    });
  }

  return lines;
}
