"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link2, Plus, Shield, Upload } from "lucide-react";
import { collapsibleSummaryClass } from "@/components/ui/collapsible-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import { ProofGallery } from "@/components/entities/proof-gallery";
import { ProofReadonlyView } from "@/components/entities/proof-readonly-view";
import { EntryAnnotationsPanel } from "@/components/entities/entry-annotations";
import {
  confidenceBadgeStyle,
  sortedConfidenceTypes,
} from "@/lib/confidence";
import {
  addProofToProvenance,
  normalizeProvenance,
  proofCount,
  removeProof,
  updateProof,
} from "@/lib/proof/helpers";
import { deleteProofFile, uploadProofFile } from "@/lib/proof/upload";
import { cn } from "@/lib/utils";
import {
  PROOF_KINDS,
  type ConfidenceTypeDefinition,
  type Entity,
  type ProofItem,
  type ProofKind,
  type Provenance,
} from "@/lib/types";

export function ProofPanel({
  provenance: raw,
  onChange,
  readOnly,
  confidenceTypes,
  entities = [],
  entityId,
  label = "Proof & evidence",
  embedded,
  onQuickEdit,
}: {
  provenance: Provenance;
  onChange: (p: Provenance) => void;
  readOnly?: boolean;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  /** Required for file uploads */
  entityId?: string;
  label?: string;
  /** Render inline (no outer collapsible) — used inside field meta panel */
  embedded?: boolean;
  onQuickEdit?: () => void;
}) {
  const confirm = useConfirm();
  const provenance = normalizeProvenance(raw);
  const [quickUrl, setQuickUrl] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKind, setQuickKind] = useState<ProofKind>("url");
  const [uploading, setUploading] = useState(false);
  const count = proofCount(provenance);

  function setProv(patch: Partial<Provenance>) {
    onChange({ ...provenance, ...patch });
  }

  function pushProof(
    partial: Omit<ProofItem, "id" | "order" | "confidence" | "tags"> & {
      title: string;
    },
  ) {
    const proofs = [...(provenance.proofs ?? [])];
    proofs.push({
      id: uuidv4(),
      confidence: provenance.confidence,
      order: proofs.length,
      tags: [],
      ...partial,
    });
    onChange({ ...provenance, proofs });
    setQuickUrl("");
    setQuickTitle("");
  }

  function quickAddUrl() {
    if (quickKind === "url" && !quickUrl.trim()) return;
    pushProof({
      title:
        quickTitle.trim() ||
        (quickKind === "url" ? quickUrl.trim() : "New evidence"),
      kind: quickKind,
      url: quickKind === "url" ? quickUrl.trim() : undefined,
    });
  }

  async function quickAddFile(file: File) {
    if (!entityId) return;
    setUploading(true);
    try {
      const meta = await uploadProofFile(entityId, file);
      pushProof({
        title: quickTitle.trim() || meta.filename || file.name,
        kind: quickKind === "url" ? "document" : quickKind,
        url: undefined,
        ...meta,
      });
    } finally {
      setUploading(false);
    }
  }

  async function attachFileToProof(proofId: string, file: File) {
    if (!entityId) return;
    setUploading(true);
    try {
      const meta = await uploadProofFile(entityId, file);
      const existing = provenance.proofs?.find((p) => p.id === proofId);
      if (existing?.path) {
        await deleteProofFile(entityId, existing.path);
      }
      onChange(
        updateProof(provenance, proofId, {
          ...meta,
          url: undefined,
          title: existing?.title || meta.filename || file.name,
        }),
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeProofItem(id: string) {
    const p = provenance.proofs?.find((x) => x.id === id);
    const ok = await confirm({
      title: "Remove proof",
      description: `Remove "${p?.title ?? "this item"}"?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    if (entityId && p?.path) {
      await deleteProofFile(entityId, p.path);
    }
    onChange(removeProof(provenance, id));
  }

  if (readOnly) {
    return (
      <ProofReadonlyView
        provenance={provenance}
        confidenceTypes={confidenceTypes}
        entities={entities}
        label={label}
        embedded={embedded}
        onQuickEdit={onQuickEdit}
      />
    );
  }

  const inner = (
      <div className={embedded ? "space-y-3" : "space-y-3 border-t border-zinc-800 px-3 pb-3 pt-3"}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Label className="text-xs text-zinc-500">Overall confidence</Label>
            <Select
              value={provenance.confidence}
              onValueChange={(confidence) => setProv({ confidence })}
            >
              <SelectTrigger className="h-8 text-xs">
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
          </div>
        </div>

        <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950/50 p-3 space-y-2">
          <p className="text-xs font-medium text-zinc-500">Quick add evidence</p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={quickKind}
              onValueChange={(v) => setQuickKind(v as ProofKind)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
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
            {quickKind === "url" && (
              <Input
                className="h-8 flex-1 min-w-[140px] text-sm"
                placeholder="https://…"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
              />
            )}
            <Input
              className="h-8 min-w-[120px] flex-1 text-sm"
              placeholder="Title"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={quickAddUrl}
              disabled={
                quickKind === "url" ? !quickUrl.trim() : !quickTitle.trim()
              }
            >
              <Link2 className="h-3 w-3" />
              Add
            </Button>
            {entityId && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs hover:bg-zinc-700">
                <Upload className="h-3 w-3" />
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void quickAddFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {!entityId && (
            <p className="text-[10px] text-zinc-600">
              Save the entity once to enable proof file uploads.
            </p>
          )}
        </div>

        <details className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
          <summary
            className={cn(
              collapsibleSummaryClass,
              "text-xs font-medium text-zinc-500",
            )}
          >
            Source metadata (optional)
          </summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs text-zinc-500">Primary source</Label>
            <Input
              value={provenance.source ?? ""}
              onChange={(e) =>
                setProv({ source: e.target.value || undefined })
              }
              placeholder="LinkedIn, court filing…"
              className="h-8 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-zinc-500">Source URL</Label>
            <Input
              type="url"
              className="h-8 text-sm"
              value={provenance.sourceUrl ?? ""}
              onChange={(e) =>
                setProv({ sourceUrl: e.target.value || undefined })
              }
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-500">Collected</Label>
            <Input
              type="date"
              className="h-8 text-sm"
              value={provenance.collectedAt?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setProv({
                  collectedAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-zinc-500">Valid period</Label>
            <DateRangesFieldEditor
              value={migrateDateRangesValue(provenance.validity)}
              onChange={(validity) => setProv({ validity })}
              confidenceTypes={confidenceTypes}
            />
          </div>
          </div>
        </details>

        <details className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
          <summary
            className={cn(
              collapsibleSummaryClass,
              "text-xs font-medium text-zinc-500",
            )}
          >
            Source notes & tags
          </summary>
          <div className="mt-2">
            <EntryAnnotationsPanel
              value={{
                description: provenance.description,
                descriptionFlavor: provenance.descriptionFlavor,
                tags: provenance.tags,
                notes: provenance.notes,
                notesFlavor: provenance.notesFlavor,
              }}
              onChange={(ann) =>
                onChange({
                  ...provenance,
                  ...ann,
                })
              }
              entities={entities}
              compact
              embedded
            />
          </div>
        </details>

        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">Evidence items</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange(addProofToProvenance(provenance, quickKind))
            }
          >
            <Plus className="h-3 w-3" />
            Add proof
          </Button>
        </div>

        <ProofGallery
          provenance={provenance}
          onChange={onChange}
          confidenceTypes={confidenceTypes}
          entities={entities}
          entityId={entityId}
          uploading={uploading}
          onAttachFile={(id, file) => void attachFileToProof(id, file)}
          onRemove={(id) => void removeProofItem(id)}
          emptyHint="No structured proofs yet. Use quick add or Add proof for documents, witnesses, and analysis."
        />
      </div>
  );

  if (embedded) return inner;

  return (
    <details className="rounded-md border border-zinc-800 bg-zinc-900/40">
      <summary
        className={cn(
          collapsibleSummaryClass,
          "min-h-11 justify-between px-3 py-3 text-xs font-medium text-zinc-400",
        )}
      >
        <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Shield className="h-4 w-4 text-emerald-500/80" />
          {label}
          {count > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {count}
            </span>
          )}
        </span>
        <span
          className="rounded px-2 py-0.5 text-[10px]"
          style={confidenceBadgeStyle(
            provenance.confidence,
            confidenceTypes,
          )}
        >
          {confidenceTypes.find((c) => c.id === provenance.confidence)?.label}
        </span>
      </summary>
      {inner}
    </details>
  );
}
