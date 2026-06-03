export type LinkSegment =
  | { kind: "text"; value: string }
  | { kind: "wikilink"; value: string; raw: string }
  | { kind: "url"; value: string; raw: string };

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const URL_RE = /https?:\/\/[^\s<>\])"',]+/gi;

/**
 * Split markdown/plain text into text and link segments for read-only field display.
 */
export function parseLinkSegments(content: string): LinkSegment[] {
  if (!content) return [{ kind: "text", value: "" }];

  const markers: { index: number; end: number; segment: LinkSegment }[] = [];

  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    markers.push({
      index: m.index,
      end: m.index + m[0].length,
      segment: { kind: "wikilink", value: m[1], raw: m[0] },
    });
  }

  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(content)) !== null) {
    const overlaps = markers.some(
      (mk) => m!.index >= mk.index && m!.index < mk.end,
    );
    if (!overlaps) {
      markers.push({
        index: m.index,
        end: m.index + m[0].length,
        segment: { kind: "url", value: m[0], raw: m[0] },
      });
    }
  }

  markers.sort((a, b) => a.index - b.index);

  const segments: LinkSegment[] = [];
  let cursor = 0;
  for (const mk of markers) {
    if (mk.index > cursor) {
      segments.push({ kind: "text", value: content.slice(cursor, mk.index) });
    }
    segments.push(mk.segment);
    cursor = mk.end;
  }
  if (cursor < content.length) {
    segments.push({ kind: "text", value: content.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: content }];
}
