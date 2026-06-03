"use client";

import { useEffect, useState } from "react";
import { markdownPreviewClassName } from "@/lib/markdown/render";

/** Read-only rendered HTML internal page (sanitized). */
export function HtmlPageReadonly({ content }: { content: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { renderHtmlPageToHtml } = await import("@/lib/markdown/render");
      const out = await renderHtmlPageToHtml(content);
      if (!cancelled) setHtml(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className={markdownPreviewClassName()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
