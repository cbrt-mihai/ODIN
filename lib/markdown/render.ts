import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Schema } from "hast-util-sanitize";
import { cn } from "@/lib/utils";
import type { Case, Entity } from "@/lib/types";
import { BARE_DOT_PATH_RE } from "@/lib/references/parse";
import { resolveInternalRef, resolveWikilinkInner } from "@/lib/references/resolve";
import { escapeHtml, wikilinkSpan } from "./escape-html";
import { replaceOutsideCode } from "./replace-outside-code";

export type MarkdownFlavor = "rich" | "obsidian";

export type MarkdownLinkBehavior = "clickable" | "readonly-field";

const obsidianSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    blockquote: [
      ...(Array.isArray(defaultSchema.attributes?.blockquote)
        ? defaultSchema.attributes.blockquote
        : []),
      ["className", /^callout/],
    ],
    span: [["className", "wikilink"]],
  },
};

function formatCalloutBody(body: string): string {
  return body.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function applyObsidianExtensions(
  content: string,
  entities: Entity[],
  cases: Case[],
): string {
  let processed = replaceOutsideCode(content, (segment) =>
    segment.replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
      const resolved = resolveWikilinkInner(inner, { entities, cases });
      if (resolved) {
        return `[${resolved.label}](${resolved.href})`;
      }
      return wikilinkSpan(inner);
    }),
  );

  processed = replaceOutsideCode(processed, (segment) => {
    BARE_DOT_PATH_RE.lastIndex = 0;
    return segment.replace(BARE_DOT_PATH_RE, (match, prefix: string, path: string) => {
      const resolved = resolveInternalRef(`@${path}`, { entities, cases });
      if (resolved) {
        return `${prefix}[${resolved.label}](${resolved.href})`;
      }
      return `${prefix}${wikilinkSpan(`@${path}`)}`;
    });
  });

  processed = replaceOutsideCode(processed, (segment) =>
    segment.replace(
      /(^|\s)#([a-zA-Z0-9_-]+)/g,
      '$1<span class="text-emerald-400/90">#$2</span>',
    ),
  );

  processed = processed.replace(
    /^> \[!(\w+)\]\s*(.*)$/gm,
    (_line, kind: string, body: string) =>
      `<blockquote class="callout callout-${escapeHtml(kind)}"><p>${formatCalloutBody(body)}</p></blockquote>`,
  );

  return processed;
}

/**
 * Render markdown for descriptions and internal pages — links are clickable in prose.
 */
export async function renderMarkdownToHtml(
  content: string,
  options: {
    flavor?: MarkdownFlavor;
    entities?: Entity[];
    cases?: Case[];
    linkBehavior?: MarkdownLinkBehavior;
  } = {},
): Promise<string> {
  const { entities = [], cases = [], linkBehavior = "clickable" } = options;

  if (linkBehavior === "readonly-field") {
    return "";
  }

  // GFM (remark-gfm) + Obsidian syntax in one pass — flavor no longer excludes extensions.
  let processed = applyObsidianExtensions(content, entities, cases);

  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize, obsidianSanitizeSchema)
    .use(rehypeStringify)
    .process(processed);
  return String(result);
}

/** Sanitize and stringify stored HTML internal pages (not markdown). */
export async function renderHtmlPageToHtml(content: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, defaultSchema)
    .use(rehypeStringify)
    .process(content);
  return String(result);
}

export function markdownPreviewClassName() {
  return cn(
    "prose prose-invert prose-sm max-w-none",
    "[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2",
    "[&_a:hover]:text-blue-300",
    "[&_table]:border-zinc-700",
    "[&_.wikilink]:font-medium [&_.wikilink]:text-violet-400/90",
    "[&_.callout]:my-3 [&_.callout]:rounded-r-md [&_.callout]:border-l-4 [&_.callout]:py-2 [&_.callout]:pl-3",
    "[&_.callout-note]:border-amber-600/70 [&_.callout-note]:bg-amber-950/25 [&_.callout-note]:text-amber-100/90",
    "[&_.callout]:border-zinc-600 [&_.callout]:bg-zinc-900/40",
  );
}
