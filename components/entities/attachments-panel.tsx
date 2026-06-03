"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { MediaListToolbar } from "@/components/entities/media-list-toolbar";
import { MediaEntryDetail } from "@/components/entities/media-entry-detail";
import {
  DEFAULT_MEDIA_CONTROLS,
  matchesSearch,
  compareStrings,
  compareNumbers,
  type MediaListControls,
} from "@/lib/media-list/utils";
import { patchEntityAttachments } from "@/lib/actions/entities";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  Entity,
} from "@/lib/types";

function attachmentOrder(a: Attachment, index: number) {
  return a.order ?? index;
}

export function AttachmentsPanel({
  entity,
  baselineEntity,
  readOnly,
  onReorder,
  onUpdateAttachments,
  confidenceTypes,
}: {
  entity: Entity;
  baselineEntity?: Entity;
  readOnly?: boolean;
  onReorder?: (attachments: Attachment[]) => void;
  onUpdateAttachments?: (attachments: Attachment[]) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [controls, setControls] = useState<MediaListControls>(
    DEFAULT_MEDIA_CONTROLS,
  );
  const attachments = entity.attachments ?? [];

  const sortedBase = useMemo(
    () =>
      [...attachments]
        .map((a, i) => ({ ...a, order: attachmentOrder(a, i) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [attachments],
  );

  const mimeOptions = useMemo(
    () => [...new Set(sortedBase.map((a) => a.mimeType))].sort(),
    [sortedBase],
  );

  const displayed = useMemo(() => {
    let items = sortedBase.filter((a) => {
      if (controls.mimeFilter !== "all" && a.mimeType !== controls.mimeFilter) {
        return false;
      }
      return matchesSearch(
        controls.search,
        a.filename,
        a.caption,
        a.description,
        a.sha256,
        a.mimeType,
        ...(a.tags ?? []),
        a.notes,
      );
    });

    items = [...items].sort((a, b) => {
      const dir = controls.sortDir;
      switch (controls.sort) {
        case "name":
          return compareStrings(a.filename, b.filename, dir);
        case "size":
          return compareNumbers(a.sizeBytes, b.sizeBytes, dir);
        case "date":
          return compareStrings(a.uploadedAt, b.uploadedAt, dir);
        default:
          return compareNumbers(a.order ?? 0, b.order ?? 0, dir);
      }
    });

    return items;
  }, [sortedBase, controls]);

  const canReorder =
    !readOnly &&
    onReorder &&
    controls.sort === "order" &&
    !controls.search &&
    controls.mimeFilter === "all";

  function updateItem(id: string, patch: Attachment) {
    if (!onUpdateAttachments) return;
    onUpdateAttachments(
      attachments.map((a) => (a.id === id ? patch : a)),
    );
  }

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("kind", "attachment");
    form.append("file", file);
    setLoading(true);
    try {
      await fetch(`/api/entities/${entity.id}/upload`, {
        method: "POST",
        body: form,
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove(attachmentId: string) {
    const att = attachments.find((a) => a.id === attachmentId);
    const ok = await confirm({
      title: "Remove file",
      description: `Remove "${att?.filename ?? "this file"}" from the platform?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await fetch(
      `/api/entities/${entity.id}/upload?attachmentId=${attachmentId}`,
      { method: "DELETE" },
    );
    router.refresh();
  }

  async function handleReorder(ids: string[]) {
    if (!onReorder) return;
    const byId = new Map(sortedBase.map((a) => [a.id, a]));
    const reordered = ids
      .map((id, index) => {
        const a = byId.get(id);
        return a ? { ...a, order: index } : null;
      })
      .filter(Boolean) as Attachment[];
    const remaining = sortedBase
      .filter((a) => !ids.includes(a.id))
      .map((a, i) => ({ ...a, order: reordered.length + i }));
    const next = [...reordered, ...remaining];
    onReorder(next);
    await patchEntityAttachments(entity.id, next);
    router.refresh();
  }

  return (
    <CollapsibleCard
      id="entity-files"
      title="Files (platform)"
      contentClassName="space-y-3"
    >
      <MediaListToolbar
        controls={controls}
        onChange={(patch) => setControls((c) => ({ ...c, ...patch }))}
        mode="files"
        mimeOptions={mimeOptions}
      />

      {!readOnly && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
          <Upload className="h-4 w-4" />
          Upload file
          <input
            type="file"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </label>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-zinc-500">No attachments.</p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-zinc-500">No files match filters.</p>
      ) : (
        <SortableList
          ids={displayed.map((a) => a.id)}
          onReorder={handleReorder}
          disabled={!canReorder}
          className="space-y-2"
        >
          {(id, handle) => {
            const a = displayed.find((x) => x.id === id)!;
            const open = expandedId === id;
            return (
              <div
                key={a.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40"
              >
                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    {canReorder && handle}
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {a.description ?? a.filename}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {a.filename} · {(a.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                      {(a.tags ?? []).length > 0 && (
                        <p className="text-[10px] text-zinc-500">
                          {a.tags!.join(" · ")}
                        </p>
                      )}
                      <button
                        type="button"
                        className="text-[10px] text-blue-400 hover:underline"
                        onClick={() => setExpandedId(open ? null : id)}
                      >
                        {open ? "Hide details" : "Details & proof"}
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={`/api/files/${a.path}`}
                      download={a.filename}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 hover:bg-zinc-800"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {open && onUpdateAttachments && (
                  <div className="px-3 pb-3">
                    <MediaEntryDetail
                      item={a}
                      baselineItem={(baselineEntity ?? entity).attachments?.find(
                        (x) => x.id === a.id,
                      )}
                      entityId={entity.id}
                      onChange={(next) =>
                        updateItem(id, next as Attachment)
                      }
                      readOnly={readOnly}
                      confidenceTypes={confidenceTypes}
                    />
                  </div>
                )}
              </div>
            );
          }}
        </SortableList>
      )}
      {canReorder && (
        <p className="text-xs text-zinc-500">
          Drag files to reorder — order saves automatically.
        </p>
      )}
    </CollapsibleCard>
  );
}
