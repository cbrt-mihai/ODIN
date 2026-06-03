"use client";

import { useEffect, useState } from "react";
import {
  Beaker,
  Eye,
  FileText,
  Image,
  Link2,
  MessageSquare,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collapsibleSummaryClass } from "@/components/ui/collapsible-card";
import { SortableList } from "@/components/ui/sortable-list";
import { TextFlavorToggle } from "@/components/entities/text-flavor-toggle";
import { AnnotatedText } from "@/components/entities/annotated-text";
import { EntryAnnotationsPanel } from "@/components/entities/entry-annotations";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { ProofMediaPreview } from "@/components/entities/proof-media-preview";
import { MediaPreview } from "@/components/entities/media-preview";
import {
  MARKDOWN_EDITOR_PLACEHOLDER,
  normalizeTextFlavor,
} from "@/lib/markdown/flavor";
import {
  confidenceBadgeStyle,
  sortedConfidenceTypes,
} from "@/lib/confidence";
import { hasEntryContext } from "@/lib/entities/field-meta-summary";
import {
  proofHasUpload,
  proofItemHref,
  proofPreviewKind,
  proofUploadLabel,
} from "@/lib/proof/file";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { migrateProofItem } from "@/lib/date-range/migrate";
import { reorderProofs, updateProof } from "@/lib/proof/helpers";
import { GALLERY_FILE_ACCEPT } from "@/lib/media/preview";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { cn } from "@/lib/utils";
import {
  PROOF_KINDS,
  type ConfidenceTypeDefinition,
  type Entity,
  type ProofItem,
  type ProofKind,
  type Provenance,
} from "@/lib/types";

function kindLabel(kind: ProofKind) {
  return PROOF_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

function KindIcon({ kind, className }: { kind: ProofKind; className?: string }) {
  const props = { className: cn("h-8 w-8 text-zinc-500", className) };
  switch (kind) {
    case "url":
      return <Link2 {...props} />;
    case "document":
      return <FileText {...props} />;
    case "screenshot":
      return <Image {...props} />;
    case "witness":
      return <User {...props} />;
    case "observation":
      return <Eye {...props} />;
    case "analysis":
      return <Beaker {...props} />;
    default:
      return <MessageSquare {...props} />;
  }
}

function ProofGalleryThumb({
  proof,
  selected,
  onSelect,
}: {
  proof: ProofItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const preview = proofPreviewKind(proof);
  const href = proofItemHref(proof);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-lg border bg-zinc-950 text-left transition-colors",
        selected
          ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
          : "border-zinc-800 hover:border-zinc-600",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
        {preview && href ? (
          <MediaPreview
            href={href}
            title={proof.title}
            mimeType={proof.mimeType}
            filename={proof.filename}
            url={proof.url}
            path={proof.path}
            fallbackScreenshot={proof.kind === "screenshot"}
            variant="thumb"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2">
            <KindIcon kind={proof.kind} className="h-7 w-7" />
            <span className="text-center text-[10px] text-zinc-500">
              {kindLabel(proof.kind)}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-0.5 border-t border-zinc-800/80 p-1.5">
        <p className="truncate text-[11px] font-medium text-zinc-200">
          {proof.title}
        </p>
        <p className="truncate text-[10px] text-zinc-600">
          {kindLabel(proof.kind)}
        </p>
      </div>
    </button>
  );
}

function ProofGalleryDetailReadonly({
  proof,
  confidenceTypes,
  entities,
}: {
  proof: ProofItem;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities: Entity[];
}) {
  const collected = proof.collectedAt?.slice(0, 10);
  const validPeriod = formatProvenanceValidity(
    migrateProofItem(proof).validity,
  );

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="min-w-0 flex-1 text-sm font-medium text-zinc-200">
          {proof.title}
        </h4>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          {kindLabel(proof.kind)}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px]"
          style={confidenceBadgeStyle(proof.confidence, confidenceTypes)}
        >
          {confidenceTypes.find((c) => c.id === proof.confidence)?.label ??
            proof.confidence}
        </span>
      </div>
      {proofPreviewKind(proof) && (
        <ProofMediaPreview proof={proof} />
      )}
      {(proof.url || proofHasUpload(proof)) && (
        <a
          href={proofItemHref(proof) ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="block break-all text-sm text-blue-400 hover:underline"
        >
          {proofHasUpload(proof) ? proofUploadLabel(proof) : proof.url}
        </a>
      )}
      {collected && (
        <p className="text-xs text-zinc-500">Collected {collected}</p>
      )}
      {validPeriod && (
        <p className="text-xs text-zinc-500">Valid period: {validPeriod}</p>
      )}
      {proof.excerpt?.trim() && (
        <div className="text-sm text-zinc-300">
          <AnnotatedText
            text={proof.excerpt}
            flavor={proof.excerptFlavor}
            entities={entities}
          />
        </div>
      )}
      {hasEntryContext(proof) && (
        <EntryAnnotationsPanel
          value={proof}
          onChange={() => {}}
          readOnly
          entities={entities}
          embedded
        />
      )}
    </div>
  );
}

function ProofGalleryDetailEdit({
  proof,
  proofId,
  provenance,
  onChange,
  confidenceTypes,
  entities,
  entityId,
  uploading,
  onAttachFile,
  onRemove,
}: {
  proof: ProofItem;
  proofId: string;
  provenance: Provenance;
  onChange: (p: Provenance) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities: Entity[];
  entityId?: string;
  uploading: boolean;
  onAttachFile: (proofId: string, file: File) => void;
  onRemove: (proofId: string) => void;
}) {
  const patch = (partial: Partial<ProofItem>) =>
    onChange(updateProof(provenance, proofId, partial));

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={proof.title}
          onChange={(e) => patch({ title: e.target.value })}
          className="h-8 min-w-[120px] flex-1 text-sm font-medium"
        />
        <Select
          value={proof.kind}
          onValueChange={(kind) => patch({ kind: kind as ProofKind })}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROOF_KINDS.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={proof.confidence}
          onValueChange={(confidence) =>
            patch({ confidence: confidence as ProofItem["confidence"] })
          }
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortedConfidenceTypes(confidenceTypes).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRemove(proofId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {proofPreviewKind(proof) && <ProofMediaPreview proof={proof} />}

      {proofHasUpload(proof) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/40 px-2 py-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <a
            href={proofItemHref(proof) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-blue-400 hover:underline"
          >
            {proofUploadLabel(proof)}
          </a>
          {entityId && (
            <label className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300">
              Replace
              <input
                type="file"
                accept={GALLERY_FILE_ACCEPT}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAttachFile(proofId, f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-zinc-500"
            onClick={() =>
              patch({
                path: undefined,
                filename: undefined,
                mimeType: undefined,
                sizeBytes: undefined,
                sha256: undefined,
              })
            }
          >
            Use URL instead
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Input
            type="url"
            className="h-8 min-w-[140px] flex-1 text-sm"
            placeholder="https://…"
            value={proof.url ?? ""}
            onChange={(e) => patch({ url: e.target.value || undefined })}
          />
          {entityId && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 text-xs hover:bg-zinc-700">
              <Upload className="h-3 w-3" />
              Upload file
              <input
                type="file"
                accept={GALLERY_FILE_ACCEPT}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAttachFile(proofId, f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      )}

      <div className="space-y-2 rounded-md border border-zinc-800/60 p-2">
        <p className="text-[11px] font-medium text-zinc-500">Valid period</p>
        <DateRangesFieldEditor
          value={migrateProofItem(proof).validity ?? { entries: [] }}
          onChange={(validity) => patch({ validity })}
          confidenceTypes={confidenceTypes}
        />
        <div>
          <p className="text-[11px] text-zinc-500">Collected</p>
          <Input
            type="date"
            className="h-8 text-sm"
            value={proof.collectedAt?.slice(0, 10) ?? ""}
            onChange={(e) =>
              patch({
                collectedAt: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <details className="rounded border border-zinc-800/50 bg-zinc-950/30 px-2 py-1.5" open>
        <summary
          className={cn(collapsibleSummaryClass, "text-[11px] text-zinc-500")}
        >
          Excerpt & notes
        </summary>
        <div className="mt-2 space-y-2">
          <div className="flex justify-end">
            <TextFlavorToggle
              value={proof.excerptFlavor}
              onChange={(excerptFlavor) => patch({ excerptFlavor })}
            />
          </div>
          {normalizeTextFlavor(proof.excerptFlavor) === "plain" ? (
            <Textarea
              rows={2}
              placeholder="Quote or excerpt…"
              value={proof.excerpt ?? ""}
              onChange={(e) =>
                patch({ excerpt: e.target.value || undefined })
              }
              className="text-sm"
            />
          ) : (
            <MarkdownFieldEditor
              value={proof.excerpt ?? ""}
              onChange={(excerpt) => patch({ excerpt })}
              flavor="obsidian"
              placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
              showPreview={false}
              minRows={3}
            />
          )}
          <EntryAnnotationsPanel
            value={{
              description: proof.description,
              descriptionFlavor: proof.descriptionFlavor,
              tags: proof.tags,
              notes: proof.notes,
              notesFlavor: proof.notesFlavor,
            }}
            onChange={(ann) => patch(ann)}
            entities={entities}
            compact
            embedded
          />
        </div>
      </details>
    </div>
  );
}

export function ProofGallery({
  provenance,
  onChange,
  readOnly,
  confidenceTypes,
  entities = [],
  entityId,
  uploading = false,
  onAttachFile,
  onRemove,
  emptyHint = "No evidence yet. Use quick add above or Add proof.",
}: {
  provenance: Provenance;
  onChange?: (p: Provenance) => void;
  readOnly?: boolean;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  entityId?: string;
  uploading?: boolean;
  onAttachFile?: (proofId: string, file: File) => void;
  onRemove?: (proofId: string) => void;
  emptyHint?: string;
}) {
  const proofs = [...(provenance.proofs ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const proofIds = proofs.map((p) => p.id);
  const [selectedId, setSelectedId] = useState<string | null>(
    proofs[0]?.id ?? null,
  );

  const selected = proofs.find((p) => p.id === selectedId);

  useEffect(() => {
    if (selectedId && !proofs.some((p) => p.id === selectedId)) {
      setSelectedId(proofs[0]?.id ?? null);
    } else if (!selectedId && proofs.length > 0) {
      setSelectedId(proofs[0].id);
    }
  }, [proofs, selectedId]);

  if (proofIds.length === 0) {
    return <p className="text-xs text-zinc-600">{emptyHint}</p>;
  }

  const grid = (
    <SortableList
      ids={proofIds}
      onReorder={
        readOnly || !onChange
          ? () => {}
          : (ids) => onChange(reorderProofs(provenance, ids))
      }
      disabled={readOnly}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {(id, handle) => {
        const proof = proofs.find((p) => p.id === id)!;
        return (
          <div key={id} className="relative">
            {!readOnly && handle && (
              <div className="absolute left-0.5 top-0.5 z-10">{handle}</div>
            )}
            <ProofGalleryThumb
              proof={proof}
              selected={selectedId === id}
              onSelect={() =>
                setSelectedId((cur) => (cur === id ? null : id))
              }
            />
          </div>
        );
      }}
    </SortableList>
  );

  return (
    <div className="space-y-3">
      {grid}
      {selected && (
        <div>
          {readOnly ? (
            <ProofGalleryDetailReadonly
              proof={selected}
              confidenceTypes={confidenceTypes}
              entities={entities}
            />
          ) : onChange && onAttachFile && onRemove ? (
            <ProofGalleryDetailEdit
              proof={selected}
              proofId={selected.id}
              provenance={provenance}
              onChange={onChange}
              confidenceTypes={confidenceTypes}
              entities={entities}
              entityId={entityId}
              uploading={uploading}
              onAttachFile={onAttachFile}
              onRemove={onRemove}
            />
          ) : null}
        </div>
      )}
      {!selected && proofIds.length > 0 && (
        <p className="text-center text-[10px] text-zinc-600">
          Select a tile to view or edit details
        </p>
      )}
    </div>
  );
}
