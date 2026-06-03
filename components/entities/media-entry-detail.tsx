"use client";

import { useState } from "react";
import { EntityItemSaveButton } from "@/components/entities/entity-item-save";
import {
  patchEntityAttachment,
  patchEntityGalleryItem,
} from "@/lib/actions/entities";
import { isDirty } from "@/lib/entities/dirty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ContextNotesEditor } from "@/components/entities/context-notes-editor";
import {
  annotationsFrom,
  applyAnnotations,
  EntryAnnotationsPanel,
} from "@/components/entities/entry-annotations";
import { ProofPanel } from "@/components/entities/proof-panel";
import { MediaPreview } from "@/components/entities/media-preview";
import { MediaValidityEditor } from "@/components/entities/media-validity-editor";
import { galleryItemHref } from "@/lib/media/gallery";
import { mediaItemCopyUrl } from "@/lib/media/item-ops";
import { mediaDisplayName } from "@/lib/media/display-name";
import { MEDIA_ITEM_DIALOG_PREVIEW_CLASS } from "@/lib/ui/media-dialog-layout";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import { hasProvenanceMeta } from "@/lib/entities/field-meta-summary";
import { normalizeProvenance, proofCount } from "@/lib/proof/helpers";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
  GalleryImage,
} from "@/lib/types";

type MediaItem = GalleryImage | Attachment;
type MediaTab = "context" | "notes" | "proof";

function isGallery(item: MediaItem): item is GalleryImage {
  return "source" in item;
}

export function MediaEntryDetail({
  item,
  onChange,
  readOnly,
  confidenceTypes,
  entities,
  folders,
  onMoveFolder,
  entityId,
  baselineItem,
  layout = "inline",
}: {
  item: MediaItem;
  onChange: (item: MediaItem) => void;
  readOnly?: boolean;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  folders?: GalleryFolder[];
  onMoveFolder?: (folderId: string | undefined) => void;
  entityId?: string;
  baselineItem?: MediaItem;
  layout?: "inline" | "dialog";
}) {
  const provenance = item.provenance
    ? normalizeProvenance(item.provenance)
    : undefined;
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(item);
  const [tab, setTab] = useState<MediaTab>("context");

  function setLists(ctx: typeof contextEntries, notes: typeof noteEntries) {
    onChange({
      ...item,
      contextEntries: ctx,
      noteEntries: notes,
    });
  }

  const itemDirty =
    !readOnly &&
    baselineItem &&
    isDirty(item, baselineItem);

  const galleryHref = isGallery(item) ? galleryItemHref(item) : null;
  const previewHref = galleryHref ?? mediaItemCopyUrl(item);

  const displayName = mediaDisplayName(item);
  const inDialog = layout === "dialog";
  const previewVariant = inDialog ? "dialog" : "detail";

  return (
    <div
      className={
        inDialog
          ? "space-y-4"
          : "mt-2 space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3"
      }
    >
      {previewHref && (
        <div className={inDialog ? MEDIA_ITEM_DIALOG_PREVIEW_CLASS : undefined}>
          <MediaPreview
            href={previewHref}
            title={displayName}
            mimeType={item.mimeType}
            filename={item.filename}
            url={isGallery(item) ? item.url : undefined}
            path={item.path}
            variant={previewVariant}
          />
        </div>
      )}
      {entityId && !inDialog && (
        <div className="flex justify-end">
          <EntityItemSaveButton
            dirty={Boolean(itemDirty)}
            onSave={async () => {
              if (isGallery(item)) {
                await patchEntityGalleryItem(entityId, item);
              } else {
                await patchEntityAttachment(entityId, item);
              }
            }}
          />
        </div>
      )}
      {folders && onMoveFolder && (
        <div>
          <Label className="text-xs text-zinc-500">Folder</Label>
          <Select
            value={item.folderId ?? "__root__"}
            onValueChange={(v) =>
              onMoveFolder(v === "__root__" ? undefined : v)
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">Root (no folder)</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {readOnly ? (
        <p className="text-sm font-medium text-zinc-200">{displayName}</p>
      ) : (
        <div>
          <Label htmlFor={`media-name-${item.id}`} className="text-xs text-zinc-500">
            Name
          </Label>
          <Input
            id={`media-name-${item.id}`}
            className="h-8 text-sm"
            value={item.caption ?? ""}
            onChange={(e) =>
              onChange({ ...item, caption: e.target.value || undefined })
            }
            placeholder={displayName}
          />
        </div>
      )}

      <EntryAnnotationsPanel
        value={annotationsFrom(item)}
        onChange={(ann) => onChange(applyAnnotations(item, ann))}
        readOnly={readOnly}
        entities={entities}
        embedded
        compact
      />

      <MediaValidityEditor
        item={item}
        onChange={onChange}
        confidenceTypes={confidenceTypes}
        readOnly={readOnly}
      />

      {!readOnly && (
        <SegmentedControl<MediaTab>
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "context",
              label:
                contextEntries.length > 0
                  ? `Context (${contextEntries.length})`
                  : "Context",
            },
            {
              value: "notes",
              label:
                noteEntries.length > 0
                  ? `Notes (${noteEntries.length})`
                  : "Notes",
            },
            {
              value: "proof",
              label:
                proofCount(provenance) > 0
                  ? `Proof (${proofCount(provenance)})`
                  : "Proof",
            },
          ]}
        />
      )}

      {(readOnly || tab === "context") &&
        (!readOnly || contextEntries.length > 0) && (
          <ContextNotesEditor
            contextEntries={contextEntries}
            noteEntries={[]}
            onContextChange={(entries) => setLists(entries, noteEntries)}
            onNotesChange={() => {}}
            readOnly={readOnly}
            entities={entities}
            defaultSubTab="context"
            hideSubTabs
          />
        )}

      {(readOnly || tab === "notes") &&
        (!readOnly || noteEntries.length > 0) && (
          <ContextNotesEditor
            contextEntries={[]}
            noteEntries={noteEntries}
            onContextChange={() => {}}
            onNotesChange={(entries) => setLists(contextEntries, entries)}
            readOnly={readOnly}
            entities={entities}
            defaultSubTab="notes"
            hideSubTabs
          />
        )}

      {(readOnly || tab === "proof") &&
        (provenance ? hasProvenanceMeta(provenance) : !readOnly) && (
        <ProofPanel
          provenance={provenance ?? normalizeProvenance(undefined)}
          onChange={(p) => onChange({ ...item, provenance: p })}
          readOnly={readOnly}
          confidenceTypes={confidenceTypes}
          entities={entities}
          entityId={entityId}
          label="Proof for this file"
          embedded
        />
      )}
    </div>
  );
}
