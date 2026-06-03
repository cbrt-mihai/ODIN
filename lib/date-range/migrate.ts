import {
  isDateRangeValue,
  isDateRangesValue,
  isEmptyDateRange,
  normalizeValidityRange,
} from "@/lib/date-range/format";
import {
  defaultDateBound,
  defaultDateRangeValue,
  defaultDateRangesValue,
  type DateEntry,
  type DateRangeValue,
  type DateRangesValue,
  type FieldTypeId,
  type ProofItem,
} from "@/lib/types";

const DATE_VALUE_FIELD_TYPES = new Set<FieldTypeId>([
  "date",
  "datetime",
  "dateRange",
  "dates",
]);

export function fieldValueUsesDateRangeData(type: FieldTypeId) {
  return DATE_VALUE_FIELD_TYPES.has(type);
}

/** Normalize legacy single range or modern multi-range storage. */
export function migrateDateRangesValue(data: unknown): DateRangesValue {
  if (isDateRangesValue(data)) {
    return {
      entries: data.entries
        .filter(isDateRangeValue)
        .map((e) => normalizeValidityRange(e) ?? e),
    };
  }
  const single = isDateRangeValue(data)
    ? data
    : normalizeValidityRange(
        data as DateRangeValue | import("@/lib/types").ValidityRange | undefined,
      );
  if (single && !isEmptyDateRange(single)) {
    return { entries: [single] };
  }
  return defaultDateRangesValue();
}

/** Single known instant as a degenerate range (start = end). */
export function pointDateRangeFromIso(
  iso: string,
  useDateTime?: boolean,
): DateRangeValue {
  return {
    start: {
      kind: "known",
      value: iso,
      precision: useDateTime ? "day" : "day",
    },
    end: {
      kind: "known",
      value: iso,
      precision: useDateTime ? "day" : "day",
    },
  };
}

export function migrateDateEntry(entry: DateEntry): DateEntry {
  if (entry.validity && isDateRangeValue(entry.validity)) {
    return entry;
  }
  if (entry.date) {
    return {
      ...entry,
      validity: pointDateRangeFromIso(entry.date, entry.useDateTime),
    };
  }
  return {
    ...entry,
    validity: defaultDateRangeValue(),
  };
}

export function migrateDatesValue(
  value: { entries: DateEntry[] } | undefined,
): { entries: DateEntry[] } {
  if (!value?.entries?.length) return { entries: [] };
  return { entries: value.entries.map(migrateDateEntry) };
}

export function migrateFieldValueData(
  type: FieldTypeId,
  data: unknown,
): unknown {
  if (type === "dateRange") {
    return migrateDateRangesValue(data);
  }
  if (type === "dates" && data && typeof data === "object") {
    return migrateDatesValue(data as { entries: DateEntry[] });
  }
  if ((type === "date" || type === "datetime") && typeof data === "string" && data) {
    return migrateDateRangesValue(pointDateRangeFromIso(
      data,
      type === "datetime" || data.includes("T"),
    ));
  }
  if (type === "date" || type === "datetime") {
    return migrateDateRangesValue(data);
  }
  return data;
}

export function migrateProofItem(proof: ProofItem): ProofItem {
  return {
    ...proof,
    validity: migrateDateRangesValue(proof.validity),
  };
}

export function migrateProofList(proofs?: ProofItem[]): ProofItem[] {
  return (proofs ?? []).map(migrateProofItem);
}

/** Stored validity for provenance, proof, and field metadata — empty periods removed. */
export function normalizeStoredValidity(
  validity: unknown,
): DateRangesValue | undefined {
  const migrated = migrateDateRangesValue(validity);
  const entries = migrated.entries.filter((e) => !isEmptyDateRange(e));
  if (!entries.length) return undefined;
  return { entries };
}
