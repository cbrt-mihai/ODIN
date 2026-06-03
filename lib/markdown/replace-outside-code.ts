/** Fenced ```/~~~ blocks and inline `code` spans — preserved verbatim when splitting. */
const CODE_SEGMENT_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;

/**
 * Run `transform` only on text outside fenced and inline code so examples like
 * `` `[[slug]]` `` stay literal instead of becoming HTML inside `<code>`.
 */
export function replaceOutsideCode(
  content: string,
  transform: (segment: string) => string,
): string {
  const parts = content.split(CODE_SEGMENT_RE);
  return parts
    .map((part, index) => (index % 2 === 1 ? part : transform(part)))
    .join("");
}
