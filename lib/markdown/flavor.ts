import type { MarkdownFlavor } from "@/lib/markdown/render";
import type { TextFlavor } from "@/lib/types";

/** Stored `obsidian` is legacy — renders the same as `markdown`. */
export function isMarkdownFlavor(
  flavor?: TextFlavor,
): flavor is "markdown" | "obsidian" {
  return flavor === "markdown" || flavor === "obsidian";
}

export function normalizeTextFlavor(flavor?: TextFlavor): TextFlavor {
  if (flavor === "obsidian") return "markdown";
  return flavor ?? "plain";
}

/** All markdown text uses GFM + Obsidian extensions in one pipeline. */
export function toRenderFlavor(_flavor?: TextFlavor | MarkdownFlavor): MarkdownFlavor {
  return "obsidian";
}

export const MARKDOWN_EDITOR_PLACEHOLDER =
  "Markdown — GFM tables & tasks, [[wikilinks]], @[ to link, #tags, > [!note] callouts…";
