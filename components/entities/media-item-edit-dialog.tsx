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

export type MediaEditItem =
  | { kind: "gallery"; item: GalleryImage }
  | { kind: "attachment"; item: Attachment };

export function MediaItemEditDialog({
  item,
  onOpenChange,
  entityId,
  folders,
  confidenceTypes,
  entities = [],
  onSaved,
}: {
  item: MediaEditItem | null;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  folders?: GalleryFolder[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  onSaved?: (saved: MediaEditItem) => void;
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

  const title =
    item.kind === "gallery" ? "Edit gallery item" : "Edit file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={MEDIA_ITEM_DIALOG_CONTENT_CLASS}>
        <DialogHeader className={MEDIA_ITEM_DIALOG_HEADER_CLASS}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mediaDisplayName(item.item)} — update name, folder, tags, or proof.
          </DialogDescription>
        </DialogHeader>

        <div className={MEDIA_ITEM_DIALOG_BODY_CLASS}>
          <MediaEntryDetail
            item={draft}
            baselineItem={item.item}
            onChange={setDraft}
            readOnly={false}
            confidenceTypes={confidenceTypes}
            entities={entities}
            entityId={entityId}
            folders={folders}
            onMoveFolder={(folderId) =>
              setDraft((current) => (current ? { ...current, folderId } : current))
            }
            layout="dialog"
          />
        </div>

        <DialogFooter className={MEDIA_ITEM_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
