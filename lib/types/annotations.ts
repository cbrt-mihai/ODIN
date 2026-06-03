/**
 * How rich text is stored. `markdown` = GFM + Obsidian (wikilinks, tags, callouts).
 * `obsidian` is kept for older data and behaves the same as `markdown`.
 */
export type TextFlavor = "plain" | "markdown" | "obsidian";

export interface EntryAnnotations {
  description?: string;
  descriptionFlavor?: TextFlavor;
  tags?: string[];
  notes?: string;
  notesFlavor?: TextFlavor;
}

/** UI options — obsidian is not listed; legacy values map to markdown. */
export const TEXT_FLAVORS: { id: TextFlavor; label: string }[] = [
  { id: "plain", label: "Plain text" },
  { id: "markdown", label: "Markdown (GFM + Obsidian)" },
];

export const TEXT_FLAVOR_TOGGLE: { id: TextFlavor; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "markdown", label: "MD" },
];

export function defaultAnnotations(): EntryAnnotations {
  return { tags: [], descriptionFlavor: "plain", notesFlavor: "plain" };
}
