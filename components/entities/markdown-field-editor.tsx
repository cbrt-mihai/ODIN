"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { InsertReferenceDialog } from "@/components/references/insert-reference-dialog";
import { MARKDOWN_EDITOR_PLACEHOLDER, toRenderFlavor } from "@/lib/markdown/flavor";
import { markdownPreviewClassName } from "@/lib/markdown/render";
import type { MarkdownFlavor } from "@/lib/markdown/render";
import {
  shouldOpenReferenceWizard,
  stripAtBracketReferenceTrigger,
} from "@/lib/references/at-bracket-trigger";
import { useReferenceCatalog } from "@/components/references/reference-context";
import type { Case, Entity } from "@/lib/types";

function insertAtSelection(
  value: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const nextValue = `${before}${insertion}${after}`;
  const cursor = selectionStart + insertion.length;
  return { nextValue, cursor };
}

export function MarkdownFieldEditor({
  value,
  onChange,
  flavor,
  placeholder,
  entities = [],
  cases = [],
  showPreview = true,
  minRows = 10,
}: {
  value: string;
  onChange: (v: string) => void;
  flavor: MarkdownFlavor;
  placeholder?: string;
  entities?: Entity[];
  cases?: Case[];
  /** When false, write-only — use View mode elsewhere for full-page reading. */
  showPreview?: boolean;
  minRows?: number;
}) {
  const catalog = useReferenceCatalog({ entities, cases });
  const catalogEntities = entities.length ? entities : catalog.entities;
  const catalogCases = cases.length ? cases : catalog.cases;

  const [html, setHtml] = useState("");
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { renderMarkdownToHtml } = await import("@/lib/markdown/render");
      const out = await renderMarkdownToHtml(value || "", {
        flavor: toRenderFlavor(flavor),
        entities: catalogEntities,
        cases: catalogCases,
        linkBehavior: "clickable",
      });
      if (!cancelled) setHtml(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [value, flavor, catalogEntities, catalogCases]);

  function rememberSelection() {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = {
      start: el.selectionStart,
      end: el.selectionEnd,
    };
  }

  function handleInsertReference(text: string) {
    const { start, end } = selectionRef.current;
    const { nextValue, cursor } = insertAtSelection(value, text, start, end);
    onChange(nextValue);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      const newValue = el.value;
      const cursor = el.selectionStart ?? newValue.length;

      if (shouldOpenReferenceWizard(newValue, cursor)) {
        const { nextValue, nextCursor } = stripAtBracketReferenceTrigger(
          newValue,
          cursor,
        );
        selectionRef.current = { start: nextCursor, end: nextCursor };
        onChange(nextValue);
        setReferenceDialogOpen(true);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(nextCursor, nextCursor);
        });
        return;
      }

      onChange(newValue);
      selectionRef.current = {
        start: cursor,
        end: el.selectionEnd ?? cursor,
      };
    },
    [onChange],
  );

  const editorPlaceholder = placeholder ?? MARKDOWN_EDITOR_PLACEHOLDER;

  const referenceButton = (
    <InsertReferenceDialog
      entities={catalogEntities}
      cases={catalogCases}
      onInsert={handleInsertReference}
      open={referenceDialogOpen}
      onOpenChange={setReferenceDialogOpen}
    />
  );

  if (!showPreview) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">{referenceButton}</div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onSelect={rememberSelection}
          onKeyUp={rememberSelection}
          onClick={rememberSelection}
          rows={minRows}
          className="min-h-[min(70vh,640px)] font-mono text-sm leading-relaxed resize-y"
          placeholder={editorPlaceholder}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex justify-end">{referenceButton}</div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onSelect={rememberSelection}
          onKeyUp={rememberSelection}
          onClick={rememberSelection}
          rows={minRows}
          className="font-mono text-xs"
          placeholder={editorPlaceholder}
        />
      </div>
      <div className="min-h-[120px] rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">Preview</p>
        {value.trim() ? (
          <div
            className={markdownPreviewClassName()}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-sm text-zinc-600">Nothing to preview</p>
        )}
      </div>
    </div>
  );
}
