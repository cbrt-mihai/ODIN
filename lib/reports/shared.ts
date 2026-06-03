import { isDebunked } from "@/lib/confidence";
import {
  formatDateRanges,
  formatDates,
  formatLocation,
  formatProvenanceValidity,
} from "@/lib/date-range/format";
import { migrateFieldValueData } from "@/lib/date-range/migrate";
import type {
  ConfidenceTypeDefinition,
  DateRangesValue,
  DatesValue,
  Field,
  LocationValue,
  Section,
} from "@/lib/types";

export function filterReportFields(
  sections: Section[],
  confidenceTypes: ConfidenceTypeDefinition[],
  omitDebunked = true,
): Section[] {
  if (!omitDebunked) return sections;
  return sections
    .map((sec) => ({
      ...sec,
      fields: sec.fields.filter(
        (f) => !isDebunked(f.provenance.confidence, confidenceTypes),
      ),
    }))
    .filter((sec) => sec.fields.length > 0);
}

export function fieldDisplayValue(field: Field): string {
  const d = migrateFieldValueData(field.type, field.value.data);
  if (
    (field.type === "dateRange" ||
      field.type === "date" ||
      field.type === "datetime") &&
    d &&
    d &&
    typeof d === "object" &&
    "entries" in d
  ) {
    return formatDateRanges(d as DateRangesValue);
  }
  if (field.type === "dates" && d && typeof d === "object") {
    return formatDates(d as DatesValue);
  }
  if (field.type === "location" && d && typeof d === "object") {
    return formatLocation(d as LocationValue);
  }
  if (typeof d === "string") return d;
  if (typeof d === "number" || typeof d === "boolean") return String(d);
  if (Array.isArray(d)) return d.join(", ");
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    if ("entityId" in o && typeof o.entityId === "string") return o.entityId;
    if ("url" in o && typeof o.url === "string") return o.url;
    return JSON.stringify(d);
  }
  return "";
}

export function fieldFootnote(
  field: Field,
  confLabel: (id: string) => string,
): string {
  const parts = [confLabel(field.provenance.confidence)];
  const valuePeriod = formatProvenanceValidity(field.value.validity);
  if (valuePeriod) parts.push(`Value period: ${valuePeriod}`);
  const sourcePeriod = formatProvenanceValidity(field.provenance.validity);
  if (sourcePeriod) parts.push(`Source period: ${sourcePeriod}`);
  if (field.provenance.source) parts.push(field.provenance.source);
  if (field.provenance.collectedAt) {
    parts.push(`Collected ${field.provenance.collectedAt.slice(0, 10)}`);
  }
  return parts.join(" · ");
}

export function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
