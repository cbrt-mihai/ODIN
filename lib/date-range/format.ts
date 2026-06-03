import { migrateDateEntry } from "@/lib/date-range/migrate";
import type {
  DateBound,
  DateBoundKind,
  DateRangeValue,
  DateRangesValue,
  DateEntry,
  DatesValue,
  KnownMiddle,
  LocationValue,
  ValidityRange,
} from "@/lib/types";

/** Fixed locale + UTC so SSR and client render the same string. */
const isoDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatIsoDate(iso: string): string {
  const raw = iso.slice(0, iso.includes("T") ? 10 : iso.length);
  const parsed = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return isoDateFormatter.format(parsed);
}

function formatKnownDate(
  iso: string,
  precision?: "day" | "month" | "year",
): string {
  const date = formatIsoDate(iso);
  return precision && precision !== "day" ? `${date} (${precision})` : date;
}

function formatKnownBound(bound: DateBound): string | null {
  if (bound.kind !== "known" || !bound.value) return null;
  return formatKnownDate(bound.value, bound.precision);
}

function rangeLabel(value: DateRangeValue): string | undefined {
  return value.label?.trim() || value.knownMiddle?.label?.trim() || undefined;
}

function withRangeLabel(label: string | undefined, span: string): string {
  return label ? `${label} · ${span}` : span;
}

function knownMiddlePrefix(middle: KnownMiddle): string {
  return (
    middle.prefix?.trim() ||
    middle.label?.trim() ||
    "Around"
  );
}

function formatKnownMiddleAnchor(
  middle: KnownMiddle,
  rangeLabel?: string,
): string {
  const date = formatKnownDate(middle.value, middle.precision);
  if (rangeLabel) return `${rangeLabel} · ${date}`;
  return `${knownMiddlePrefix(middle)} ${date}`;
}

function formatRangeSpan(value: DateRangeValue): string {
  const start = formatKnownBound(value.start);
  const end = formatKnownBound(value.end);
  const startUnknown = value.start.kind === "unknown";
  const endUnknown = value.end.kind === "unknown";
  const endPresent = value.end.kind === "present";
  const startPresent = value.start.kind === "present";

  if (startUnknown && endUnknown) return "Period not specified";
  if (start && end) return `${start} – ${end}`;
  if (start && endPresent) return `${start} – present`;
  if (start && endUnknown) return `From ${start}`;
  if (startUnknown && end) return `Until ${end}`;
  if (startUnknown && endPresent) return "Ongoing";
  if (startPresent && end) return `Until ${end}`;
  if (startPresent && (endPresent || endUnknown)) return "Ongoing";
  if (start) return start;
  if (end) return end;
  if (endPresent || startPresent) return "Ongoing";
  return "Period not specified";
}

/** True when the range has no known bounds, label, or notes. */
export function isEmptyDateRange(value: DateRangeValue): boolean {
  const startEmpty =
    value.start.kind === "unknown" ||
    (value.start.kind === "known" && !value.start.value?.trim());
  const endEmpty =
    value.end.kind === "unknown" ||
    (value.end.kind === "known" && !value.end.value?.trim());
  const noPresent = value.start.kind !== "present" && value.end.kind !== "present";
  return (
    startEmpty &&
    endEmpty &&
    noPresent &&
    !value.knownMiddle?.value?.trim() &&
    !value.label?.trim() &&
    !value.notes?.trim()
  );
}

export function isEmptyDateRanges(value: DateRangesValue): boolean {
  if (!value.entries.length) return true;
  return value.entries.every((e) => isEmptyDateRange(e));
}

export function formatDateRanges(value: DateRangesValue): string {
  const parts = value.entries
    .map((e) => formatDateRange(e))
    .filter((line) => line && line !== "Period not specified");
  if (!parts.length) return "—";
  return parts.join("; ");
}

export function formatDateRange(value: DateRangeValue): string {
  const startUnknown = value.start.kind === "unknown";
  const endUnknown = value.end.kind === "unknown";
  const label = rangeLabel(value);

  if (startUnknown && endUnknown && value.knownMiddle?.value) {
    const base = formatKnownMiddleAnchor(value.knownMiddle, label);
    return value.notes ? `${base} — ${value.notes}` : base;
  }

  const range = withRangeLabel(label, formatRangeSpan(value));
  return value.notes ? `${range} — ${value.notes}` : range;
}

export function formatDates(value: DatesValue): string {
  if (!value.entries.length) return "—";
  return value.entries
    .map((e) => {
      const range = migrateDateEntry(e).validity;
      const line = formatDateRange(range);
      const conf = e.confidence ? ` [${e.confidence}]` : "";
      const note = e.notes ? ` (${e.notes})` : "";
      return `${line}${conf}${note}`;
    })
    .join("; ");
}

export function formatLocation(value: LocationValue): string {
  const parts: string[] = [];
  if (value.label) parts.push(value.label);
  if (value.address) parts.push(value.address);
  if (value.lat != null && value.lng != null) {
    parts.push(`${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`);
  }
  if (value.notes) parts.push(value.notes);
  return parts.length ? parts.join(" · ") : "—";
}

export function isDateRangeValue(v: unknown): v is DateRangeValue {
  return (
    v !== null &&
    typeof v === "object" &&
    "start" in v &&
    "end" in v &&
    typeof (v as DateRangeValue).start === "object" &&
    typeof (v as DateRangeValue).end === "object"
  );
}

export function isDateRangesValue(v: unknown): v is DateRangesValue {
  return (
    v !== null &&
    typeof v === "object" &&
    "entries" in v &&
    Array.isArray((v as DateRangesValue).entries)
  );
}

/** Convert legacy validFrom/validTo or pass through a single modern range. */
export function normalizeValidityRange(
  validity: DateRangeValue | ValidityRange | undefined,
): DateRangeValue | undefined {
  if (!validity) return undefined;
  if (isDateRangeValue(validity)) return validity;
  const legacy = validity as ValidityRange;
  if (!legacy.validFrom && !legacy.validTo && !legacy.notes) return undefined;
  return {
    start: legacy.validFrom
      ? { kind: "known", value: legacy.validFrom, precision: legacy.precision }
      : { kind: "unknown" },
    end: legacy.validTo
      ? { kind: "known", value: legacy.validTo, precision: legacy.precision }
      : { kind: "unknown" },
    notes: legacy.notes,
  };
}

export function formatProvenanceValidity(
  validity:
    | DateRangesValue
    | DateRangeValue
    | ValidityRange
    | undefined,
): string {
  if (!validity) return "";
  if (isDateRangesValue(validity)) {
    return formatDateRanges(validity);
  }
  const range = normalizeValidityRange(
    validity as DateRangeValue | ValidityRange,
  );
  if (!range) return "";
  return formatDateRange(range);
}

export const DATE_BOUND_KINDS: { id: DateBoundKind; label: string }[] = [
  { id: "known", label: "Known date" },
  { id: "unknown", label: "Unknown" },
  { id: "present", label: "Present / ongoing" },
];
