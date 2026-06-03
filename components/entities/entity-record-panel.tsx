"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { EntityItemSaveButton } from "@/components/entities/entity-item-save";
import { QuickEditButton } from "@/components/entities/quick-edit-button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { patchEntityInvestigationRecord } from "@/lib/actions/entities";
import { isDirty } from "@/lib/entities/dirty";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ContextNotesEditor } from "@/components/entities/context-notes-editor";
import { ProofPanel } from "@/components/entities/proof-panel";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import { proofCount } from "@/lib/proof/helpers";
import { normalizeProvenance } from "@/lib/proof/helpers";
import type { ConfidenceTypeDefinition, Entity } from "@/lib/types";

type RecordTab = "context" | "notes" | "proof";

export function entityRecordSummary(entity: Entity): string | null {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(entity);
  const prov = normalizeProvenance(entity.provenance);
  const parts: string[] = [];
  if (contextEntries.length > 0) {
    parts.push(`${contextEntries.length} context`);
  }
  if (noteEntries.length > 0) {
    parts.push(`${noteEntries.length} note${noteEntries.length === 1 ? "" : "s"}`);
  }
  const pc = proofCount(prov);
  if (pc > 0) parts.push(`${pc} proof`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function investigationRecordSnapshot(entity: Entity) {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(entity);
  return {
    provenance: normalizeProvenance(entity.provenance),
    contextEntries,
    noteEntries,
  };
}

export function EntityRecordPanel({
  entity,
  onChange,
  readOnly,
  confidenceTypes,
  allEntities = [],
  entityId,
  baselineEntity,
  onQuickEdit,
  focusOpen,
  focusTab,
}: {
  entity: Entity;
  onChange: (entity: Entity) => void;
  readOnly?: boolean;
  confidenceTypes: ConfidenceTypeDefinition[];
  allEntities?: Entity[];
  entityId?: string;
  /** For per-section save dirty detection */
  baselineEntity?: Entity;
  onQuickEdit?: (tab?: RecordTab) => void;
  focusOpen?: boolean;
  focusTab?: RecordTab;
}) {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(entity);
  const provenance = normalizeProvenance(entity.provenance);
  const [tab, setTab] = useState<RecordTab>(focusTab ?? "context");
  const summary = entityRecordSummary(entity);

  useEffect(() => {
    if (focusTab) setTab(focusTab);
  }, [focusTab]);
  const recordDirty =
    !readOnly &&
    baselineEntity &&
    isDirty(
      investigationRecordSnapshot(entity),
      investigationRecordSnapshot(baselineEntity),
    );

  if (readOnly && !summary && !onQuickEdit) return null;

  const tabContent =
    tab === "context" ? (
      <ContextNotesEditor
        contextEntries={contextEntries}
        noteEntries={[]}
        onContextChange={(entries) =>
          onChange({ ...entity, contextEntries: entries })
        }
        onNotesChange={() => {}}
        readOnly={readOnly}
        entities={allEntities}
        defaultSubTab="context"
      />
    ) : tab === "notes" ? (
      <ContextNotesEditor
        contextEntries={[]}
        noteEntries={noteEntries}
        onContextChange={() => {}}
        onNotesChange={(entries) =>
          onChange({ ...entity, noteEntries: entries })
        }
        readOnly={readOnly}
        entities={allEntities}
        defaultSubTab="notes"
      />
    ) : null;

  const inner = (
    <div className="space-y-3">
      {!readOnly && entityId && (
        <div className="flex justify-end">
          <EntityItemSaveButton
            dirty={Boolean(recordDirty)}
            label="Save record"
            onSave={async () => {
              const snap = investigationRecordSnapshot(entity);
              await patchEntityInvestigationRecord(entityId, snap);
            }}
          />
        </div>
      )}
      <SegmentedControl<RecordTab>
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

      {tab !== "proof" && (
        <p className="text-[11px] leading-relaxed text-zinc-600">
          {tab === "context"
            ? "Add multiple context blocks — overview, background, hypotheses, caveats, and more."
            : "Add multiple investigation notes — interviews, open questions, internal workflow, etc."}
        </p>
      )}

      {tab === "proof" ? (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-zinc-600">
            <Shield className="h-3 w-3 text-emerald-500/70" />
            Entity-wide sources and evidence (URLs, documents, witnesses, etc.).
          </p>
          <ProofPanel
            provenance={provenance}
            onChange={(p) => onChange({ ...entity, provenance: p })}
            readOnly={readOnly}
            confidenceTypes={confidenceTypes}
            entities={allEntities}
            entityId={entityId}
            embedded
            label="Entity evidence"
          />
        </div>
      ) : (
        tabContent
      )}
    </div>
  );

  const proofN = proofCount(provenance);

  return (
    <CollapsibleCard
      key={focusOpen ? "entity-record-focus" : "entity-record"}
      id="entity-record"
      title={
        <span>
          Investigation record
          {summary ? (
            <span className="ml-2 text-xs font-normal text-zinc-500">
              {summary}
            </span>
          ) : null}
        </span>
      }
      actions={
        readOnly && onQuickEdit ? (
          <>
            <QuickEditButton
              label="Edit record"
              onClick={() => onQuickEdit()}
            />
            {proofN > 0 && (
              <QuickEditButton
                label="Edit proof"
                onClick={() => onQuickEdit("proof")}
              />
            )}
          </>
        ) : undefined
      }
      defaultOpen={Boolean(summary)}
      forceOpen={focusOpen}
      contentClassName="space-y-3"
    >
      {inner}
    </CollapsibleCard>
  );
}
