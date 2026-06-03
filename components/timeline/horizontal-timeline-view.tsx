"use client";

import type { ReactNode } from "react";
import {
  layoutTimelineEvents,
  timelineEventPositionStyle,
  TIMELINE_CONTENT_INSET_REM,
} from "@/lib/timeline/layout";
import { formatDate } from "@/lib/utils";

export function HorizontalTimelineView({
  children,
  laneCount,
  trackHeightRem,
  trackMinWidthPx,
  minLabel,
  maxLabel,
  className,
}: {
  children: ReactNode;
  laneCount: number;
  trackHeightRem: number;
  trackMinWidthPx: number;
  minLabel: string;
  maxLabel: string;
  className?: string;
}) {
  const inset = TIMELINE_CONTENT_INSET_REM;

  return (
    <div className={className}>
      <div className="max-w-full overflow-x-auto overflow-y-visible rounded-lg border border-zinc-800 bg-zinc-950">
        <div
          className="relative pb-10 pt-3"
          style={{
            height: `${trackHeightRem}rem`,
            minWidth: trackMinWidthPx,
          }}
        >
          <div
            className="absolute bottom-8 h-px bg-zinc-700"
            style={{ left: `${inset}rem`, right: `${inset}rem` }}
          />
          <div
            className="absolute bottom-2 flex justify-between text-[10px] text-zinc-500"
            style={{ left: `${inset}rem`, right: `${inset}rem` }}
          >
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
          {children}
        </div>
      </div>
      {laneCount > 1 && (
        <p className="text-xs text-zinc-500">
          Events at similar dates are spaced apart; overlapping times use
          separate lanes.
        </p>
      )}
    </div>
  );
}

export function useHorizontalTimelineLayout<
  T extends { id: string; occurredAt: string; endAt?: string; description?: string },
>(events: T[]) {
  const layout = layoutTimelineEvents(events);
  if (!layout) return null;

  const minLabel = formatDate(new Date(layout.min).toISOString());
  const maxLabel = formatDate(new Date(layout.max).toISOString());

  return {
    ...layout,
    minLabel,
    maxLabel,
  };
}

export function timelinePositionStyle(
  startPct: number,
  endPct: number,
  timeLane: number,
  stack: number,
  stackCount: number,
  laneHeightsRem: number[],
  isRange: boolean,
  offsetPx: number,
) {
  const displayLane = timeLane * stackCount + stack;
  return timelineEventPositionStyle(
    startPct,
    endPct,
    displayLane,
    laneHeightsRem,
    isRange,
    offsetPx,
  );
}
