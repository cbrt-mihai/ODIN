import {
  layoutTimelineEvents,
  timelineEventPositionStyle,
  TIMELINE_CONTENT_INSET_REM,
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

export const TIMELINE_REPORT_STYLES = `
  .timeline-wrap { margin: 1rem 0 1.5rem; }
  .timeline-track {
    position: relative;
    margin: 0.5rem 0;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fafafa;
    overflow-x: auto;
    overflow-y: visible;
  }
  .timeline-inner {
    position: relative;
    padding: 0 ${TIMELINE_CONTENT_INSET_REM}rem 2.5rem;
    box-sizing: border-box;
  }
  .timeline-axis {
    position: absolute;
    left: ${TIMELINE_CONTENT_INSET_REM}rem;
    right: ${TIMELINE_CONTENT_INSET_REM}rem;
    bottom: 1.25rem;
    height: 2px;
    background: #d4d4d8;
  }
  .timeline-labels {
    position: absolute;
    left: ${TIMELINE_CONTENT_INSET_REM}rem;
    right: ${TIMELINE_CONTENT_INSET_REM}rem;
    bottom: 0.25rem;
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: #71717a;
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
  .timeline-event .desc { color: #52525b; margin-top: 0.2rem; }
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
    .timeline-track { overflow: visible; }
    .timeline-inner { overflow: visible; }
    .timeline-list { page-break-before: auto; }
  }
`;

export function renderTimelineReportHtml<T extends TimelineEvent>(
  events: T[],
  options?: { title?: string; sourceLabel?: (ev: T) => string },
) {
  const title = options?.title ?? "Timeline";
  if (events.length === 0) {
    return `<h2>${esc(title)}</h2><p>No events.</p>`;
  }

  const layout = layoutTimelineEvents(events);
  if (!layout) {
    return `<h2>${esc(title)}</h2><p>No events.</p>`;
  }

  const minLabel = new Date(layout.min).toISOString().slice(0, 10);
  const maxLabel = new Date(layout.max).toISOString().slice(0, 10);

  const markers = layout.items
    .map((ev) => {
      const displayLane = ev.lane * layout.stackCount + ev.stack;
      const pos = timelineEventPositionStyle(
        ev.startPct,
        ev.endPct,
        displayLane,
        layout.laneHeightsRem,
        ev.isRange,
        ev.offsetPx,
      );
      const source = options?.sourceLabel?.(ev);
      const meta = [formatWhen(ev), ev.type, source]
        .filter(Boolean)
        .join(" · ");
      const descHtml = ev.description
        ? `<div class="desc">${esc(ev.description)}</div>`
        : "";
      const widthStyle = pos.width ? `width:${pos.width};` : "";
      const marginStyle = pos.marginLeft
        ? `margin-left:${pos.marginLeft};`
        : "";
      return `<div class="timeline-event${ev.isRange ? " range" : ""}" style="left:${pos.left};bottom:${pos.bottom};${widthStyle}${marginStyle}">
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
      <div class="timeline-inner" style="height:${layout.trackHeightRem}rem;min-width:${layout.trackMinWidthPx}px">
        <div class="timeline-axis"></div>
        <div class="timeline-labels"><span>${esc(minLabel)}</span><span>${esc(maxLabel)}</span></div>
        ${markers}
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
