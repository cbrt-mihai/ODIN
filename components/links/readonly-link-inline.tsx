"use client";

import { LinkDestinationButton } from "./link-destination-button";
import { parseLinkSegments } from "@/lib/markdown/parse-link-segments";
import { resolveWikilink } from "@/lib/markdown/resolve-wikilink";
import type { Entity } from "@/lib/types";

interface ReadonlyLinkInlineProps {
  content: string;
  entities: Entity[];
  className?: string;
}

/** Read-only field text: links are plain text plus a small navigate icon (not inline hyperlinks). */
export function ReadonlyLinkInline({
  content,
  entities,
  className,
}: ReadonlyLinkInlineProps) {
  const segments = parseLinkSegments(content);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {seg.value}
            </span>
          );
        }
        if (seg.kind === "wikilink") {
          const resolved = resolveWikilink(seg.value, entities);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 align-middle text-zinc-300"
            >
              <span className="font-medium text-violet-400/90">{seg.value}</span>
              {resolved && (
                <LinkDestinationButton
                  href={resolved.href}
                  variant={resolved.external ? "external" : "internal"}
                  title={
                    resolved.external
                      ? "Open external link"
                      : `Open ${resolved.label}`
                  }
                />
              )}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 align-middle text-zinc-300"
          >
            <span className="break-all text-zinc-400">{seg.value}</span>
            <LinkDestinationButton
              href={seg.value}
              variant="external"
              title="Open external link"
            />
          </span>
        );
      })}
    </span>
  );
}
