"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { MediaListToolbar } from "@/components/entities/media-list-toolbar";
import { GalleryFolderNav } from "@/components/entities/gallery-folders";
import { MediaEntryDetail } from "@/components/entities/media-entry-detail";
import { MediaPreview } from "@/components/entities/media-preview";
import {
  DEFAULT_MEDIA_CONTROLS,
  matchesSearch,
  compareStrings,
  compareNumbers,
  type MediaListControls,
} from "@/lib/media-list/utils";
import { galleryItemHref } from "@/lib/media/gallery";
import { GALLERY_FILE_ACCEPT } from "@/lib/media/preview";
import { patchEntityGallery } from "@/lib/actions/entities";
import type {
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
  GalleryImage,
} from "@/lib/types";

export function GalleryPanel({
  entity,
  baselineEntity,
  readOnly,
  onReorder,
  onUpdateGallery,
  onUpdateFolders,
  confidenceTypes,
}: {
  entity: Entity;
  baselineEntity?: Entity;
  readOnly?: boolean;
  onReorder?: (gallery: GalleryImage[]) => void;
  onUpdateGallery?: (gallery: GalleryImage[]) => void;
  onUpdateFolders?: (folders: GalleryFolder[]) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [controls, setControls] = useState<MediaListControls>(
    DEFAULT_MEDIA_CONTROLS,
  );

  const folders = entity.galleryFolders ?? [];

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
            a.caption ?? a.description ?? a.url ?? "",
            b.caption ?? b.description ?? b.url ?? "",
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
    !readOnly &&
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

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("kind", "gallery");
    form.append("file", file);
    if (currentFolderId) form.append("folderId", currentFolderId);
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

  async function addUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const form = new FormData();
    form.append("kind", "gallery-url");
    form.append("url", url);
    if (currentFolderId) form.append("folderId", currentFolderId);
    setLoading(true);
    try {
      await fetch(`/api/entities/${entity.id}/upload`, {
        method: "POST",
        body: form,
      });
      setUrl("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove(galleryId: string) {
    const item = entity.gallery.find((g) => g.id === galleryId);
    const ok = await confirm({
      title: "Remove media",
      description: `Remove "${item?.caption ?? item?.description ?? item?.url ?? "this item"}" from the gallery?`,
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
        />
      )}

      <MediaListToolbar
        controls={controls}
        onChange={(patch) => setControls((c) => ({ ...c, ...patch }))}
        mode="gallery"
      />

      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
            <Upload className="h-4 w-4" />
            Upload media
            <input
              type="file"
              accept={GALLERY_FILE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
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
      )}

      {entity.gallery.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No media yet.</p>
      ) : displayed.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No items in this folder match filters.</p>
      ) : (
        <SortableList
          ids={displayIds}
          onReorder={handleReorder}
          disabled={!canReorder}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {(id, handle) => {
            const item = displayed.find((g) => g.id === id)!;
            const src = galleryItemHref(item);
            const open = expandedId === id;
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
                  onClick={() => setExpandedId(open ? null : id)}
                >
                  {src ? (
                    <MediaPreview
                      href={src}
                      title={item.caption ?? item.description ?? ""}
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
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium text-zinc-300 truncate">
                    {item.caption ?? item.description ?? "Untitled"}
                  </p>
                  {(item.tags ?? []).length > 0 && (
                    <p className="text-[10px] text-zinc-500 truncate">
                      {item.tags!.join(" · ")}
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
                {open && onUpdateGallery && (
                  <MediaEntryDetail
                    item={item}
                    baselineItem={(baselineEntity ?? entity).gallery.find(
                      (g) => g.id === item.id,
                    )}
                    entityId={entity.id}
                    onChange={(next) => updateItem(id, next as GalleryImage)}
                    readOnly={readOnly}
                    confidenceTypes={confidenceTypes}
                    folders={folders}
                    onMoveFolder={(folderId) =>
                      updateItem(id, { ...item, folderId })
                    }
                  />
                )}
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7 bg-black/50"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
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
    </CollapsibleCard>
  );
}
