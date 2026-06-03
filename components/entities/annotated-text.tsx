"use client";

import { MarkdownReadonly } from "@/components/markdown/markdown-readonly";
import { isMarkdownFlavor } from "@/lib/markdown/flavor";
import type { Entity, TextFlavor } from "@/lib/types";

export function AnnotatedText({
  text,
  flavor = "plain",
  entities = [],
}: {
  text: string;
  flavor?: TextFlavor;
  entities?: Entity[];
}) {
  if (!text.trim()) return null;
  if (isMarkdownFlavor(flavor)) {
    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
        <MarkdownReadonly content={text} entities={entities} />
      </div>
    );
  }
  return <p className="whitespace-pre-wrap text-sm text-zinc-300">{text}</p>;
}
