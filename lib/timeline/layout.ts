export type TimelineLike = {
  id: string;
  occurredAt: string;
  endAt?: string;
  /** Used to estimate vertical space for HTML report cards. */
  description?: string;
};

export type LaidOutTimelineEvent<T extends TimelineLike> = T & {
  startMs: number;
  endMs: number;
  startPct: number;
  endPct: number;
  /** Time overlap lane */
  lane: number;
  /** Extra lane when cards would collide at similar dates */
  stack: number;
  isRange: boolean;
  /** Horizontal nudge (px) after collision resolution */
  offsetPx: number;
  /** Minimum track width so cards fit without overlapping */
  trackMinWidthPx: number;
};

export type TimelineLayoutResult<T extends TimelineLike> = {
  items: LaidOutTimelineEvent<T>[];
  laneCount: number;
  stackCount: number;
  trackMinWidthPx: number;
  /** Per display-lane height (rem), index = lane * stackCount + stack */
  laneHeightsRem: number[];
  trackHeightRem: number;
  min: number;
  max: number;
};

const LANE_GAP_MS = 60_000;
/** Vertical gap between stacked card rows (rem). */
const LANE_STACK_GAP_REM = 0.35;
/** Min horizontal gap between point-event cards (px). */
const CARD_GAP_PX = 12;
/** Fixed height for title + meta + padding (rem). */
const CARD_CHROME_HEIGHT_REM = 3.25;
/** Extra space above the top card row (rem). */
const TRACK_TOP_BUFFER_REM = 0.5;
/** Fixed width for point-event cards (px). */
export const TIMELINE_POINT_CARD_WIDTH_PX = 184;
/** Horizontal inset on each side: side padding + half card (for centered point events). */
export const TIMELINE_TRACK_SIDE_PADDING_PX = 16;
export const TIMELINE_TRACK_EDGE_PADDING_PX =
  TIMELINE_POINT_CARD_WIDTH_PX / 2;
export const TIMELINE_TRACK_HORIZONTAL_INSET_PX =
  TIMELINE_TRACK_SIDE_PADDING_PX + TIMELINE_TRACK_EDGE_PADDING_PX;
/** CSS inset matching 1rem side + 5.75rem half-card. */
export const TIMELINE_CONTENT_INSET_REM = 6.75;
export const TIMELINE_LANE_BASE_HEIGHT_REM = 5.5;
const RANGE_MIN_WIDTH_PX = 48;
/** Space reserved for the axis + date labels beneath event cards. */
export const TIMELINE_AXIS_HEIGHT_REM = 2.5;
const AXIS_BOTTOM_REM = TIMELINE_AXIS_HEIGHT_REM;
const TRACK_TOP_PAD_REM = 0.75;
const DESC_CHARS_PER_LINE = 38;
const DESC_LINE_HEIGHT_REM = 1.15;
const MAX_DESC_LINES = 6;

function eventBounds(ev: TimelineLike) {
  const startMs = new Date(ev.occurredAt).getTime();
  const endRaw = ev.endAt ? new Date(ev.endAt).getTime() : startMs;
  const endMs = Math.max(startMs, endRaw);
  return { startMs, endMs, isRange: Boolean(ev.endAt && endMs > startMs) };
}

export function timelineBounds(events: TimelineLike[]) {
  if (events.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const ev of events) {
    const { startMs, endMs } = eventBounds(ev);
    min = Math.min(min, startMs);
    max = Math.max(max, endMs);
  }
  const pad = Math.max((max - min) * 0.05, 86_400_000);
  return { min: min - pad, max: max + pad };
}

export function timelineContentWidthPx(trackMinWidthPx: number): number {
  return Math.max(
    200,
    trackMinWidthPx - 2 * TIMELINE_TRACK_HORIZONTAL_INSET_PX,
  );
}

/** Estimate card height from description length (HTML export / tall cards). */
export function estimateTimelineCardHeightRem(ev: TimelineLike): number {
  const desc = ev.description?.trim();
  if (!desc) return TIMELINE_LANE_BASE_HEIGHT_REM;
  const lines = Math.min(
    MAX_DESC_LINES,
    Math.ceil(desc.length / DESC_CHARS_PER_LINE),
  );
  return Math.max(
    TIMELINE_LANE_BASE_HEIGHT_REM,
    CARD_CHROME_HEIGHT_REM + lines * DESC_LINE_HEIGHT_REM,
  );
}

export function buildDisplayLaneHeightsRem<T extends TimelineLike>(
  items: LaidOutTimelineEvent<T>[],
  stackCount: number,
): number[] {
  const maxDisplayLane = Math.max(
    0,
    ...items.map((i) => i.lane * stackCount + i.stack),
  );
  const heights = new Array<number>(maxDisplayLane + 1).fill(
    TIMELINE_LANE_BASE_HEIGHT_REM,
  );
  for (const item of items) {
    const displayLane = item.lane * stackCount + item.stack;
    heights[displayLane] = Math.max(
      heights[displayLane],
      estimateTimelineCardHeightRem(item),
    );
  }
  return heights;
}

export function computeTrackHeightRem(laneHeightsRem: number[]): number {
  const lanes = laneHeightsRem.reduce((sum, h) => sum + h, 0);
  const stackGaps =
    Math.max(0, laneHeightsRem.length - 1) * LANE_STACK_GAP_REM;
  return (
    AXIS_BOTTOM_REM +
    lanes +
    stackGaps +
    TRACK_TOP_PAD_REM +
    TRACK_TOP_BUFFER_REM
  );
}

export function computeTimelineEventsAreaHeightRem(
  laneHeightsRem: number[],
): number {
  return computeTrackHeightRem(laneHeightsRem) - TIMELINE_AXIS_HEIGHT_REM;
}

export function displayLaneBottomRem(
  displayLane: number,
  laneHeightsRem: number[],
): number {
  let bottom = AXIS_BOTTOM_REM;
  for (let i = 0; i < displayLane; i++) {
    bottom += (laneHeightsRem[i] ?? TIMELINE_LANE_BASE_HEIGHT_REM) + LANE_STACK_GAP_REM;
  }
  return bottom;
}

export function pointEventLeftPx(
  startPct: number,
  offsetPx: number,
  trackMinWidthPx: number,
): number {
  const contentWidth = timelineContentWidthPx(trackMinWidthPx);
  const anchorLeft =
    TIMELINE_TRACK_HORIZONTAL_INSET_PX +
    (startPct / 100) * contentWidth -
    TIMELINE_TRACK_EDGE_PADDING_PX;
  return anchorLeft + offsetPx;
}

export function pointEventRightPx(
  item: Pick<LaidOutTimelineEvent<TimelineLike>, "startPct" | "offsetPx" | "isRange" | "endPct">,
  trackMinWidthPx: number,
): number {
  if (item.isRange) {
    const contentWidth = timelineContentWidthPx(trackMinWidthPx);
    const left =
      TIMELINE_TRACK_HORIZONTAL_INSET_PX + (item.startPct / 100) * contentWidth;
    const width = Math.max(
      RANGE_MIN_WIDTH_PX,
      ((item.endPct - item.startPct) / 100) * contentWidth,
    );
    return left + width;
  }
  return (
    pointEventLeftPx(item.startPct, item.offsetPx, trackMinWidthPx) +
    TIMELINE_POINT_CARD_WIDTH_PX
  );
}

/** Pixel canvas width + left shift so HTML report cards are not clipped. */
export function computeTimelineReportCanvas(
  items: Pick<
    LaidOutTimelineEvent<TimelineLike>,
    "startPct" | "offsetPx" | "isRange" | "endPct"
  >[],
  trackMinWidthPx: number,
) {
  if (items.length === 0) {
    return { widthPx: trackMinWidthPx, shiftPx: 0 };
  }

  let minLeft = Infinity;
  let maxRight = -Infinity;
  for (const item of items) {
    minLeft = Math.min(
      minLeft,
      pointEventLeftPx(item.startPct, item.offsetPx, trackMinWidthPx),
    );
    maxRight = Math.max(maxRight, pointEventRightPx(item, trackMinWidthPx));
  }

  const pad = TIMELINE_TRACK_SIDE_PADDING_PX;
  const shiftPx = Math.max(0, Math.ceil(pad - minLeft));
  const widthPx = Math.ceil(maxRight + shiftPx + pad);

  return {
    widthPx: Math.max(trackMinWidthPx, widthPx),
    shiftPx,
  };
}

export function timelineTickLeftPx(
  pct: number,
  trackMinWidthPx: number,
  shiftPx: number,
) {
  const contentWidth = timelineContentWidthPx(trackMinWidthPx);
  return (
    TIMELINE_TRACK_HORIZONTAL_INSET_PX + (pct / 100) * contentWidth + shiftPx
  );
}

export function timelineEventReportLeftPx(
  startPct: number,
  offsetPx: number,
  trackMinWidthPx: number,
  shiftPx: number,
) {
  return pointEventLeftPx(startPct, offsetPx, trackMinWidthPx) + shiftPx;
}

export function timelineEventReportWidthPx(
  startPct: number,
  endPct: number,
  trackMinWidthPx: number,
  isRange: boolean,
) {
  if (isRange) {
    const contentWidth = timelineContentWidthPx(trackMinWidthPx);
    return Math.max(
      RANGE_MIN_WIDTH_PX,
      ((endPct - startPct) / 100) * contentWidth,
    );
  }
  return TIMELINE_POINT_CARD_WIDTH_PX;
}

export type TimelinePositionStyle = {
  left: string;
  bottom: string;
  width?: string;
  marginLeft?: string;
};

/** Shared positioning for React timeline and HTML export. */
export function timelineEventPositionStyle(
  startPct: number,
  endPct: number,
  displayLane: number,
  laneHeightsRem: number[],
  isRange: boolean,
  offsetPx: number,
  options?: { eventsAreaOnly?: boolean },
): TimelinePositionStyle {
  const inset = `${TIMELINE_CONTENT_INSET_REM}rem`;
  const contentSpan = `100% - 2 * ${inset}`;
  const left = `calc(${inset} + ${startPct}% * (${contentSpan}) / 100% + ${offsetPx}px)`;
  const axisOffset = options?.eventsAreaOnly ? TIMELINE_AXIS_HEIGHT_REM : 0;
  const bottom = `${displayLaneBottomRem(displayLane, laneHeightsRem) - axisOffset}rem`;

  if (isRange) {
    const widthPct = Math.max(1.5, endPct - startPct);
    return {
      left,
      bottom,
      width: `max(3rem, calc(${widthPct}% * (${contentSpan}) / 100%))`,
    };
  }

  return {
    left,
    bottom,
    width: `${TIMELINE_POINT_CARD_WIDTH_PX}px`,
    marginLeft: `${-TIMELINE_TRACK_EDGE_PADDING_PX}px`,
  };
}

function resolveVisualStacks<T extends TimelineLike>(
  items: LaidOutTimelineEvent<T>[],
  trackMinWidthPx: number,
) {
  const contentWidth = timelineContentWidthPx(trackMinWidthPx);
  const byTimeLane = new Map<number, LaidOutTimelineEvent<T>[]>();

  for (const item of items) {
    const group = byTimeLane.get(item.lane) ?? [];
    group.push(item);
    byTimeLane.set(item.lane, group);
  }

  let maxStack = 1;

  for (const group of byTimeLane.values()) {
    group.sort((a, b) => a.startPct - b.startPct || a.startMs - b.startMs);
    const rowEnds: number[] = [];

    for (const item of group) {
      const widthPx = item.isRange
        ? Math.max(
            RANGE_MIN_WIDTH_PX,
            ((item.endPct - item.startPct) / 100) * contentWidth,
          )
        : TIMELINE_POINT_CARD_WIDTH_PX;
      const idealLeft =
        (item.startPct / 100) * contentWidth +
        (item.isRange ? 0 : TIMELINE_POINT_CARD_WIDTH_PX / 2);

      let stack = 0;
      let left =
        idealLeft - (item.isRange ? 0 : TIMELINE_POINT_CARD_WIDTH_PX / 2);

      for (;;) {
        const rowEnd = rowEnds[stack] ?? -CARD_GAP_PX;
        if (left >= rowEnd + CARD_GAP_PX) break;
        left = rowEnd + CARD_GAP_PX;
        stack += 1;
      }

      rowEnds[stack] = left + widthPx;
      maxStack = Math.max(maxStack, stack + 1);

      const timeLeft =
        (item.startPct / 100) * contentWidth +
        (item.isRange ? 0 : TIMELINE_POINT_CARD_WIDTH_PX / 2);
      item.stack = stack;
      const anchorLeft = item.isRange
        ? (item.startPct / 100) * contentWidth
        : timeLeft - TIMELINE_POINT_CARD_WIDTH_PX / 2;
      item.offsetPx = Math.round(left - anchorLeft);
    }
  }

  return maxStack;
}

function expandTrackMinWidthPx<T extends TimelineLike>(
  items: LaidOutTimelineEvent<T>[],
  trackMinWidthPx: number,
): number {
  let maxRight = 0;

  for (const item of items) {
    maxRight = Math.max(
      maxRight,
      pointEventRightPx(item, trackMinWidthPx),
    );
  }

  return Math.max(
    trackMinWidthPx,
    maxRight +
      TIMELINE_TRACK_EDGE_PADDING_PX +
      TIMELINE_TRACK_SIDE_PADDING_PX +
      CARD_GAP_PX,
  );
}

function eventCardWidthPx(
  item: Pick<LaidOutTimelineEvent<TimelineLike>, "startPct" | "endPct" | "isRange">,
  trackMinWidthPx: number,
): number {
  if (item.isRange) {
    const contentWidth = timelineContentWidthPx(trackMinWidthPx);
    return Math.max(
      RANGE_MIN_WIDTH_PX,
      ((item.endPct - item.startPct) / 100) * contentWidth,
    );
  }
  return TIMELINE_POINT_CARD_WIDTH_PX;
}

/** Assign vertical rows for HTML cards when horizontal spans would collide. */
function resolveReportCardRows<T extends TimelineLike>(
  items: LaidOutTimelineEvent<T>[],
  trackMinWidthPx: number,
): number {
  const sorted = [...items].sort(
    (a, b) => a.startPct - b.startPct || a.startMs - b.startMs,
  );
  const rowIntervals: { left: number; right: number }[][] = [];
  let maxRow = 0;

  for (const item of sorted) {
    const left = pointEventLeftPx(item.startPct, 0, trackMinWidthPx);
    const right = left + eventCardWidthPx(item, trackMinWidthPx);

    let row = 0;
    for (;;) {
      const intervals = rowIntervals[row] ?? [];
      const collision = intervals.some(
        (interval) =>
          left < interval.right + CARD_GAP_PX &&
          right > interval.left - CARD_GAP_PX,
      );
      if (!collision) break;
      row += 1;
    }

    rowIntervals[row] = [...(rowIntervals[row] ?? []), { left, right }];
    item.lane = 0;
    item.stack = row;
    item.offsetPx = 0;
    maxRow = Math.max(maxRow, row);
  }

  return maxRow + 1;
}

function buildTimelineItems<T extends TimelineLike>(
  events: T[],
  bounds: { min: number; max: number },
): LaidOutTimelineEvent<T>[] {
  const span = bounds.max - bounds.min || 1;
  const sorted = [...events].sort((a, b) => {
    const da = eventBounds(a);
    const db = eventBounds(b);
    return da.startMs - db.startMs || da.endMs - db.endMs;
  });

  return sorted.map((ev) => {
    const { startMs, endMs, isRange } = eventBounds(ev);
    return {
      ...ev,
      startMs,
      endMs,
      lane: 0,
      stack: 0,
      offsetPx: 0,
      trackMinWidthPx: 0,
      isRange,
      startPct: Math.min(
        100,
        Math.max(0, ((startMs - bounds.min) / span) * 100),
      ),
      endPct: Math.min(
        100,
        Math.max(0, ((endMs - bounds.min) / span) * 100),
      ),
    };
  });
}

/** Layout for HTML report cards: stack rows when card boxes would overlap. */
export function layoutTimelineReportEvents<T extends TimelineLike>(
  events: T[],
): TimelineLayoutResult<T> | null {
  const bounds = timelineBounds(events);
  if (!bounds) return null;

  const items = buildTimelineItems(events, bounds);
  let trackMinWidthPx = Math.max(
    720,
    items.length * (TIMELINE_POINT_CARD_WIDTH_PX + CARD_GAP_PX),
    2 * TIMELINE_TRACK_HORIZONTAL_INSET_PX,
  );

  let stackCount = resolveReportCardRows(items, trackMinWidthPx);
  trackMinWidthPx = expandTrackMinWidthPx(items, trackMinWidthPx);
  stackCount = resolveReportCardRows(items, trackMinWidthPx);
  trackMinWidthPx = expandTrackMinWidthPx(items, trackMinWidthPx);

  const laneHeightsRem = buildDisplayLaneHeightsRem(items, stackCount);
  const trackHeightRem = computeTrackHeightRem(laneHeightsRem);

  for (const item of items) {
    item.trackMinWidthPx = trackMinWidthPx;
  }

  return {
    items,
    laneCount: stackCount,
    stackCount,
    trackMinWidthPx,
    laneHeightsRem,
    trackHeightRem,
    min: bounds.min,
    max: bounds.max,
  };
}

/** Assign horizontal position (%) and vertical lanes for overlapping events. */
export function layoutTimelineEvents<T extends TimelineLike>(
  events: T[],
): TimelineLayoutResult<T> | null {
  const bounds = timelineBounds(events);
  if (!bounds) return null;

  const span = bounds.max - bounds.min || 1;
  const sorted = [...events].sort((a, b) => {
    const da = eventBounds(a);
    const db = eventBounds(b);
    return da.startMs - db.startMs || da.endMs - db.endMs;
  });

  const laneEnds: number[] = [];
  const items: LaidOutTimelineEvent<T>[] = [];

  for (const ev of sorted) {
    const { startMs, endMs, isRange } = eventBounds(ev);
    let lane = laneEnds.findIndex((end) => startMs >= end + LANE_GAP_MS);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = endMs;

    items.push({
      ...ev,
      startMs,
      endMs,
      lane,
      stack: 0,
      offsetPx: 0,
      trackMinWidthPx: 0,
      isRange,
      startPct: Math.min(100, Math.max(0, ((startMs - bounds.min) / span) * 100)),
      endPct: Math.min(100, Math.max(0, ((endMs - bounds.min) / span) * 100)),
    });
  }

  const timeLaneCount = Math.max(1, laneEnds.length);
  const perTimeLane = new Map<number, number>();
  for (const item of items) {
    perTimeLane.set(item.lane, (perTimeLane.get(item.lane) ?? 0) + 1);
  }
  const maxPerTimeLane = Math.max(1, ...perTimeLane.values());
  let trackMinWidthPx = Math.max(
    720,
    maxPerTimeLane * (TIMELINE_POINT_CARD_WIDTH_PX + CARD_GAP_PX) +
      2 * TIMELINE_TRACK_HORIZONTAL_INSET_PX,
    sorted.length * 96,
  );

  const stackCount = resolveVisualStacks(items, trackMinWidthPx);
  trackMinWidthPx = expandTrackMinWidthPx(items, trackMinWidthPx);
  resolveVisualStacks(items, trackMinWidthPx);
  trackMinWidthPx = expandTrackMinWidthPx(items, trackMinWidthPx);

  const finalStackCount = Math.max(1, ...items.map((i) => i.stack + 1));
  const laneHeightsRem = buildDisplayLaneHeightsRem(items, finalStackCount);
  const trackHeightRem = computeTrackHeightRem(laneHeightsRem);

  for (const item of items) {
    item.trackMinWidthPx = trackMinWidthPx;
  }

  const displayLaneCount = timeLaneCount * finalStackCount;

  return {
    items,
    laneCount: displayLaneCount,
    stackCount: finalStackCount,
    trackMinWidthPx,
    laneHeightsRem,
    trackHeightRem,
    min: bounds.min,
    max: bounds.max,
  };
}
