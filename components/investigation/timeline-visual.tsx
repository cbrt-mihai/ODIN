"use client";

import { useMemo, useState } from "react";
import type { ScopedTimelineEvent } from "@/lib/investigation/stats";
import { cn, formatDate } from "@/lib/utils";
import {
  HorizontalTimelineView,
  timelinePositionStyle,
  useHorizontalTimelineLayout,
} from "@/components/timeline/horizontal-timeline-view";

const SOURCE_COLORS = {
  case: "#f59e0b",
  entity: "#3b82f6",
} as const;

export function TimelineVisual({
  events,
  height,
}: {
  events: ScopedTimelineEvent[];
  height?: number;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const layout = useHorizontalTimelineLayout(events);

  const hovered = useMemo(
    () => layout?.items.find((e) => e.id === hoveredId),
    [layout, hoveredId],
  );

  if (!layout) {
    return <p className="text-sm text-zinc-500">No timeline events in scope.</p>;
  }

  return (
    <div className="space-y-3" style={height ? { minHeight: height } : undefined}>
      <HorizontalTimelineView
        laneCount={layout.laneCount}
        trackHeightRem={layout.trackHeightRem}
        trackMinWidthPx={layout.trackMinWidthPx}
        minLabel={layout.minLabel}
        maxLabel={layout.maxLabel}
      >
        {layout.items.map((ev) => {
          const color =
            SOURCE_COLORS[ev.source ?? "entity"] ?? "#71717a";
          const pos = timelinePositionStyle(
            ev.startPct,
            ev.endPct,
            ev.lane,
            ev.stack,
            layout.stackCount,
            layout.laneHeightsRem,
            ev.isRange,
            ev.offsetPx,
          );
          const key = `${ev.source ?? "ev"}-${ev.id}`;

          if (ev.isRange) {
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "absolute z-10 min-h-3 rounded-sm border-2 border-zinc-950 opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  hoveredId === ev.id && "opacity-100 ring-2 ring-blue-400",
                )}
                style={{ ...pos, backgroundColor: color }}
                onMouseEnter={() => setHoveredId(ev.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(ev.id)}
                onBlur={() => setHoveredId(null)}
                aria-label={`${ev.title}, ${formatDate(ev.occurredAt)}`}
              />
            );
          }

          return (
            <button
              key={key}
              type="button"
              className={cn(
                "absolute z-10 h-3 w-3 rounded-full border-2 border-zinc-950 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-500",
                hoveredId === ev.id && "scale-125 ring-2 ring-blue-400",
              )}
              style={{ ...pos, backgroundColor: color }}
              onMouseEnter={() => setHoveredId(ev.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(ev.id)}
              onBlur={() => setHoveredId(null)}
              aria-label={`${ev.title}, ${formatDate(ev.occurredAt)}`}
            />
          );
        })}
      </HorizontalTimelineView>

      {hovered && (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
          <p className="font-medium text-zinc-100">{hovered.title}</p>
          <p className="text-xs text-zinc-500">
            {formatDate(hovered.occurredAt)}
            {hovered.endAt && ` – ${formatDate(hovered.endAt)}`}
            {hovered.type && ` · ${hovered.type}`}
            {hovered.sourceLabel && ` · ${hovered.sourceLabel}`}
          </p>
          {hovered.description && (
            <p className="mt-1 text-xs text-zinc-400">{hovered.description}</p>
          )}
        </div>
      )}

      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SOURCE_COLORS.case }}
          />
          Case events
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SOURCE_COLORS.entity }}
          />
          Entity events
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-6 w-8 rounded-sm bg-blue-500/40" />
          Date range
        </span>
      </div>
    </div>
  );
}
