"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { MediaListToolbar } from "@/components/entities/media-list-toolbar";
import { GalleryFolderNav } from "@/components/entities/gallery-folders";
import { MediaPreview } from "@/components/entities/media-preview";
import { MediaUploadDestination } from "@/components/entities/media-upload-destination";
import {
  DEFAULT_MEDIA_CONTROLS,
  matchesSearch,
  compareStrings,
  compareNumbers,
  type MediaListControls,
} from "@/lib/media-list/utils";
import { galleryItemHref } from "@/lib/media/gallery";
import { mediaDisplayName } from "@/lib/media/display-name";
import { GALLERY_FILE_ACCEPT } from "@/lib/media/preview";
import {
  DEFAULT_UPLOAD_DESTINATION,
  resolveMediaUploadFolderId,
} from "@/lib/media/upload-destination";
import {
  patchEntityGallery,
  patchEntityGalleryFolders,
  patchEntityGalleryItem,
} from "@/lib/actions/entities";
import { duplicateGalleryItem } from "@/lib/media/item-ops";
import { MediaItemEditDialog, type MediaEditItem } from "@/components/entities/media-item-edit-dialog";
import { MediaItemDetailDialog } from "@/components/entities/media-item-detail-dialog";
import { MediaItemToolbar } from "@/components/entities/media-item-toolbar";
import { uploadEntityMediaFiles, uploadGalleryUrl } from "@/lib/uploads/entity-media-upload";
import {
  MediaUploadReviewDialog,
  type MediaReviewItem,
} from "@/components/entities/media-upload-review-dialog";
import type {
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
  GalleryImage,
} from "@/lib/types";
import type { MediaUploadDestinationState } from "@/lib/media/upload-destination";
import {
  DEFAULT_GALLERY_PREVIEW_SIZE,
  galleryPreviewLayout,
  readGalleryPreviewSize,
  writeGalleryPreviewSize,
  type GalleryPreviewSize,
} from "@/lib/ui/gallery-preview-size";

export function GalleryPanel({
  entity,
  baselineEntity,
  readOnly,
  onReorder,
  onUpdateGallery,
  onUpdateFolders,
  confidenceTypes,
  entities = [],
}: {
  entity: Entity;
  baselineEntity?: Entity;
  readOnly?: boolean;
  onReorder?: (gallery: GalleryImage[]) => void;
  onUpdateGallery?: (gallery: GalleryImage[]) => void;
  onUpdateFolders?: (folders: GalleryFolder[]) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [url, setUrl] = useState("");
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
  const [previewSize, setPreviewSize] = useState<GalleryPreviewSize>(
    DEFAULT_GALLERY_PREVIEW_SIZE,
  );

  useEffect(() => {
    setPreviewSize(readGalleryPreviewSize());
  }, []);

  const previewLayout = galleryPreviewLayout(previewSize);

  const folders = entity.galleryFolders ?? [];
  const atRoot = currentFolderId === undefined;

  const persistFolders = useCallback(
    async (next: GalleryFolder[]) => {
      onUpdateFolders?.(next);
      await patchEntityGalleryFolders(entity.id, next);
      router.refresh();
    },
    [entity.id, onUpdateFolders, router],
  );

  const sortedBase = useMemo(
    () => [...entity.gallery].sort((a, b) => a.order - b.order),
    [entity.gallery],
  );

  const displayed = useMemo(() => {
    let items = sortedBase.filter((item) => {
      const inFolder =
        (item.folderId ?? undefined) === (currentFolderId ?? undefined);
      if (!inFolder) return false;
      if (
        controls.sourceFilter !== "all" &&
        item.source !== controls.sourceFilter
      ) {
        return false;
      }
      return matchesSearch(
        controls.search,
        item.caption,
        item.filename,
        item.description,
        item.url,
        item.sha256,
        item.path,
        ...(item.tags ?? []),
        item.notes,
      );
    });

    items = [...items].sort((a, b) => {
      const dir = controls.sortDir;
      switch (controls.sort) {
        case "name":
          return compareStrings(
            mediaDisplayName(a),
            mediaDisplayName(b),
            dir,
          );
        case "date":
          return compareNumbers(a.order, b.order, dir);
        default:
          return compareNumbers(a.order, b.order, dir);
      }
    });

    return items;
  }, [sortedBase, controls, currentFolderId]);

  const displayIds = displayed.map((i) => i.id);
  const canReorder =
    onReorder &&
    controls.sort === "order" &&
    !controls.search &&
    controls.sourceFilter === "all";

  function updateItem(id: string, patch: GalleryImage) {
    if (!onUpdateGallery) return;
    onUpdateGallery(
      entity.gallery.map((g) => (g.id === id ? patch : g)),
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
      const uploads = await uploadEntityMediaFiles(entity.id, "gallery", files, {
        folderId,
      });
      openReview(uploads);
    } finally {
      setLoading(false);
    }
  }

  async function addUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (
      atRoot &&
      uploadDestination.mode === "existing" &&
      !uploadDestination.existingFolderId
    ) {
      return;
    }
    const folderId = await targetFolderId();
    setLoading(true);
    try {
      const item = await uploadGalleryUrl(entity.id, url.trim(), { folderId });
      setUrl("");
      openReview([{ kind: "gallery", item }]);
    } finally {
      setLoading(false);
    }
  }

  async function moveItem(item: GalleryImage, folderId: string | undefined) {
    const next = { ...item, folderId };
    updateItem(item.id, next);
    await patchEntityGalleryItem(entity.id, next);
    router.refresh();
  }

  async function duplicateItem(item: GalleryImage) {
    const order =
      Math.max(-1, ...entity.gallery.map((g) => g.order)) + 1;
    const copy = duplicateGalleryItem(item, order);
    const next = [...entity.gallery, copy];
    onUpdateGallery?.(next);
    await patchEntityGallery(entity.id, next);
    router.refresh();
  }

  async function removeReviewItem(review: MediaReviewItem) {
    if (review.kind !== "gallery") return;
    const id = review.item.id;
    await fetch(
      `/api/entities/${entity.id}/upload?galleryId=${id}`,
      { method: "DELETE" },
    );
    onUpdateGallery?.(entity.gallery.filter((g) => g.id !== id));
    setReviewItems((items) => items.filter((i) => i.item.id !== id));
  }

  async function remove(galleryId: string) {
    const item = entity.gallery.find((g) => g.id === galleryId);
    const ok = await confirm({
      title: "Remove media",
      description: `Remove "${mediaDisplayName(item)}" from the gallery?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await fetch(
      `/api/entities/${entity.id}/upload?galleryId=${galleryId}`,
      { method: "DELETE" },
    );
    router.refresh();
  }

  async function handleReorder(ids: string[]) {
    if (!onReorder) return;
    const byId = new Map(sortedBase.map((g) => [g.id, g]));
    const reordered = ids
      .map((id, index) => {
        const g = byId.get(id);
        return g ? { ...g, order: index } : null;
      })
      .filter(Boolean) as GalleryImage[];
    const remaining = sortedBase
      .filter((g) => !ids.includes(g.id))
      .map((g, i) => ({ ...g, order: reordered.length + i }));
    const next = [...reordered, ...remaining];
    onReorder(next);
    await patchEntityGallery(entity.id, next);
    router.refresh();
  }

  return (
    <CollapsibleCard id="entity-gallery" title="Gallery">
      {onUpdateFolders && (
        <GalleryFolderNav
          folders={folders}
          currentFolderId={currentFolderId}
          onSelectFolder={setCurrentFolderId}
          onChangeFolders={onUpdateFolders}
          readOnly={readOnly}
          canCreateFolder
          onPersistFolders={persistFolders}
          rootLabel="All images"
        />
      )}

      <MediaListToolbar
        controls={controls}
        onChange={(patch) => setControls((c) => ({ ...c, ...patch }))}
        mode="gallery"
        previewSize={previewSize}
        onPreviewSizeChange={(size) => {
          setPreviewSize(size);
          writeGalleryPreviewSize(size);
        }}
      />

      {atRoot && (
        <div className="mt-3">
          <MediaUploadDestination
            folders={folders}
            value={uploadDestination}
            onChange={setUploadDestination}
            rootLabel="Root (no folder)"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
          <Upload className="h-4 w-4" />
          Upload media
          <input
            type="file"
            accept={GALLERY_FILE_ACCEPT}
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
        <form onSubmit={addUrl} className="flex min-w-[200px] flex-1 gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Media URL (image, video, audio)"
          />
          <Button type="submit" size="sm" disabled={loading}>
            Add URL
          </Button>
        </form>
      </div>

      {entity.gallery.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No media yet.</p>
      ) : displayed.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No items in this folder match filters.</p>
      ) : (
        <SortableList
          ids={displayIds}
          onReorder={handleReorder}
          disabled={!canReorder}
          className={`mt-3 ${previewLayout.gridClass}`}
        >
          {(id, handle) => {
            const item = displayed.find((g) => g.id === id)!;
            const src = galleryItemHref(item);
            return (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
              >
                {canReorder && handle && (
                  <div className="absolute left-1 top-1 z-10">{handle}</div>
                )}
                <div
                  className="aspect-square w-full cursor-pointer overflow-hidden"
                  onClick={() =>
                    setDetailItem({ kind: "gallery", item })
                  }
                >
                  {src ? (
                    <MediaPreview
                      href={src}
                      title={mediaDisplayName(item)}
                      mimeType={item.mimeType}
                      filename={item.filename}
                      url={item.url}
                      path={item.path}
                      variant="thumb"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      No preview
                    </div>
                  )}
                </div>
                <div className={previewLayout.cardMetaClass}>
                  <p className={previewLayout.titleClass}>
                    {mediaDisplayName(item)}
                  </p>
                  {(item.tags ?? []).length > 0 && (
                    <p className={previewLayout.tagsClass}>
                      {item.tags!.join(" · ")}
                    </p>
                  )}
                  <button
                    type="button"
                    className={previewLayout.detailsClass}
                    onClick={() =>
                      setDetailItem({ kind: "gallery", item })
                    }
                  >
                    Details & proof
                  </button>
                </div>
                <div className="absolute right-1 top-1 z-10">
                  <MediaItemToolbar
                    item={item}
                    folders={folders}
                    expanded={previewLayout.toolbarExpanded}
                    onEdit={() =>
                      setEditItem({ kind: "gallery", item })
                    }
                    onDuplicate={() => void duplicateItem(item)}
                    onMove={(folderId) => void moveItem(item, folderId)}
                    onDelete={() => void remove(item.id)}
                  />
                </div>
              </div>
            );
          }}
        </SortableList>
      )}
      {canReorder && (
        <p className="mt-2 text-xs text-zinc-500">
          Drag items to reorder — order saves automatically.
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
        canEdit={Boolean(onUpdateGallery)}
        onSaved={(saved) => {
          if (saved.kind === "gallery") {
            onUpdateGallery?.(
              entity.gallery.map((g) =>
                g.id === saved.item.id ? saved.item : g,
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
          if (saved.kind === "gallery") {
            onUpdateGallery?.(
              entity.gallery.map((g) =>
                g.id === saved.item.id ? saved.item : g,
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
          if (review.kind === "gallery") {
            onUpdateGallery?.(
              entity.gallery.some((g) => g.id === review.item.id)
                ? entity.gallery.map((g) =>
                    g.id === review.item.id ? review.item : g,
                  )
                : [...entity.gallery, review.item],
            );
          }
        }}
        onItemRemoved={removeReviewItem}
      />
    </CollapsibleCard>
  );
}
