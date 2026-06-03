/** Human-readable default label from a filename or URL. */
export function defaultMediaDisplayName(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "Untitled";

  const leaf =
    trimmed.replace(/[?#].*$/, "").split(/[/\\]/).pop()?.trim() ?? trimmed;
  const withoutExt =
    leaf.includes(".") && !leaf.startsWith(".")
      ? leaf.replace(/\.[^.]+$/, "")
      : leaf;
  const humanized = withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return humanized || leaf || "Untitled";
}

export function mediaDisplayName(item: {
  caption?: string;
  description?: string;
  filename?: string;
  url?: string;
}): string {
  const caption = item.caption?.trim();
  if (caption) return caption;

  const description = item.description?.trim();
  if (description) return description;

  if (item.filename?.trim()) {
    return defaultMediaDisplayName(item.filename);
  }

  if (item.url?.trim()) {
    return defaultMediaDisplayName(item.url);
  }

  return "Untitled";
}
