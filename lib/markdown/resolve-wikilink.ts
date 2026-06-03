import type { Case, Entity } from "@/lib/types";
import { resolveWikilinkInner } from "@/lib/references/resolve";
import { wikilinkSpan } from "./escape-html";
import { replaceOutsideCode } from "./replace-outside-code";

export interface ResolvedLink {
  href: string;
  label: string;
  external: boolean;
}

export function resolveWikilink(
  raw: string,
  entities: Entity[],
  cases: Case[] = [],
): ResolvedLink | null {
  const resolved = resolveWikilinkInner(raw, { entities, cases });
  if (!resolved) return null;
  return {
    href: resolved.href,
    label: resolved.label,
    external: resolved.external,
  };
}

/** Replace [[targets]] with markdown links for clickable description rendering. */
export function wikilinksToMarkdownLinks(
  content: string,
  entities: Entity[],
  cases: Case[] = [],
): string {
  return replaceOutsideCode(content, (segment) =>
    segment.replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
      const resolved = resolveWikilink(inner, entities, cases);
      if (resolved) {
        return `[${resolved.label}](${resolved.href})`;
      }
      return wikilinkSpan(inner);
    }),
  );
}
