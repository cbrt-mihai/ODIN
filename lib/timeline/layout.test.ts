import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDisplayLaneHeightsRem,
  computeTimelineReportCanvas,
  estimateTimelineCardHeightRem,
  layoutTimelineEvents,
  layoutTimelineReportEvents,
  pointEventLeftPx,
  timelineContentWidthPx,
  timelineEventPositionStyle,
  TIMELINE_LANE_BASE_HEIGHT_REM,
  TIMELINE_POINT_CARD_WIDTH_PX,
  TIMELINE_TRACK_EDGE_PADDING_PX,
  TIMELINE_TRACK_SIDE_PADDING_PX,
} from "./layout";

describe("layoutTimelineEvents", () => {
  it("returns null for empty input", () => {
    assert.equal(layoutTimelineEvents([]), null);
  });

  it("expands track width when many events share similar times", () => {
    const base = new Date("2025-01-01T12:00:00Z").getTime();
    const events = Array.from({ length: 6 }, (_, i) => ({
      id: `e${i}`,
      occurredAt: new Date(base + i * 1000).toISOString(),
    }));

    const layout = layoutTimelineEvents(events);
    assert.ok(layout);
    assert.ok(layout.trackMinWidthPx >= 720);
    const maxOffset = Math.max(...layout.items.map((i) => i.offsetPx));
    assert.ok(
      layout.trackMinWidthPx >= TIMELINE_POINT_CARD_WIDTH_PX + maxOffset,
    );
  });

  it("increases lane height for long descriptions", () => {
    const layout = layoutTimelineEvents([
      {
        id: "1",
        occurredAt: "2025-06-01T10:00:00Z",
        description: "x".repeat(120),
      },
    ]);
    assert.ok(layout);
    assert.ok(layout.laneHeightsRem[0] > TIMELINE_LANE_BASE_HEIGHT_REM);
    assert.ok(layout.trackHeightRem > TIMELINE_LANE_BASE_HEIGHT_REM + 2.5);
  });

  it("expands track for first/last events on the axis", () => {
    const layout = layoutTimelineEvents([
      { id: "start", occurredAt: "2025-01-01T00:00:00Z" },
      { id: "end", occurredAt: "2025-12-31T23:59:00Z" },
    ]);
    assert.ok(layout);
    assert.ok(layout.trackMinWidthPx >= 720);
    const start = layout.items.find((i) => i.id === "start")!;
    const end = layout.items.find((i) => i.id === "end")!;
    assert.ok(start.startPct < 5);
    assert.ok(end.startPct > 95);
  });

  it("computes report canvas wide enough for edge cards", () => {
    const layout = layoutTimelineEvents([
      {
        id: "a",
        occurredAt: "2026-05-16T16:47:00Z",
        description: "Listed in matter NL-2025-0412 intake memo (staging access)",
      },
      {
        id: "b",
        occurredAt: "2026-05-22T16:47:00Z",
        description: "Laura P. / Northline HR — cooperative, no adverse info",
      },
      {
        id: "c",
        occurredAt: "2026-05-23T16:47:00Z",
        description:
          "No outreach to subject until client signs revised letter",
      },
    ] as never);
    assert.ok(layout);
    const canvas = computeTimelineReportCanvas(
      layout.items,
      layout.trackMinWidthPx,
    );
    for (const item of layout.items) {
      const left =
        pointEventLeftPx(item.startPct, item.offsetPx, layout.trackMinWidthPx) +
        canvas.shiftPx;
      assert.ok(
        left >= TIMELINE_TRACK_SIDE_PADDING_PX,
        `${item.id} left edge should not clip`,
      );
      assert.ok(
        left + TIMELINE_POINT_CARD_WIDTH_PX <= canvas.widthPx,
        `${item.id} right edge should fit canvas`,
      );
    }
  });

  it("fits spaced events with descriptions without underflowing track height", () => {
    const layout = layoutTimelineEvents([
      {
        id: "a",
        occurredAt: "2026-05-16T16:47:00Z",
        type: "other",
        description: "Listed in matter NL-2025-0412 intake memo (staging access)",
      },
      {
        id: "b",
        occurredAt: "2026-05-22T16:47:00Z",
        type: "contact",
        description: "Laura P. / Northline HR — cooperative, no adverse info",
      },
      {
        id: "c",
        occurredAt: "2026-05-23T16:47:00Z",
        type: "legal",
        description:
          "No outreach to subject until client signs revised letter",
      },
    ] as never);
    assert.ok(layout);
    assert.ok(layout.stackCount >= 1);
    const maxDisplayLane = Math.max(
      ...layout.items.map((i) => i.lane * layout.stackCount + i.stack),
    );
    const topCardBottom = layout.laneHeightsRem
      .slice(0, maxDisplayLane)
      .reduce((sum, h, idx, arr) => {
        const gap = idx < arr.length - 1 ? 0.35 : 0;
        return sum + h + gap;
      }, 2.5);
    const topCardHeight =
      layout.laneHeightsRem[maxDisplayLane] ?? TIMELINE_LANE_BASE_HEIGHT_REM;
    assert.ok(
      layout.trackHeightRem >= topCardBottom + topCardHeight + 0.5,
      "track should fit the tallest stacked card",
    );
  });
});

describe("layoutTimelineReportEvents", () => {
  it("stacks cards vertically when horizontal spans would collide", () => {
    const layout = layoutTimelineReportEvents([
      {
        id: "a",
        occurredAt: "2026-05-16T16:47:00Z",
        description: "Listed in matter NL-2025-0412 intake memo (staging access)",
      },
      {
        id: "b",
        occurredAt: "2026-05-17T16:47:00Z",
        description: "CISO shared reentry paste",
      },
      {
        id: "c",
        occurredAt: "2026-05-18T16:47:00Z",
        description: "Phishing kit Glass Desk",
      },
      {
        id: "d",
        occurredAt: "2026-05-22T16:47:00Z",
        description: "Laura P. / Northline HR — cooperative, no adverse info",
      },
      {
        id: "e",
        occurredAt: "2026-05-22T17:47:00Z",
        description: "HR call — Elena Vasquez",
      },
    ] as never);
    assert.ok(layout);
    assert.ok(layout.stackCount > 1, "should use multiple vertical rows");

    const byRow = new Map<number, { left: number; right: number }[]>();
    for (const item of layout.items) {
      const left = pointEventLeftPx(
        item.startPct,
        item.offsetPx,
        layout.trackMinWidthPx,
      );
      const right = left + TIMELINE_POINT_CARD_WIDTH_PX;
      const row = item.stack;
      const intervals = byRow.get(row) ?? [];
      for (const other of intervals) {
        assert.ok(
          left >= other.right + 12 || right <= other.left - 12,
          `row ${row} cards should not overlap horizontally`,
        );
      }
      intervals.push({ left, right });
      byRow.set(row, intervals);
    }
  });
});

describe("estimateTimelineCardHeightRem", () => {
  it("uses base height without description", () => {
    assert.equal(
      estimateTimelineCardHeightRem({
        id: "a",
        occurredAt: "2025-01-01",
      }),
      TIMELINE_LANE_BASE_HEIGHT_REM,
    );
  });
});

describe("timelineEventPositionStyle", () => {
  it("centers point events inside content inset", () => {
    const style = timelineEventPositionStyle(0, 0, 0, [5.5], false, 0);
    assert.equal(style.marginLeft, `${-TIMELINE_TRACK_EDGE_PADDING_PX}px`);
    assert.ok(style.left.includes("6.75rem"));
  });

  it("places range events without negative margin", () => {
    const style = timelineEventPositionStyle(10, 40, 0, [5.5], true, 0);
    assert.equal(style.marginLeft, undefined);
    assert.ok(style.width?.includes("max(3rem"));
  });
});

describe("buildDisplayLaneHeightsRem", () => {
  it("uses max card height per display lane", () => {
    const heights = buildDisplayLaneHeightsRem(
      [
        {
          id: "a",
          occurredAt: "2025-01-01",
          lane: 0,
          stack: 0,
          description: "short",
        } as never,
        {
          id: "b",
          occurredAt: "2025-01-01",
          lane: 0,
          stack: 1,
          description: "y".repeat(200),
        } as never,
      ],
      2,
    );
    assert.equal(heights.length, 2);
    assert.equal(heights[0], TIMELINE_LANE_BASE_HEIGHT_REM);
    assert.ok(heights[1] > TIMELINE_LANE_BASE_HEIGHT_REM);
  });
});

describe("timelineContentWidthPx", () => {
  it("subtracts horizontal insets from track width", () => {
    const w = timelineContentWidthPx(720);
    assert.ok(w < 720);
    assert.ok(w > 400);
  });
});
