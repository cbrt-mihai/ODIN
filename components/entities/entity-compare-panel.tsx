"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EntityDisambiguation } from "@/components/entities/entity-disambiguation";
import { EntityTypeBadge } from "@/components/entities/entity-type-badge";
import { mergeFieldMetaLines } from "@/lib/entities/merge-field-meta";
import { fieldDisplayValue } from "@/lib/reports/shared";
import { ReadonlyFieldValue } from "@/components/entities/readonly-field-value";
import { cn, formatDate } from "@/lib/utils";
import type { Entity, Field } from "@/lib/types";

export function EntityCompareSummary({
  entity,
  role,
  highlight,
  className,
  allEntities,
}: {
  entity: Entity;
  role: "primary" | "secondary" | "candidate";
  highlight?: boolean;
  className?: string;
  allEntities?: Entity[];
}) {
  const fieldCount = entity.sections.reduce(
    (n, s) => n + s.fields.length,
    0,
  );
  const proofCount =
    (entity.provenance?.proofs?.length ?? 0) +
    entity.sections.reduce(
      (n, s) =>
        n +
        (s.provenance?.proofs?.length ?? 0) +
        s.fields.reduce((fn, f) => fn + (f.provenance.proofs?.length ?? 0), 0),
      0,
    );

  const roleLabel =
    role === "primary"
      ? "Primary"
      : role === "secondary"
        ? "Duplicate"
        : "Candidate";

  const roleClass =
    role === "primary"
      ? "bg-blue-950/40 text-blue-200 border-blue-800/60"
      : "bg-amber-950/40 text-amber-200 border-amber-800/60";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/50 p-4",
        highlight && "ring-1 ring-amber-700/50",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
            roleClass,
          )}
        >
          {roleLabel}
        </span>
        <Link
          href={`/entities/${entity.id}`}
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-semibold text-zinc-100">
            {entity.displayName}
          </h4>
          <EntityTypeBadge type={entity.type} />
        </div>

        <EntityDisambiguation
          entity={entity}
          allEntities={allEntities}
          className="mt-1"
        />

        {(entity.aliases?.length ?? 0) > 0 && (
          <p className="text-xs text-zinc-500">
            aliases:{" "}
            <span className="text-zinc-400">{entity.aliases!.join(", ")}</span>
          </p>
        )}

        <p className="text-xs text-zinc-500">
          {entity.sections.length} sections · {fieldCount} fields
          {proofCount > 0 && <> · {proofCount} evidence</>}
          {(entity.contextEntries?.length ?? 0) > 0 && (
            <> · {entity.contextEntries!.length} context</>
          )}
          {(entity.noteEntries?.length ?? 0) > 0 && (
            <> · {entity.noteEntries!.length} notes</>
          )}
          {entity.events.length > 0 && <> · {entity.events.length} events</>}
          {entity.updatedAt && (
            <> · updated {formatDate(entity.updatedAt)}</>
          )}
        </p>
      </div>
    </div>
  );
}

export function EntityComparePanel({
  primary,
  secondary,
  title = "Compare entities",
  allEntities,
}: {
  primary: Entity;
  secondary: Entity;
  title?: string;
  allEntities?: Entity[];
}) {
  return (
    <div className="space-y-3">
      {title && (
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <EntityCompareSummary
          entity={primary}
          role="primary"
          allEntities={allEntities}
        />
        <EntityCompareSummary
          entity={secondary}
          role="secondary"
          highlight
          allEntities={allEntities}
        />
      </div>
    </div>
  );
}

export function EntityFieldCompareValue({
  field,
  emptyLabel = "—",
  showMeta = true,
  entities = [],
  rich = true,
}: {
  field?: Field;
  emptyLabel?: string;
  showMeta?: boolean;
  entities?: Entity[];
  rich?: boolean;
}) {
  if (!field) {
    return (
      <span className="text-xs italic text-zinc-600">{emptyLabel}</span>
    );
  }

  if (rich) {
    return (
      <div className="max-h-56 space-y-1.5 overflow-y-auto text-xs">
        <ReadonlyFieldValue field={field} entities={entities} />
        {showMeta &&
          mergeFieldMetaLines(field)
            .filter(
              (line) =>
                !line.label.startsWith("Value period:") &&
                !line.label.startsWith("Source period:"),
            )
            .map((line) => (
              <p
                key={line.label}
                className={cn(
                  "text-[11px] leading-snug",
                  line.tone === "accent" && "text-blue-400/80",
                  line.tone === "warn" && "text-amber-400/80",
                  (!line.tone || line.tone === "muted") && "text-zinc-500",
                )}
              >
                {line.label}
              </p>
            ))}
      </div>
    );
  }

  const text = fieldDisplayValue(field).trim() || emptyLabel;
  const meta = showMeta ? mergeFieldMetaLines(field) : [];

  return (
    <div className="space-y-1.5">
      <p
        className={cn(
          "break-words text-xs text-zinc-300",
          text === emptyLabel && "italic text-zinc-600",
        )}
        title={text}
      >
        {text.length > 200 ? `${text.slice(0, 200)}…` : text}
      </p>
      {meta.map((line) => (
        <p
          key={line.label}
          className={cn(
            "text-[11px] leading-snug",
            line.tone === "accent" && "text-blue-400/80",
            line.tone === "warn" && "text-amber-400/80",
            (!line.tone || line.tone === "muted") && "text-zinc-500",
          )}
        >
          {line.label}
        </p>
      ))}
    </div>
  );
}
