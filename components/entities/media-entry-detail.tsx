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
import { ProofPanel } from "@/components/entities/proof-panel";
import { MediaPreview } from "@/components/entities/media-preview";
import { galleryItemHref } from "@/lib/media/gallery";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import { hasProvenanceMeta } from "@/lib/entities/field-meta-summary";
import { normalizeProvenance, proofCount } from "@/lib/proof/helpers";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  Entity,
  GalleryFolder,
  GalleryImage,
  Provenance,
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
}) {
  const provenance = normalizeProvenance(item.provenance);
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(item);
  const [tab, setTab] = useState<MediaTab>("context");

  function setProv(p: Provenance) {
    onChange({ ...item, provenance: p });
  }

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

  return (
    <div className="mt-2 space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
      {galleryHref && (
        <MediaPreview
          href={galleryHref}
          title={item.caption ?? item.description ?? ""}
          mimeType={item.mimeType}
          filename={isGallery(item) ? item.filename : undefined}
          url={isGallery(item) ? item.url : undefined}
          path={isGallery(item) ? item.path : undefined}
          variant="detail"
        />
      )}
      {!readOnly && entityId && (
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
      {isGallery(item) && folders && onMoveFolder && !readOnly && (
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
              <SelectItem value="__root__">All media (root)</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!readOnly && (
        <div>
          <Label className="text-xs text-zinc-500">Caption</Label>
          <Input
            className="h-8 text-sm"
            value={item.caption ?? ""}
            onChange={(e) =>
              onChange({ ...item, caption: e.target.value || undefined })
            }
          />
        </div>
      )}

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
          />
        )}

      {(readOnly || tab === "proof") &&
        (!readOnly || hasProvenanceMeta(provenance)) && (
        <ProofPanel
          provenance={provenance}
          onChange={setProv}
          readOnly={readOnly}
          confidenceTypes={confidenceTypes}
          entities={entities}
          entityId={entityId}
          label="Proof for this file"
          embedded={readOnly}
        />
      )}
    </div>
  );
}
