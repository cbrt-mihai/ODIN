"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Shield } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ContextNotesEditor } from "@/components/entities/context-notes-editor";
import { ProofPanel } from "@/components/entities/proof-panel";
import { QuickEditButton } from "@/components/entities/quick-edit-button";
import { collapsibleToggleButtonClass } from "@/components/ui/collapsible-card";
import { FlavorSelect } from "@/components/entities/flavor-select";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import {
  fieldMetaSummary,
  hasProvenanceMeta,
} from "@/lib/entities/field-meta-summary";
import { proofCount } from "@/lib/proof/helpers";
import { cn } from "@/lib/utils";
import type { ConfidenceTypeDefinition, Entity, Field } from "@/lib/types";

const VALUE_FLAVOR_TYPES = new Set([
  "shortText",
  "longText",
  "url",
  "email",
  "phone",
  "number",
  "location",
  "dropdown",
  "tags",
  "image",
  "entityLink",
  "boolean",
  "dateRange",
  "dates",
]);

type MetaTab = "context" | "notes" | "proof";

/** Chevron-only control for expanding field meta — sits left of the field label. */
export function FieldMetaChevron({
  expanded,
  onClick,
  className,
  title = "Field details",
}: {
  expanded: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-expanded={expanded}
      aria-label={title}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300",
        className,
      )}
    >
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 transition-transform",
          !expanded && "-rotate-90",
        )}
      />
    </button>
  );
}

export function FieldMetaPanel({
  field,
  onChange,
  readOnly,
  confidenceTypes,
  entities = [],
  entityId,
  defaultExpanded = false,
  defaultTab,
  onQuickEdit,
  hideToggle = false,
  expanded: expandedProp,
  onExpandedChange,
}: {
  field: Field;
  onChange: (f: Field) => void;
  readOnly?: boolean;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  entityId?: string;
  defaultExpanded?: boolean;
  defaultTab?: MetaTab;
  onQuickEdit?: (tab?: MetaTab) => void;
  /** When true, parent renders {@link FieldMetaChevron} beside the field label. */
  hideToggle?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
  const summary = fieldMetaSummary(field);
  const hasProof = hasProvenanceMeta(field.provenance);
  const [expandedInternal, setExpandedInternal] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedInternal;
  const setExpanded = onExpandedChange ?? setExpandedInternal;
  const [tab, setTab] = useState<MetaTab>(defaultTab ?? "context");

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded, setExpanded]);

  useEffect(() => {
    if (defaultTab) setTab(defaultTab);
  }, [defaultTab]);

  const canFlavorValue =
    VALUE_FLAVOR_TYPES.has(field.type) &&
    field.type !== "richMarkdown" &&
    field.type !== "obsidianMarkdown";

  const patchLists = (ctx: typeof contextEntries, notes: typeof noteEntries) =>
    onChange({
      ...field,
      contextEntries: ctx,
      noteEntries: notes,
    });

  if (readOnly) {
    if (!summary && !onQuickEdit) return null;
    return (
      <div className={cn(!hideToggle && "mt-3 border-t border-zinc-800/50 pt-2")}>
        {!hideToggle && (
          <div className="flex w-full items-stretch gap-1">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={cn(
                collapsibleToggleButtonClass,
                "min-w-0 flex-1 text-xs text-zinc-500 hover:text-zinc-300",
              )}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  !expanded && "-rotate-90",
                )}
              />
              <span className="font-medium">Field details</span>
              {summary ? (
                <span className="text-zinc-600">— {summary}</span>
              ) : null}
            </button>
            {onQuickEdit && (
              <div
                className="flex shrink-0 items-center self-stretch py-1 pr-1"
                onClick={(e) => e.stopPropagation()}
              >
                <QuickEditButton
                  label="Edit details"
                  onClick={() => onQuickEdit()}
                />
                {hasProof && (
                  <QuickEditButton
                    label="Edit proof"
                    onClick={() => onQuickEdit("proof")}
                  />
                )}
              </div>
            )}
          </div>
        )}
        {expanded && (
          <div
            className={cn(
              "space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-3",
              hideToggle ? "mt-0" : "mt-2",
            )}
          >
            {(contextEntries.length > 0 || noteEntries.length > 0) && (
              <ContextNotesEditor
                contextEntries={contextEntries}
                noteEntries={noteEntries}
                onContextChange={() => {}}
                onNotesChange={() => {}}
                readOnly
                entities={entities}
              />
            )}
            {hasProof && (
              <ProofPanel
                provenance={field.provenance}
                onChange={() => {}}
                readOnly
                confidenceTypes={confidenceTypes}
                entities={entities}
                embedded
                onQuickEdit={
                  onQuickEdit ? () => onQuickEdit("proof") : undefined
                }
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(!hideToggle && "mt-3 border-t border-zinc-800/50 pt-2")}>
      {!hideToggle && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            collapsibleToggleButtonClass,
            "text-xs text-zinc-500 hover:text-zinc-300",
          )}
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <span className="font-medium">Field details</span>
          {summary ? (
            <span className="text-zinc-600">— {summary}</span>
          ) : (
            <span className="text-zinc-600">— add context, notes, or proof</span>
          )}
        </button>
      )}

      {expanded && (
        <div
          className={cn(
            "space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-3",
            hideToggle ? "mt-0" : "mt-2",
          )}
        >
          <SegmentedControl<MetaTab>
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
                  proofCount(field.provenance) > 0
                    ? `Proof (${proofCount(field.provenance)})`
                    : "Proof",
              },
            ]}
          />

          {tab === "context" && (
            <div className="space-y-3">
              <p className="text-[11px] leading-relaxed text-zinc-600">
                Multiple context entries for this field (background, hypotheses,
                etc.).
              </p>
              {canFlavorValue && (
                <FlavorSelect
                  label="How the value displays"
                  value={field.valueFlavor}
                  onChange={(valueFlavor) =>
                    onChange({ ...field, valueFlavor })
                  }
                  className="max-w-xs"
                />
              )}
              <ContextNotesEditor
                contextEntries={contextEntries}
                noteEntries={[]}
                onContextChange={(entries) =>
                  patchLists(entries, noteEntries)
                }
                onNotesChange={() => {}}
                entities={entities}
                defaultSubTab="context"
                hideSubTabs
              />
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <p className="text-[11px] leading-relaxed text-zinc-600">
                Multiple investigation notes for this field.
              </p>
              <ContextNotesEditor
                contextEntries={[]}
                noteEntries={noteEntries}
                onContextChange={() => {}}
                onNotesChange={(entries) =>
                  patchLists(contextEntries, entries)
                }
                entities={entities}
                defaultSubTab="notes"
                hideSubTabs
              />
            </div>
          )}

          {tab === "proof" && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-zinc-600">
                <Shield className="h-3 w-3 text-emerald-500/70" />
                Add multiple evidence items (links, documents, witnesses, etc.).
              </p>
              <ProofPanel
                provenance={field.provenance}
                onChange={(provenance) => onChange({ ...field, provenance })}
                confidenceTypes={confidenceTypes}
                entities={entities}
                entityId={entityId}
                embedded
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
