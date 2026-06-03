import {
  markdownPreviewClassName,
  renderMarkdownToHtml,
} from "@/lib/markdown/render";
import type { MarkdownFlavor } from "@/lib/markdown/render";
import type { Entity } from "@/lib/types";

/**
 * Description / page content — hyperlinks and wikilinks are clickable in the body text.
 */
export async function MarkdownPreview({
  content,
  flavor = "rich",
  entities = [],
}: {
  content: string;
  flavor?: MarkdownFlavor;
  entities?: Entity[];
}) {
  if (!content.trim()) {
    return <p className="text-sm text-zinc-500">Empty</p>;
  }
  const html = await renderMarkdownToHtml(content, {
    flavor,
    entities,
    linkBehavior: "clickable",
  });
  return (
    <div
      className={markdownPreviewClassName()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
