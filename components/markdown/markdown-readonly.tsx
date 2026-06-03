"use client";

import { useEffect, useState } from "react";
import {
  markdownPreviewClassName,
  type MarkdownFlavor,
} from "@/lib/markdown/render";
import { toRenderFlavor } from "@/lib/markdown/flavor";
import type { Entity } from "@/lib/types";

/** Read-only markdown — GFM + Obsidian (wikilinks, tags, callouts). */
export function MarkdownReadonly({
  content,
  flavor,
  entities = [],
}: {
  content: string;
  flavor?: MarkdownFlavor;
  entities?: Entity[];
}) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { renderMarkdownToHtml } = await import("@/lib/markdown/render");
      const out = await renderMarkdownToHtml(content, {
        flavor: toRenderFlavor(flavor),
        entities,
        linkBehavior: "clickable",
      });
      if (!cancelled) setHtml(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [content, flavor, entities]);

  return (
    <div
      className={markdownPreviewClassName()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
