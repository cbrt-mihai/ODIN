"use client";

import { useState } from "react";
import { collapsibleSummaryClass } from "@/components/ui/collapsible-card";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TextFlavorToggle } from "@/components/entities/text-flavor-toggle";
import { AnnotatedText } from "@/components/entities/annotated-text";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import {
  MARKDOWN_EDITOR_PLACEHOLDER,
  normalizeTextFlavor,
} from "@/lib/markdown/flavor";
import type { Entity, EntryAnnotations, TextFlavor } from "@/lib/types";

type AnnTab = "description" | "tags" | "notes";

function AnnotationEditor({
  value,
  flavor,
  onValueChange,
  onFlavorChange,
  placeholder,
  compact,
}: {
  value: string;
  flavor?: TextFlavor;
  onValueChange: (v: string | undefined) => void;
  onFlavorChange: (f: TextFlavor) => void;
  placeholder: string;
  compact?: boolean;
}) {
  const f = normalizeTextFlavor(flavor);
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <TextFlavorToggle value={f} onChange={onFlavorChange} />
      </div>
      {f === "plain" ? (
        <Textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value || undefined)}
          rows={compact ? 3 : 4}
          placeholder={placeholder}
          className="text-sm"
        />
      ) : (
        <MarkdownFieldEditor
          value={value}
          onChange={(text) => onValueChange(text || undefined)}
          flavor="obsidian"
          placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
          showPreview={false}
          minRows={compact ? 4 : 6}
        />
      )}
    </div>
  );
}

export function EntryAnnotationsPanel({
  value,
  onChange,
  readOnly,
  entities = [],
  compact,
  embedded,
}: {
  value: EntryAnnotations;
  onChange: (v: EntryAnnotations) => void;
  readOnly?: boolean;
  entities?: Entity[];
  compact?: boolean;
  /** Inside field meta panel — no extra chrome */
  embedded?: boolean;
}) {
  const tags = value.tags ?? [];
  const [tab, setTab] = useState<AnnTab>("description");

  function patch(p: Partial<EntryAnnotations>) {
    onChange({ ...value, ...p });
  }

  if (readOnly) {
    const has =
      value.description || value.notes || tags.length > 0;
    if (!has) return null;
    return (
      <div className="space-y-3 text-sm">
        {value.description && (
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">Description</p>
            <AnnotatedText
              text={value.description}
              flavor={value.descriptionFlavor}
              entities={entities}
            />
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">Tags</p>
            <TagInput tags={tags} onChange={() => {}} disabled />
          </div>
        )}
        {value.notes && (
          <div>
            <p className="mb-1 text-xs font-medium text-zinc-500">Notes</p>
            <AnnotatedText
              text={value.notes}
              flavor={value.notesFlavor}
              entities={entities}
            />
          </div>
        )}
      </div>
    );
  }

  const body = (
    <div className="space-y-3">
      <SegmentedControl<AnnTab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "description", label: "Description" },
          { value: "tags", label: tags.length ? `Tags (${tags.length})` : "Tags" },
          { value: "notes", label: "Notes" },
        ]}
      />

      {tab === "description" && (
        <AnnotationEditor
          value={value.description ?? ""}
          flavor={value.descriptionFlavor}
          onValueChange={(description) => patch({ description })}
          onFlavorChange={(descriptionFlavor) => patch({ descriptionFlavor })}
          placeholder="What this entry represents…"
          compact={compact}
        />
      )}

      {tab === "tags" && (
        <div>
          <Label className="mb-2 block text-xs text-zinc-500">
            Tags for filtering and grouping
          </Label>
          <TagInput tags={tags} onChange={(t) => patch({ tags: t })} />
        </div>
      )}

      {tab === "notes" && (
        <AnnotationEditor
          value={value.notes ?? ""}
          flavor={value.notesFlavor}
          onValueChange={(notes) => patch({ notes })}
          onFlavorChange={(notesFlavor) => patch({ notesFlavor })}
          placeholder="Investigation notes, hypotheses, caveats…"
          compact={compact}
        />
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <details
      className="rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3"
      open={!compact}
    >
      <summary
        className={cn(collapsibleSummaryClass, "text-xs font-medium text-zinc-500")}
      >
        Description, tags & notes
      </summary>
      <div className="mt-3">{body}</div>
    </details>
  );
}

export function annotationsFrom<T extends EntryAnnotations>(item: T): EntryAnnotations {
  return {
    description: item.description,
    descriptionFlavor: item.descriptionFlavor,
    tags: item.tags,
    notes: item.notes,
    notesFlavor: item.notesFlavor,
  };
}

export function applyAnnotations<T extends EntryAnnotations>(
  item: T,
  ann: EntryAnnotations,
): T {
  return { ...item, ...ann };
}
