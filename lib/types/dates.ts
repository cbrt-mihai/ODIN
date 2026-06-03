/** How a range bound is specified. */
export type DateBoundKind = "known" | "unknown" | "present";

export interface DateBound {
  kind: DateBoundKind;
  /** ISO date (or datetime) when kind is `known`. */
  value?: string;
  precision?: "day" | "month" | "year";
  /** Per-bound confidence (confirmation). */
  confidence?: string;
}

/** Anchor when both range ends are unknown but a middle date is known. */
export interface KnownMiddle {
  value: string;
  precision?: "day" | "month" | "year";
  /** Text shown before the date (default “Around”). */
  prefix?: string;
  /** @deprecated Use `prefix` */
  label?: string;
  confidence?: string;
}

/** One or more validity / date-range periods. */
export interface DateRangesValue {
  entries: DateRangeValue[];
}

export interface DateRangeValue {
  start: DateBound;
  end: DateBound;
  knownMiddle?: KnownMiddle;
  /** Describes the period (e.g. employment, peak activity). */
  label?: string;
  notes?: string;
}

export interface DateEntry {
  id: string;
  validity: DateRangeValue;
  /** @deprecated Migrated to `validity` on load */
  date?: string;
  useDateTime?: boolean;
  confidence?: string;
  description?: string;
  descriptionFlavor?: "plain" | "markdown" | "obsidian";
  tags?: string[];
  notes?: string;
  notesFlavor?: "plain" | "markdown" | "obsidian";
}

export interface DatesValue {
  entries: DateEntry[];
}

export interface LocationValue {
  label?: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  notes?: string;
}

export function defaultDateBound(): DateBound {
  return { kind: "unknown" };
}

export function defaultDateRangeValue(): DateRangeValue {
  return {
    start: defaultDateBound(),
    end: defaultDateBound(),
  };
}

export function defaultDateRangesValue(): DateRangesValue {
  return { entries: [] };
}

export function defaultDateEntry(
  partial?: Partial<DateEntry>,
): DateEntry {
  return {
    id: partial?.id ?? "",
    validity: partial?.validity ?? defaultDateRangeValue(),
    tags: partial?.tags ?? [],
    ...partial,
  };
}

export function defaultDatesValue(): DatesValue {
  return { entries: [] };
}

export function defaultLocationValue(): LocationValue {
  return {};
}
