"use client";

import type { ReactNode } from "react";
import { MarkdownReadonly } from "@/components/markdown/markdown-readonly";
import { DateRangesReadonly } from "@/components/entities/date-range-confidence-readonly";
import {
  FieldValueValidityReadonly,
  fieldValueUsesDateRangeData,
} from "@/components/entities/field-value-validity";
import { ReadonlyLinkInline } from "@/components/links/readonly-link-inline";
import { LinkDestinationButton } from "@/components/links/link-destination-button";
import {
  formatDateRange,
  formatLocation,
  isDateRangeValue,
  isDateRangesValue,
} from "@/lib/date-range/format";
import {
  migrateDateEntry,
  migrateDateRangesValue,
} from "@/lib/date-range/migrate";
import { confidenceBadgeStyle } from "@/lib/confidence";
import type { DateRangeValue } from "@/lib/types";
import {
  effectiveValueFlavor,
  stringValue,
} from "@/lib/field-value-display";
import { isMarkdownFlavor } from "@/lib/markdown/flavor";
import { AnnotatedText } from "@/components/entities/annotated-text";
import { TagInput } from "@/components/ui/tag-input";
import { migrateAnnotationsToLists, kindLabel } from "@/lib/entries/helpers";
import {
  CONTEXT_ENTRY_KINDS,
  NOTE_ENTRY_KINDS,
} from "@/lib/types";
import type {
  ConfidenceTypeDefinition,
  DatesValue,
  Entity,
  Field,
  LocationValue,
} from "@/lib/types";

interface ReadonlyFieldValueProps {
  field: Field;
  entities: Entity[];
  confidenceTypes?: ConfidenceTypeDefinition[];
}

function confLabel(
  id: string | undefined,
  types: ConfidenceTypeDefinition[],
) {
  if (!id) return null;
  return types.find((c) => c.id === id)?.label ?? id;
}

export function ReadonlyFieldValue({
  field,
  entities,
  confidenceTypes = [],
}: ReadonlyFieldValueProps) {
  const data = field.value.data;
  const flavor = effectiveValueFlavor(field);
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
  const hasMeta =
    contextEntries.length > 0 ||
    noteEntries.length > 0 ||
    field.description ||
    field.notes ||
    (field.tags ?? []).length > 0;

  function wrapValue(content: ReactNode) {
    if (fieldValueUsesDateRangeData(field.type)) return content;
    return (
      <>
        {content}
        <FieldValueValidityReadonly
          field={field}
          confidenceTypes={confidenceTypes}
        />
      </>
    );
  }

  const meta = hasMeta ? (
    <div className="mt-3 space-y-2 rounded-md border border-zinc-800/50 bg-zinc-950/30 px-3 py-2 text-sm">
      {contextEntries.map((e) => (
        <div key={e.id}>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {e.title}
            <span className="ml-1 normal-case text-zinc-500">
              ({kindLabel(CONTEXT_ENTRY_KINDS, e.kind)})
            </span>
          </p>
          {e.body.trim() ? (
            <AnnotatedText
              text={e.body}
              flavor={e.bodyFlavor}
              entities={entities}
            />
          ) : null}
        </div>
      ))}
      {field.description && contextEntries.length === 0 && (
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            Description
          </p>
          <AnnotatedText
            text={field.description}
            flavor={field.descriptionFlavor}
            entities={entities}
          />
        </div>
      )}
      {noteEntries.map((e) => (
        <div key={e.id}>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {e.title}
            <span className="ml-1 normal-case text-zinc-500">
              ({kindLabel(NOTE_ENTRY_KINDS, e.kind)})
            </span>
          </p>
          {e.body.trim() ? (
            <AnnotatedText
              text={e.body}
              flavor={e.bodyFlavor}
              entities={entities}
            />
          ) : null}
        </div>
      ))}
      {field.notes && noteEntries.length === 0 && (
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            Notes
          </p>
          <AnnotatedText
            text={field.notes}
            flavor={field.notesFlavor}
            entities={entities}
          />
        </div>
      )}
      {(field.tags ?? []).length > 0 && contextEntries.length === 0 && (
        <TagInput tags={field.tags ?? []} onChange={() => {}} disabled />
      )}
    </div>
  ) : null;

  if (field.type === "entityLink") {
    const link = data as { entityId: string };
    const ent = entities.find((e) => e.id === link?.entityId);
    if (!ent) return <span className="text-zinc-500">—</span>;
    return wrapValue(
      <span className="inline-flex items-center gap-2 text-zinc-200">
        <span>{ent.displayName}</span>
        <LinkDestinationButton
          href={`/entities/${ent.id}`}
          variant="internal"
          title={`Open ${ent.displayName}`}
        />
      </span>,
    );
  }

  if (field.type === "url" && typeof data === "string" && data) {
    return wrapValue(
      <span className="inline-flex items-center gap-2 text-zinc-200">
        <span className="break-all">{data}</span>
        <LinkDestinationButton
          href={data}
          variant="external"
          title="Open URL"
        />
      </span>,
    );
  }

  if (field.type === "email" && typeof data === "string" && data) {
    return wrapValue(
      <span className="inline-flex items-center gap-2 text-zinc-200">
        <span>{data}</span>
        <LinkDestinationButton
          href={`mailto:${data}`}
          variant="email"
          title="Send email"
        />
      </span>,
    );
  }

  if (field.type === "phone" && typeof data === "string" && data) {
    return wrapValue(
      <span className="inline-flex items-center gap-2 text-zinc-200">
        <span>{data}</span>
        <LinkDestinationButton
          href={`tel:${data.replace(/\s/g, "")}`}
          variant="external"
          title="Call"
        />
      </span>,
    );
  }

  const valueFlavor = effectiveValueFlavor(field);
  const mdText = typeof data === "string" ? data : stringValue(data);

  if (
    field.type === "richMarkdown" ||
    field.type === "obsidianMarkdown" ||
    (typeof mdText === "string" && isMarkdownFlavor(valueFlavor))
  ) {
    if (!mdText.trim()) return wrapValue(<span className="text-zinc-500">—</span>);
    return wrapValue(
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
        <MarkdownReadonly content={mdText} entities={entities} />
      </div>,
    );
  }

  if (field.type === "longText" && typeof data === "string" && data) {
    if (/https?:\/\/|\[\[/.test(data)) {
      return wrapValue(
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
          <ReadonlyLinkInline content={data} entities={entities} />
        </div>,
      );
    }
    return wrapValue(
      <span className="whitespace-pre-wrap text-zinc-200">{data}</span>,
    );
  }

  if (
    (field.type === "dateRange" ||
      field.type === "date" ||
      field.type === "datetime") &&
    data &&
    typeof data === "object"
  ) {
    if (isDateRangesValue(data)) {
      const ranges = migrateDateRangesValue(data);
      return wrapValue(
        <DateRangesReadonly
          ranges={ranges.entries}
          confidenceTypes={confidenceTypes}
          multiLabel="Period"
        />,
      );
    }
    if (isDateRangeValue(data)) {
      const range = data as DateRangeValue;
      return wrapValue(
        <DateRangesReadonly
          ranges={[range]}
          confidenceTypes={confidenceTypes}
        />,
      );
    }
  }

  if (field.type === "dates" && data) {
    const dates = data as DatesValue;
    return (
      <div className="space-y-2">
        <ul className="list-inside list-disc space-y-2 text-zinc-200">
          {dates.entries.map((raw) => {
            const e = migrateDateEntry(raw);
            return (
            <li key={e.id}>
              <span>
                {formatDateRange(e.validity)}
                {e.confidence && (
                  <span
                    className="ml-2 rounded px-1.5 py-0.5 text-xs"
                    style={confidenceBadgeStyle(e.confidence, confidenceTypes)}
                  >
                    {confLabel(e.confidence, confidenceTypes)}
                  </span>
                )}
              </span>
              {e.description && (
                <div className="mt-1 text-sm">
                  <AnnotatedText
                    text={e.description}
                    flavor={e.descriptionFlavor}
                    entities={entities}
                  />
                </div>
              )}
              {(e.tags ?? []).length > 0 && (
                <TagInput tags={e.tags ?? []} onChange={() => {}} disabled />
              )}
              {e.notes && (
                <div className="mt-1">
                  <AnnotatedText
                    text={e.notes}
                    flavor={e.notesFlavor}
                    entities={entities}
                  />
                </div>
              )}
            </li>
            );
          })}
        </ul>
        {meta}
      </div>
    );
  }

  if (field.type === "location" && data) {
    const loc = data as LocationValue;
    const text = formatLocation(loc);
    const maps =
      loc.lat != null && loc.lng != null
        ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
        : loc.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`
          : null;
    return wrapValue(
      <span className="inline-flex items-center gap-2 text-zinc-200">
        <span>{text}</span>
        {maps && (
          <LinkDestinationButton
            href={maps}
            variant="external"
            title="Open in maps"
          />
        )}
      </span>,
    );
  }

  if (field.type === "checklist" || field.type === "tags") {
    return wrapValue(
      <span className="text-zinc-200">
        {(data as string[])?.join(", ") || "—"}
      </span>,
    );
  }

  if (field.type === "boolean") {
    return wrapValue(
      <span className="text-zinc-200">{data ? "Yes" : "No"}</span>,
    );
  }

  if (field.type === "dropdown") {
    const opt = field.typeConfig?.options?.find(
      (o) => o.id === (data as string),
    );
    return wrapValue(
      <span className="text-zinc-200">
        {opt?.label ?? (data as string) ?? "—"}
      </span>,
    );
  }

  if (field.type === "shortText" && typeof data === "string" && data) {
    if (/https?:\/\/|\[\[/.test(data)) {
      return wrapValue(
        <span className="inline-flex items-center gap-2">
          <ReadonlyLinkInline content={data} entities={entities} />
        </span>,
      );
    }
  }

  if (flavor !== "plain") {
    const text = stringValue(data);
    if (!text.trim()) return wrapValue(<span className="text-zinc-500">—</span>);
    return wrapValue(
      <div>
        <AnnotatedText text={text} flavor={flavor} entities={entities} />
        {meta}
      </div>,
    );
  }

  return wrapValue(
    <div>
      <span className="text-zinc-200">{String(data ?? "—")}</span>
      {meta}
    </div>,
  );
}
