"use client";

import { formatDateRange } from "@/lib/date-range/format";
import { confidenceBadgeStyle } from "@/lib/confidence";
import type { ConfidenceTypeDefinition, DateRangeValue } from "@/lib/types";

function confidenceLabel(
  id: string | undefined,
  types: ConfidenceTypeDefinition[],
) {
  if (!id) return null;
  return types.find((c) => c.id === id)?.label ?? id;
}

type CertaintyItem = { key: string; prefix: string; confidence: string };

function certaintyItems(range: DateRangeValue): CertaintyItem[] {
  const items: CertaintyItem[] = [];
  if (range.start.confidence) {
    items.push({
      key: "start",
      prefix: "Start",
      confidence: range.start.confidence,
    });
  }
  if (range.end.confidence) {
    items.push({
      key: "end",
      prefix: "End",
      confidence: range.end.confidence,
    });
  }
  if (range.knownMiddle?.confidence) {
    items.push({
      key: "middle",
      prefix: "Anchor",
      confidence: range.knownMiddle.confidence,
    });
  }
  return items;
}

function CompactCertainty({
  range,
  confidenceTypes,
}: {
  range: DateRangeValue;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const items = certaintyItems(range);
  if (!items.length) return null;

  if (items.length === 1) {
    const item = items[0];
    const label = confidenceLabel(item.confidence, confidenceTypes);
    if (!label) return null;
    return (
      <span
        className="rounded px-1 py-0.5"
        style={confidenceBadgeStyle(item.confidence, confidenceTypes)}
      >
        {label}
      </span>
    );
  }

  return (
    <>
      {items.map((item, index) => {
        const label = confidenceLabel(item.confidence, confidenceTypes);
        if (!label) return null;
        return (
          <span key={item.key}>
            {index > 0 && (
              <span className="text-zinc-600" aria-hidden>
                {" · "}
              </span>
            )}
            <span
              className="rounded px-1 py-0.5"
              style={confidenceBadgeStyle(item.confidence, confidenceTypes)}
            >
              {item.prefix}: {label}
            </span>
          </span>
        );
      })}
    </>
  );
}

/** @deprecated Use compact layout via {@link DateRangesReadonly}. */
export function DateRangeConfidenceReadonly({
  range,
  confidenceTypes,
}: {
  range: DateRangeValue;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  return (
    <CompactCertainty range={range} confidenceTypes={confidenceTypes} />
  );
}

export function DateRangesReadonly({
  ranges,
  confidenceTypes,
  multiLabel = "Period",
  labelAfterCertainty,
}: {
  ranges: DateRangeValue[];
  confidenceTypes: ConfidenceTypeDefinition[];
  multiLabel?: string;
  /** Inline label between certainty and the date string, e.g. "Valid period". */
  labelAfterCertainty?: string;
}) {
  if (!ranges.length) {
    return <span className="text-zinc-500">—</span>;
  }

  return (
    <div className="space-y-1.5 text-zinc-200">
      {ranges.map((range, i) => {
        const dateText = formatDateRange(range) || "—";
        const hasCertainty = certaintyItems(range).length > 0;

        return (
          <div key={i}>
            {ranges.length > 1 && (
              <p className="mb-0.5 text-[11px] font-medium text-zinc-500">
                {multiLabel} {i + 1}
              </p>
            )}
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed text-zinc-300">
              {hasCertainty && (
                <CompactCertainty
                  range={range}
                  confidenceTypes={confidenceTypes}
                />
              )}
              {labelAfterCertainty && (
                <span className="text-zinc-400">{labelAfterCertainty}:</span>
              )}
              <span>{dateText}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
