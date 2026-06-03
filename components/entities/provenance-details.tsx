"use client";

import { Input } from "@/components/ui/input";
import { collapsibleSummaryClass } from "@/components/ui/collapsible-card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import type { ConfidenceTypeDefinition, Field, Provenance } from "@/lib/types";

export function ProvenanceDetails({
  provenance,
  onChange,
  readOnly,
  confidenceTypes = [],
}: {
  provenance: Provenance;
  onChange: (p: Provenance) => void;
  readOnly?: boolean;
  confidenceTypes?: ConfidenceTypeDefinition[];
}) {
  const validPeriod = formatProvenanceValidity(provenance.validity);

  if (readOnly) {
    const has =
      provenance.source ||
      provenance.sourceUrl ||
      provenance.collectedAt ||
      validPeriod ||
      provenance.notes;
    if (!has) return null;
    return (
      <div className="rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3 text-xs text-zinc-400 space-y-1">
        {provenance.source && <p>Source: {provenance.source}</p>}
        {provenance.sourceUrl && (
          <p>
            URL:{" "}
            <a
              href={provenance.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              {provenance.sourceUrl}
            </a>
          </p>
        )}
        {provenance.collectedAt && (
          <p>Collected: {provenance.collectedAt.slice(0, 10)}</p>
        )}
        {validPeriod && <p>Valid period: {validPeriod}</p>}
        {provenance.notes && <p>{provenance.notes}</p>}
      </div>
    );
  }

  return (
    <details className="rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3">
      <summary
        className={cn(collapsibleSummaryClass, "text-xs font-medium text-zinc-500")}
      >
        Source & provenance
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-zinc-500">Source</Label>
          <Input
            value={provenance.source ?? ""}
            onChange={(e) =>
              onChange({ ...provenance, source: e.target.value || undefined })
            }
            placeholder="LinkedIn, court filing…"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-zinc-500">Source URL</Label>
          <Input
            type="url"
            value={provenance.sourceUrl ?? ""}
            onChange={(e) =>
              onChange({
                ...provenance,
                sourceUrl: e.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Collected at</Label>
          <Input
            type="date"
            value={provenance.collectedAt?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange({
                ...provenance,
                collectedAt: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-zinc-500">Valid period</Label>
          <DateRangesFieldEditor
            value={migrateDateRangesValue(provenance.validity)}
            onChange={(validity) => onChange({ ...provenance, validity })}
            confidenceTypes={confidenceTypes}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-zinc-500">Notes</Label>
          <Textarea
            value={provenance.notes ?? ""}
            onChange={(e) =>
              onChange({ ...provenance, notes: e.target.value || undefined })
            }
            rows={2}
          />
        </div>
      </div>
    </details>
  );
}

export function updateFieldProvenance(
  field: Field,
  provenance: Provenance,
): Field {
  return { ...field, provenance };
}
