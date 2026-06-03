"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { MediaListToolbar } from "@/components/entities/media-list-toolbar";
import { GalleryFolderNav } from "@/components/entities/gallery-folders";
import { MediaUploadDestination } from "@/components/entities/media-upload-destination";
import {
  DEFAULT_MEDIA_CONTROLS,
  matchesSearch,
  compareStrings,
  compareNumbers,
  type MediaListControls,
} from "@/lib/media-list/utils";
import {
  DEFAULT_UPLOAD_DESTINATION,
  resolveMediaUploadFolderId,
} from "@/lib/media/upload-destination";
import {
  patchEntityAttachment,
  patchEntityAttachmentFolders,
  patchEntityAttachments,
} from "@/lib/actions/entities";
import { duplicateAttachment } from "@/lib/media/item-ops";
import { MediaItemEditDialog, type MediaEditItem } from "@/components/entities/media-item-edit-dialog";
import { MediaItemDetailDialog } from "@/components/entities/media-item-detail-dialog";
import { MediaItemToolbar } from "@/components/entities/media-item-toolbar";
import { uploadEntityMediaFiles } from "@/lib/uploads/entity-media-upload";
import {
  MediaUploadReviewDialog,
  type MediaReviewItem,
} from "@/components/entities/media-upload-review-dialog";
import { mediaDisplayName } from "@/lib/media/display-name";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
} from "@/lib/types";
import type { MediaUploadDestinationState } from "@/lib/media/upload-destination";

function attachmentOrder(a: Attachment, index: number) {
  return a.order ?? index;
}

export function AttachmentsPanel({
  entity,
  baselineEntity,
  readOnly,
  onReorder,
  onUpdateAttachments,
  onUpdateFolders,
  confidenceTypes,
  entities = [],
}: {
  entity: Entity;
  baselineEntity?: Entity;
  readOnly?: boolean;
  onReorder?: (attachments: Attachment[]) => void;
  onUpdateAttachments?: (attachments: Attachment[]) => void;
  onUpdateFolders?: (folders: GalleryFolder[]) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [detailItem, setDetailItem] = useState<MediaEditItem | null>(null);
  const [uploadDestination, setUploadDestination] =
    useState<MediaUploadDestinationState>(DEFAULT_UPLOAD_DESTINATION);
  const [controls, setControls] = useState<MediaListControls>(
    DEFAULT_MEDIA_CONTROLS,
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<MediaReviewItem[]>([]);
  const [editItem, setEditItem] = useState<MediaEditItem | null>(null);
  const attachments = entity.attachments ?? [];
  const folders = entity.attachmentFolders ?? [];
  const atRoot = currentFolderId === undefined;

  const persistFolders = useCallback(
    async (next: GalleryFolder[]) => {
      onUpdateFolders?.(next);
      await patchEntityAttachmentFolders(entity.id, next);
      router.refresh();
    },
    [entity.id, onUpdateFolders, router],
  );

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
      const inFolder =
        (a.folderId ?? undefined) === (currentFolderId ?? undefined);
      if (!inFolder) return false;
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
          return compareStrings(mediaDisplayName(a), mediaDisplayName(b), dir);
        case "size":
          return compareNumbers(a.sizeBytes, b.sizeBytes, dir);
        case "date":
          return compareStrings(a.uploadedAt, b.uploadedAt, dir);
        default:
          return compareNumbers(a.order ?? 0, b.order ?? 0, dir);
      }
    });

    return items;
  }, [sortedBase, controls, currentFolderId]);

  const canReorder =
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

  async function targetFolderId() {
    return resolveMediaUploadFolderId(
      currentFolderId,
      uploadDestination,
      folders,
      persistFolders,
    );
  }

  function openReview(uploads: MediaReviewItem[]) {
    if (!uploads.length) return;
    setReviewItems(uploads);
    setReviewOpen(true);
    router.refresh();
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    if (
      atRoot &&
      uploadDestination.mode === "existing" &&
      !uploadDestination.existingFolderId
    ) {
      return;
    }
    setLoading(true);
    try {
      const folderId = await targetFolderId();
      const uploads = await uploadEntityMediaFiles(
        entity.id,
        "attachment",
        files,
        { folderId },
      );
      openReview(uploads);
    } finally {
      setLoading(false);
    }
  }

  async function moveItem(item: Attachment, folderId: string | undefined) {
    const next = { ...item, folderId };
    updateItem(item.id, next);
    await patchEntityAttachment(entity.id, next);
    router.refresh();
  }

  async function duplicateItem(item: Attachment) {
    const order =
      Math.max(-1, ...attachments.map((a) => a.order ?? 0)) + 1;
    const copy = duplicateAttachment(item, order);
    const next = [...attachments, copy];
    onUpdateAttachments?.(next);
    await patchEntityAttachments(entity.id, next);
    router.refresh();
  }

  async function removeReviewItem(review: MediaReviewItem) {
    if (review.kind !== "attachment") return;
    const id = review.item.id;
    await fetch(
      `/api/entities/${entity.id}/upload?attachmentId=${id}`,
      { method: "DELETE" },
    );
    onUpdateAttachments?.((entity.attachments ?? []).filter((a) => a.id !== id));
    setReviewItems((items) => items.filter((i) => i.item.id !== id));
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
      {onUpdateFolders && (
        <GalleryFolderNav
          folders={folders}
          currentFolderId={currentFolderId}
          onSelectFolder={setCurrentFolderId}
          onChangeFolders={onUpdateFolders}
          readOnly={readOnly}
          canCreateFolder
          onPersistFolders={persistFolders}
          rootLabel="All files"
        />
      )}

      <MediaListToolbar
        controls={controls}
        onChange={(patch) => setControls((c) => ({ ...c, ...patch }))}
        mode="files"
        mimeOptions={mimeOptions}
      />

      {atRoot && (
        <MediaUploadDestination
          folders={folders}
          value={uploadDestination}
          onChange={setUploadDestination}
          rootLabel="Root (no folder)"
        />
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
        <Upload className="h-4 w-4" />
        Upload file
        <input
          type="file"
          multiple
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void uploadFiles(files);
          }}
        />
      </label>

      {attachments.length === 0 ? (
        <p className="text-sm text-zinc-500">No attachments.</p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-zinc-500">No files in this folder match filters.</p>
      ) : (
        <SortableList
          ids={displayed.map((a) => a.id)}
          onReorder={handleReorder}
          disabled={!canReorder}
          className="space-y-2"
        >
          {(id, handle) => {
            const a = displayed.find((x) => x.id === id)!;
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
                        {mediaDisplayName(a)}
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
                        onClick={() =>
                          setDetailItem({ kind: "attachment", item: a })
                        }
                      >
                        Details & proof
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/api/files/${a.path}`}
                      download={a.filename}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 hover:bg-zinc-800"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <MediaItemToolbar
                      item={a}
                      folders={folders}
                      onEdit={() =>
                        setEditItem({ kind: "attachment", item: a })
                      }
                      onDuplicate={() => void duplicateItem(a)}
                      onMove={(folderId) => void moveItem(a, folderId)}
                      onDelete={() => void remove(a.id)}
                    />
                  </div>
                </div>
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

      <MediaItemDetailDialog
        item={detailItem}
        onOpenChange={(open) => {
          if (!open) setDetailItem(null);
        }}
        entityId={entity.id}
        folders={folders}
        confidenceTypes={confidenceTypes}
        entities={entities}
        canEdit={Boolean(onUpdateAttachments)}
        onSaved={(saved) => {
          if (saved.kind === "attachment") {
            onUpdateAttachments?.(
              attachments.map((x) =>
                x.id === saved.item.id ? saved.item : x,
              ),
            );
          }
        }}
      />

      <MediaItemEditDialog
        item={editItem}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        entityId={entity.id}
        folders={folders}
        confidenceTypes={confidenceTypes}
        entities={entities}
        onSaved={(saved) => {
          if (saved.kind === "attachment") {
            onUpdateAttachments?.(
              attachments.map((a) =>
                a.id === saved.item.id ? saved.item : a,
              ),
            );
          }
        }}
      />

      <MediaUploadReviewDialog
        open={reviewOpen}
        items={reviewItems}
        onOpenChange={setReviewOpen}
        entityId={entity.id}
        folders={folders}
        confidenceTypes={confidenceTypes}
        entities={entities}
        onItemSaved={(review) => {
          if (review.kind === "attachment") {
            const list = entity.attachments ?? [];
            onUpdateAttachments?.(
              list.some((a) => a.id === review.item.id)
                ? list.map((a) => (a.id === review.item.id ? review.item : a))
                : [...list, review.item],
            );
          }
        }}
        onItemRemoved={removeReviewItem}
      />
    </CollapsibleCard>
  );
}
