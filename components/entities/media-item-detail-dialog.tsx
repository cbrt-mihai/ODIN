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
import type { MediaEditItem } from "@/components/entities/media-item-edit-dialog";

export function MediaItemDetailDialog({
  item,
  onOpenChange,
  entityId,
  folders,
  confidenceTypes,
  entities = [],
  onSaved,
  canEdit = true,
}: {
  item: MediaEditItem | null;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  folders?: GalleryFolder[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  onSaved?: (saved: MediaEditItem) => void;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<GalleryImage | Attachment | null>(null);
  const [saving, setSaving] = useState(false);
  const open = item !== null;

  useEffect(() => {
    setDraft(item?.item ?? null);
  }, [item?.item.id]);

  if (!item || !draft) return null;

  async function save() {
    if (!item) return;
    const current = item;
    setSaving(true);
    try {
      if (current.kind === "gallery") {
        const saved = draft as GalleryImage;
        await patchEntityGalleryItem(entityId, saved);
        onSaved?.({ kind: "gallery", item: saved });
      } else {
        const saved = draft as Attachment;
        await patchEntityAttachment(entityId, saved);
        onSaved?.({ kind: "attachment", item: saved });
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={MEDIA_ITEM_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={MEDIA_ITEM_DIALOG_HEADER_CLASS}>
          <DialogTitle>{mediaDisplayName(item.item)}</DialogTitle>
          <DialogDescription>
            {item.kind === "gallery" ? "Gallery item" : "File"} — view and edit
            details, context, notes, and proof.
          </DialogDescription>
        </DialogHeader>

        <div className={MEDIA_ITEM_DIALOG_BODY_CLASS}>
          <MediaEntryDetail
            item={draft}
            baselineItem={item.item}
            onChange={setDraft}
            readOnly={!canEdit}
            confidenceTypes={confidenceTypes}
            entities={entities}
            entityId={entityId}
            folders={folders}
            onMoveFolder={
              canEdit
                ? (folderId) =>
                    setDraft((current) =>
                      current ? { ...current, folderId } : current,
                    )
                : undefined
            }
            layout="dialog"
          />
        </div>

        {canEdit ? (
          <DialogFooter className={MEDIA_ITEM_DIALOG_FOOTER_CLASS}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Close
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className={MEDIA_ITEM_DIALOG_FOOTER_CLASS}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
