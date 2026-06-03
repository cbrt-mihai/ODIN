"use client";

import { ChevronDown, Shield } from "lucide-react";
import { EntryAnnotationsPanel } from "@/components/entities/entry-annotations";
import { ProofGallery } from "@/components/entities/proof-gallery";
import { QuickEditButton } from "@/components/entities/quick-edit-button";
import { collapsibleSummaryClass } from "@/components/ui/collapsible-card";
import { confidenceBadgeStyle } from "@/lib/confidence";
import { cn } from "@/lib/utils";
import { hasEntryContext } from "@/lib/entities/field-meta-summary";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { proofCount } from "@/lib/proof/helpers";
import type {
  ConfidenceTypeDefinition,
  Entity,
  Provenance,
} from "@/lib/types";

function formatDate(iso?: string) {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function ReadonlyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </p>
      <div className="text-sm text-zinc-300">{children}</div>
    </div>
  );
}

function ProvenanceSourceReadonly({
  provenance,
  entities,
}: {
  provenance: Provenance;
  entities: Entity[];
}) {
  const validPeriod = formatProvenanceValidity(provenance.validity);
  const hasSourceFields = Boolean(
    provenance.source?.trim() ||
      provenance.sourceUrl?.trim() ||
      provenance.collectedAt ||
      validPeriod,
  );
  const hasAnnotations = hasEntryContext(provenance);

  if (!hasSourceFields && !hasAnnotations) return null;

  return (
    <details className="group rounded-lg border border-zinc-800/80 bg-zinc-950/40">
      <summary
        className={cn(
          collapsibleSummaryClass,
          "min-h-10 px-3 py-2.5 text-xs font-medium text-zinc-400",
        )}
      >
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
        Source metadata & notes
      </summary>
      <div className="space-y-3 border-t border-zinc-800/60 px-3 pb-3 pt-2">
        {provenance.source?.trim() && (
          <ReadonlyRow label="Primary source">{provenance.source}</ReadonlyRow>
        )}
        {provenance.sourceUrl?.trim() && (
          <ReadonlyRow label="Source URL">
            <a
              href={provenance.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-blue-400 hover:underline"
            >
              {provenance.sourceUrl}
            </a>
          </ReadonlyRow>
        )}
        {provenance.collectedAt && (
          <ReadonlyRow label="Collected">
            {formatDate(provenance.collectedAt)}
          </ReadonlyRow>
        )}
        {validPeriod && (
          <ReadonlyRow label="Valid period">{validPeriod}</ReadonlyRow>
        )}
        {hasAnnotations && (
          <EntryAnnotationsPanel
            value={provenance}
            onChange={() => {}}
            readOnly
            entities={entities}
            embedded
          />
        )}
      </div>
    </details>
  );
}

export function ProofReadonlyView({
  provenance,
  confidenceTypes,
  entities = [],
  label = "Proof & evidence",
  embedded,
  onQuickEdit,
}: {
  provenance: Provenance;
  confidenceTypes: ConfidenceTypeDefinition[];
  entities?: Entity[];
  label?: string;
  /** Inline inside field meta — skip outer wrapper */
  embedded?: boolean;
  onQuickEdit?: () => void;
}) {
  const count = proofCount(provenance);
  const hasSource = Boolean(
    provenance.source?.trim() ||
      provenance.sourceUrl?.trim() ||
      provenance.collectedAt ||
      formatProvenanceValidity(provenance.validity) ||
      hasEntryContext(provenance),
  );

  if (count === 0 && !hasSource) return null;

  const inner = (
    <div className="space-y-3">
      <ProvenanceSourceReadonly provenance={provenance} entities={entities} />
      {count > 0 && (
        <ProofGallery
          provenance={provenance}
          readOnly
          confidenceTypes={confidenceTypes}
          entities={entities}
        />
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500/80" />
          <span className="font-medium text-zinc-400">{label}</span>
          {count > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px]">
              {count} item{count === 1 ? "" : "s"}
            </span>
          )}
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={confidenceBadgeStyle(
              provenance.confidence,
              confidenceTypes,
            )}
          >
            {confidenceTypes.find((c) => c.id === provenance.confidence)
              ?.label ?? provenance.confidence}
          </span>
          {onQuickEdit && (
            <QuickEditButton label="Edit proof" onClick={onQuickEdit} />
          )}
        </div>
        {inner}
      </div>
    );
  }

  return (
    <details className="group rounded-md border border-zinc-800/80 bg-zinc-900/40">
      <summary
        className={cn(
          collapsibleSummaryClass,
          "min-h-11 justify-between px-3 py-3 text-xs font-medium text-zinc-400",
        )}
      >
        <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
          <Shield className="h-4 w-4 text-emerald-500/80" />
          {label}
          {count > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
              {count}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1">
          {onQuickEdit && (
            <QuickEditButton label="Edit proof" onClick={onQuickEdit} />
          )}
          <span
            className="rounded px-2 py-0.5 text-[10px]"
            style={confidenceBadgeStyle(
              provenance.confidence,
              confidenceTypes,
            )}
          >
            {confidenceTypes.find((c) => c.id === provenance.confidence)?.label}
          </span>
        </span>
      </summary>
      <div className="border-t border-zinc-800/60 px-3 pb-3 pt-2">{inner}</div>
    </details>
  );
}
