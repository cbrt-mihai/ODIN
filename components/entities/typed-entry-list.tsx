"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TextFlavorToggle } from "@/components/entities/text-flavor-toggle";
import { AnnotatedText } from "@/components/entities/annotated-text";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { kindLabel } from "@/lib/entries/helpers";
import {
  MARKDOWN_EDITOR_PLACEHOLDER,
  normalizeTextFlavor,
} from "@/lib/markdown/flavor";
import type { Entity, TextFlavor } from "@/lib/types";

type EntryBase = {
  id: string;
  title: string;
  kind: string;
  body: string;
  bodyFlavor?: TextFlavor;
  tags?: string[];
  order: number;
};

export function TypedEntryList<E extends EntryBase>({
  entries,
  onChange,
  kinds,
  defaultKind,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  readOnly,
  entities = [],
  emptyHint,
  addLabel = "Add entry",
}: {
  entries: E[];
  onChange: (entries: E[]) => void;
  kinds: { id: E["kind"]; label: string }[];
  defaultKind: E["kind"];
  onAdd: (entries: E[], kind: E["kind"]) => E[];
  onUpdate: (entries: E[], id: string, patch: Partial<E>) => E[];
  onRemove: (entries: E[], id: string) => E[];
  onReorder: (entries: E[], ids: string[]) => E[];
  readOnly?: boolean;
  entities?: Entity[];
  emptyHint: string;
  addLabel?: string;
}) {
  const confirm = useConfirm();
  const [newKind, setNewKind] = useState<E["kind"]>(defaultKind);
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const ids = sorted.map((e) => e.id);

  if (readOnly) {
    if (sorted.length === 0) return null;
    return (
      <ul className="space-y-3">
        {sorted.map((e) => (
          <li
            key={e.id}
            className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <p className="font-medium text-zinc-200">
              {e.title}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {kindLabel(kinds, e.kind)}
              </span>
            </p>
            {e.body.trim() ? (
              <AnnotatedText
                text={e.body}
                flavor={normalizeTextFlavor(e.bodyFlavor)}
                entities={entities}
              />
            ) : null}
            {(e.tags ?? []).length > 0 && (
              <div className="mt-2">
                <TagInput tags={e.tags ?? []} onChange={() => {}} disabled />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-44">
          <Label className="text-xs text-zinc-500">Type</Label>
          <Select
            value={newKind}
            onValueChange={(v) => setNewKind(v as E["kind"])}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(onAdd(entries, newKind))}
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-600">{emptyHint}</p>
      ) : (
        <SortableList
          ids={ids}
          onReorder={(ordered) => onChange(onReorder(entries, ordered))}
          className="space-y-2"
        >
          {(id, handle) => {
            const e = sorted.find((x) => x.id === id)!;
            const flavor = normalizeTextFlavor(e.bodyFlavor);
            return (
              <div
                key={id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {handle}
                  <Input
                    value={e.title}
                    onChange={(ev) =>
                      onChange(
                        onUpdate(entries, id, {
                          title: ev.target.value,
                        } as Partial<E>),
                      )
                    }
                    className="h-8 min-w-[120px] flex-1 text-sm font-medium"
                    placeholder="Title"
                  />
                  <Select
                    value={e.kind}
                    onValueChange={(kind) =>
                      onChange(
                        onUpdate(entries, id, { kind } as Partial<E>),
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kinds.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Remove entry",
                        description: `Remove "${e.title}"?`,
                        confirmLabel: "Remove",
                        destructive: true,
                      });
                      if (!ok) return;
                      onChange(onRemove(entries, id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                  </Button>
                </div>
                <div className="flex justify-end">
                  <TextFlavorToggle
                    value={flavor}
                    onChange={(bodyFlavor) =>
                      onChange(
                        onUpdate(entries, id, { bodyFlavor } as Partial<E>),
                      )
                    }
                  />
                </div>
                {flavor === "plain" ? (
                  <Textarea
                    value={e.body}
                    onChange={(ev) =>
                      onChange(
                        onUpdate(entries, id, {
                          body: ev.target.value,
                        } as Partial<E>),
                      )
                    }
                    rows={3}
                    className="text-sm"
                    placeholder="Content…"
                  />
                ) : (
                  <MarkdownFieldEditor
                    value={e.body}
                    onChange={(body) =>
                      onChange(
                        onUpdate(entries, id, { body } as Partial<E>),
                      )
                    }
                    flavor="obsidian"
                    placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
                    showPreview={false}
                    minRows={4}
                  />
                )}
                <TagInput
                  tags={e.tags ?? []}
                  onChange={(tags) =>
                    onChange(onUpdate(entries, id, { tags } as Partial<E>))
                  }
                />
              </div>
            );
          }}
        </SortableList>
      )}
    </div>
  );
}
