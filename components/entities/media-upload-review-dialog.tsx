"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { MediaEntryDetail } from "@/components/entities/media-entry-detail";
import {
  patchEntityAttachment,
  patchEntityGalleryItem,
} from "@/lib/actions/entities";
import { mediaDisplayName } from "@/lib/media/display-name";
import {
  MEDIA_ITEM_DIALOG_BODY_CLASS,
  MEDIA_ITEM_DIALOG_CONTENT_CLASS,
  MEDIA_ITEM_DIALOG_FOOTER_CLASS,
  MEDIA_ITEM_DIALOG_HEADER_CLASS,
} from "@/lib/ui/media-dialog-layout";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
  GalleryImage,
} from "@/lib/types";

export type MediaReviewItem =
  | { kind: "gallery"; item: GalleryImage }
  | { kind: "attachment"; item: Attachment };

export function MediaUploadReviewDialog({
  open,
  items,
  onOpenChange,
  entityId,
  folders,
  confidenceTypes,
  entities = [],
  onItemSaved,
  onItemRemoved,
}: {
  open: boolean;
  items: MediaReviewItem[];
  onOpenChange: (open: boolean) => void;
  entityId: string;
  folders?: GalleryFolder[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  onItemSaved?: (item: MediaReviewItem) => void;
  onItemRemoved?: (item: MediaReviewItem) => void | Promise<void>;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<GalleryImage | Attachment | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const current = items[index];
  const total = items.length;
  const isLast = index >= total - 1;
  const busy = saving || removing;

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setDraft(null);
      return;
    }
    if (items.length === 0) onOpenChange(false);
  }, [open, items.length, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    if (index >= items.length) {
      setIndex(Math.max(0, items.length - 1));
    }
  }, [open, index, items.length]);

  useEffect(() => {
    if (!open || !items[index]) return;
    setDraft(items[index].item);
  }, [open, index, items]);

  if (!open || !current || !draft) return null;

  function finish() {
    onOpenChange(false);
    setIndex(0);
    setDraft(null);
    router.refresh();
  }

  function advance() {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  async function saveCurrent() {
    setSaving(true);
    try {
      if (current.kind === "gallery") {
        const saved = draft as GalleryImage;
        await patchEntityGalleryItem(entityId, saved);
        onItemSaved?.({ kind: "gallery", item: saved });
      } else {
        const saved = draft as Attachment;
        await patchEntityAttachment(entityId, saved);
        onItemSaved?.({ kind: "attachment", item: saved });
      }
      advance();
    } finally {
      setSaving(false);
    }
  }

  async function removeCurrent() {
    const name = mediaDisplayName(current.item);
    const ok = await confirm({
      title: current.kind === "gallery" ? "Remove image" : "Remove file",
      description: `Remove "${name}"? This deletes the upload from the entity.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;

    setRemoving(true);
    try {
      await onItemRemoved?.(current);
      if (total <= 1) {
        finish();
        return;
      }
      if (isLast) {
        setIndex((i) => Math.max(0, i - 1));
      }
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  const title = current.kind === "gallery" ? "New gallery item" : "New file";
  const progress = total > 1 ? ` (${index + 1} of ${total})` : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish();
        else onOpenChange(next);
      }}
    >
      <DialogContent className={MEDIA_ITEM_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={MEDIA_ITEM_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {title}
            {progress}
          </DialogTitle>
          <DialogDescription>
            Add a name, tags, or other details now, or skip to keep the defaults.
          </DialogDescription>
        </DialogHeader>

        <div className={MEDIA_ITEM_DIALOG_BODY_CLASS}>
          <MediaEntryDetail
            item={draft}
            baselineItem={current.item}
            onChange={setDraft}
            readOnly={false}
            confidenceTypes={confidenceTypes}
            entities={entities}
            entityId={entityId}
            folders={folders}
            onMoveFolder={(folderId) =>
              setDraft((item) => (item ? { ...item, folderId } : item))
            }
            layout="dialog"
          />
        </div>

        <DialogFooter className={MEDIA_ITEM_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-red-400 hover:bg-red-950/40 hover:text-red-300"
            onClick={() => void removeCurrent()}
            disabled={busy || !onItemRemoved}
          >
            {removing ? "Removing…" : "Remove"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={advance}
            disabled={busy}
          >
            {isLast ? "Skip & close" : "Skip"}
          </Button>
          <Button
            type="button"
            onClick={() => void saveCurrent()}
            disabled={busy}
          >
            {saving ? "Saving…" : isLast ? "Save & close" : "Save & next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
