import {
  computeTimelineEventsAreaHeightRem,
  computeTimelineReportCanvas,
  displayLaneBottomRem,
  layoutTimelineReportEvents,
  timelineEventReportLeftPx,
  timelineEventReportWidthPx,
  timelineTickLeftPx,
  TIMELINE_AXIS_HEIGHT_REM,
  TIMELINE_TRACK_HORIZONTAL_INSET_PX,
  timelineContentWidthPx,
} from "@/lib/timeline/layout";
import type { TimelineEvent } from "@/lib/types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(ev: TimelineEvent) {
  const start = ev.occurredAt.slice(0, 16).replace("T", " ");
  if (!ev.endAt) return start;
  const end = ev.endAt.slice(0, 16).replace("T", " ");
  return `${start} – ${end}`;
}

function formatTickLabel(ms: number, spanMs: number) {
  const iso = new Date(ms).toISOString();
  if (spanMs <= 2 * 86_400_000) return iso.slice(0, 16).replace("T", " ");
  if (spanMs <= 90 * 86_400_000) return iso.slice(0, 10);
  return iso.slice(0, 7);
}

function buildDateTicks(minMs: number, maxMs: number, count = 5) {
  const span = maxMs - minMs || 1;
  const ticks: { pct: number; label: string }[] = [];
  for (let i = 0; i <= count; i++) {
    const pct = (i / count) * 100;
    const ms = minMs + (span * i) / count;
    ticks.push({ pct, label: formatTickLabel(ms, span) });
  }
  return ticks;
}

export const TIMELINE_REPORT_STYLES = `
  .timeline-wrap { margin: 1rem 0 1.5rem; }
  .timeline-track {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fafafa;
  }
  .timeline-body-scroll {
    overflow: auto;
    max-height: 24rem;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }
  .timeline-axis-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
    flex-shrink: 0;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
    scrollbar-width: none;
  }
  .timeline-axis-scroll::-webkit-scrollbar {
    display: none;
  }
  .timeline-canvas,
  .timeline-axis-canvas {
    position: relative;
    box-sizing: border-box;
  }
  .timeline-events {
    position: relative;
    padding: 0.75rem 0 0;
    box-sizing: border-box;
    overflow: visible;
  }
  .timeline-footer {
    position: relative;
    padding: 0.35rem 0 0.55rem;
    box-sizing: border-box;
  }
  .timeline-axis {
    position: relative;
    height: 2px;
    background: #d4d4d8;
  }
  .timeline-ticks {
    position: relative;
    margin: 0.3rem 0 0;
    height: 1.1rem;
  }
  .timeline-tick {
    position: absolute;
    top: 0;
    font-size: 0.65rem;
    color: #71717a;
    white-space: nowrap;
    transform: translateX(-50%);
  }
  .timeline-event {
    position: absolute;
    width: 11.5rem;
    font-size: 0.7rem;
    line-height: 1.25;
    padding: 0.35rem 0.45rem;
    border-radius: 4px;
    border: 1px solid #d4d4d8;
    background: #fff;
    box-sizing: border-box;
  }
  .timeline-event.range {
    border-color: #93c5fd;
    background: #eff6ff;
    min-width: 2rem;
  }
  .timeline-event .title { font-weight: 600; color: #18181b; }
  .timeline-event .meta { color: #71717a; margin-top: 0.15rem; }
  .timeline-event .desc {
    color: #52525b;
    margin-top: 0.2rem;
    white-space: normal;
    padding: 0;
    background: transparent;
    border: none;
    font-size: inherit;
    font-family: inherit;
  }
  .timeline-list { font-size: 0.8rem; margin-top: 0.75rem; }
  .timeline-list table { width: 100%; border-collapse: collapse; }
  .timeline-list th, .timeline-list td {
    border: 1px solid #ddd;
    padding: 0.35rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }
  .timeline-list th { background: #f4f4f5; }
  @media print {
    .timeline-body-scroll, .timeline-axis-scroll { overflow: visible !important; max-height: none !important; }
    .timeline-axis-scroll { border-top: none; }
  }
`;

export const TIMELINE_REPORT_SCRIPT = `
(function () {
  for (const track of document.querySelectorAll(".timeline-track")) {
    const body = track.querySelector(".timeline-body-scroll");
    const axis = track.querySelector(".timeline-axis-scroll");
    if (!body || !axis) continue;
    let syncing = false;
    const sync = (from, to) => {
      if (syncing) return;
      syncing = true;
      to.scrollLeft = from.scrollLeft;
      syncing = false;
    };
    body.addEventListener("scroll", () => sync(body, axis), { passive: true });
    axis.addEventListener("scroll", () => sync(axis, body), { passive: true });
  }
})();
`;

export function renderTimelineReportHtml<T extends TimelineEvent>(
  events: T[],
  options?: { title?: string; sourceLabel?: (ev: T) => string },
) {
  const title = options?.title ?? "Timeline";
  if (events.length === 0) {
    return `<h2>${esc(title)}</h2><p>No events.</p>`;
  }

  const layout = layoutTimelineReportEvents(events);
  if (!layout) {
    return `<h2>${esc(title)}</h2><p>No events.</p>`;
  }

  const { widthPx, shiftPx } = computeTimelineReportCanvas(
    layout.items,
    layout.trackMinWidthPx,
  );
  const eventsHeightRem = computeTimelineEventsAreaHeightRem(layout.laneHeightsRem);
  const axisLeftPx = TIMELINE_TRACK_HORIZONTAL_INSET_PX + shiftPx;
  const axisWidthPx = timelineContentWidthPx(layout.trackMinWidthPx);

  const ticks = buildDateTicks(layout.min, layout.max);
  const tickHtml = ticks
    .map((tick) => {
      const leftPx = timelineTickLeftPx(
        tick.pct,
        layout.trackMinWidthPx,
        shiftPx,
      );
      return `<span class="timeline-tick" style="left:${leftPx}px">${esc(tick.label)}</span>`;
    })
    .join("");

  const markers = layout.items
    .map((ev) => {
      const displayLane = ev.stack;
      const leftPx = timelineEventReportLeftPx(
        ev.startPct,
        ev.offsetPx,
        layout.trackMinWidthPx,
        shiftPx,
      );
      const widthPx = timelineEventReportWidthPx(
        ev.startPct,
        ev.endPct,
        layout.trackMinWidthPx,
        ev.isRange,
      );
      const bottomRem =
        displayLaneBottomRem(
          displayLane,
          layout.laneHeightsRem,
        ) - TIMELINE_AXIS_HEIGHT_REM;

      const source = options?.sourceLabel?.(ev);
      const meta = [formatWhen(ev), ev.type, source]
        .filter(Boolean)
        .join(" · ");
      const descHtml = ev.description
        ? `<div class="desc">${esc(ev.description)}</div>`
        : "";

      return `<div class="timeline-event${ev.isRange ? " range" : ""}" style="left:${leftPx}px;bottom:${bottomRem}rem;width:${widthPx}px">
        <div class="title">${esc(ev.title)}</div>
        <div class="meta">${esc(meta)}</div>
        ${descHtml}
      </div>`;
    })
    .join("");

  const rows = [...layout.items]
    .sort((a, b) => a.startMs - b.startMs)
    .map((ev) => {
      const source = options?.sourceLabel?.(ev);
      return `<tr>
        <td>${esc(formatWhen(ev))}</td>
        <td>${esc(ev.title)}</td>
        <td>${esc(ev.type ?? "")}</td>
        <td>${esc(source ?? "")}</td>
        <td>${esc(ev.description ?? "")}</td>
      </tr>`;
    })
    .join("");

  return `<h2>${esc(title)}</h2>
  <div class="timeline-wrap">
    <div class="timeline-track">
      <div class="timeline-body-scroll">
        <div class="timeline-canvas" style="width:${widthPx}px">
          <div class="timeline-events" style="height:${eventsHeightRem}rem">
            ${markers}
          </div>
        </div>
      </div>
      <div class="timeline-axis-scroll">
        <div class="timeline-axis-canvas" style="width:${widthPx}px">
          <div class="timeline-footer" style="min-height:${TIMELINE_AXIS_HEIGHT_REM}rem">
            <div class="timeline-axis" style="margin-left:${axisLeftPx}px;width:${axisWidthPx}px"></div>
            <div class="timeline-ticks">${tickHtml}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="timeline-list">
      <table>
        <thead><tr><th>When</th><th>Title</th><th>Type</th><th>Source</th><th>Description</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}
