const DOT_PATH_BODY =
  /[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*/;

export const BARE_DOT_PATH_RE = new RegExp(
  `(^|[^\\w@])@(${DOT_PATH_BODY.source})`,
  "g",
);

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

export interface ParsedWikilink {
  alias?: string;
  target: string;
}

/** Split Obsidian-style wikilink inner text into optional alias and target. */
export function parseWikilinkInner(inner: string): ParsedWikilink {
  const trimmed = inner.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) {
    return { target: trimmed };
  }
  const alias = trimmed.slice(0, pipe).trim();
  const target = trimmed.slice(pipe + 1).trim();
  if (!target) {
    return { target: trimmed };
  }
  return { alias: alias || undefined, target };
}

export function isDotPath(target: string): boolean {
  const body = target.startsWith("@") ? target.slice(1) : target;
  return new RegExp(`^${DOT_PATH_BODY.source}$`).test(body);
}

export function normalizeDotPath(target: string): string {
  const body = target.startsWith("@") ? target.slice(1) : target;
  return body.trim().toLowerCase();
}

/** Collect internal reference targets from markdown/plain text. */
export function extractInternalRefs(text: string): string[] {
  if (!text) return [];
  const out = new Set<string>();

  WIKILINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    const { target } = parseWikilinkInner(m[1]);
    if (target) out.add(target);
  }

  BARE_DOT_PATH_RE.lastIndex = 0;
  while ((m = BARE_DOT_PATH_RE.exec(text)) !== null) {
    out.add(`@${m[2]}`);
  }

  return [...out];
}
