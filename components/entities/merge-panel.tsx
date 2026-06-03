"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  EntityComparePanel,
  EntityFieldCompareValue,
} from "@/components/entities/entity-compare-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldPeriodLabel } from "@/lib/entities/merge-field-meta";
import {
  pairMergeListItems,
  type MergeListPairRow,
} from "@/lib/entities/merge-list-display";
import { mergeEntities } from "@/lib/actions/merge";
import {
  analyzeEntityMerge,
  defaultMergeSelections,
  defaultSecondaryFieldLabel,
  defaultSecondarySectionTitle,
  fieldSideKey,
  sectionSideKey,
  type FieldMergeChoice,
  type MergeAnalysis,
  type MergeFieldRow,
  type MergeListItem,
  type MergeProofRow,
  type MergeSelections,
  type SectionMergeStrategy,
  type ValiditySide,
} from "@/lib/entities/merge-analysis";
import type { Entity } from "@/lib/types";
import { cn } from "@/lib/utils";

type MergeTab =
  | "overview"
  | "sections"
  | "evidence"
  | "media"
  | "timeline";

const MERGE_TABS: { id: MergeTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sections", label: "Sections & fields" },
  { id: "evidence", label: "Evidence" },
  { id: "media", label: "Gallery & files" },
  { id: "timeline", label: "Timeline & notes" },
];

function MergeTabBar({
  active,
  onChange,
  counts,
}: {
  active: MergeTab;
  onChange: (tab: MergeTab) => void;
  counts: Record<MergeTab, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950/80 p-1">
      {MERGE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            active === tab.id
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
          )}
        >
          {tab.label}
          {counts[tab.id] > 0 && (
            <span className="ml-1.5 tabular-nums text-zinc-500">
              ({counts[tab.id]})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function BulkKeepRow({
  onKeepPrimary,
  onKeepDuplicate,
  onKeepAll,
}: {
  onKeepPrimary: () => void;
  onKeepDuplicate: () => void;
  onKeepAll: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onKeepPrimary}>
        Primary only
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onKeepDuplicate}>
        Duplicate only
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onKeepAll}>
        Keep all
      </Button>
    </div>
  );
}

const SECTION_STRATEGY_LABELS: Record<SectionMergeStrategy, string> = {
  keep_primary: "Keep primary section",
  use_secondary: "Replace with duplicate section",
  merge_fields: "Merge field-by-field",
  keep_both: "Keep both sections (rename duplicate)",
};

function KeepCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-xs",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-zinc-600"
      />
      <span className="text-zinc-400">{label}</span>
    </label>
  );
}

function MetadataSection({
  analysis,
  selections,
  onChange,
}: {
  analysis: MergeAnalysis;
  selections: MergeSelections;
  onChange: (next: MergeSelections) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Profile & metadata
      </p>
      <div className="overflow-x-auto rounded-md border border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-medium">Property</th>
              <th className="px-3 py-2 font-medium">Primary</th>
              <th className="px-3 py-2 font-medium">Duplicate</th>
              <th className="px-3 py-2 font-medium w-40">Keep</th>
            </tr>
          </thead>
          <tbody>
            {analysis.metadata.map((row) => (
              <tr
                key={row.key}
                className={cn(
                  "border-b border-zinc-800/60 align-top",
                  row.conflict && "bg-amber-950/10",
                )}
              >
                <td className="px-3 py-3">
                  <p className="text-zinc-200">{row.label}</p>
                  {row.conflict && (
                    <span className="text-xs text-amber-400">Conflict</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-zinc-300">
                  {row.primary ?? "—"}
                </td>
                <td className="px-3 py-3 text-xs text-zinc-300">
                  {row.secondary ?? "—"}
                </td>
                <td className="px-3 py-3">
                  {row.key === "displayName" || row.key === "slug" ? (
                    <Select
                      value={
                        row.key === "displayName"
                          ? selections.displayName
                          : selections.slug
                      }
                      onValueChange={(v) =>
                        onChange({
                          ...selections,
                          ...(row.key === "displayName"
                            ? { displayName: v as "primary" | "secondary" }
                            : { slug: v as "primary" | "secondary" }),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Duplicate</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(analysis.tagItems.length > 0 || analysis.aliasItems.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {analysis.tagItems.length > 0 && (
            <ListKeepPanel
              title="Tags"
              items={analysis.tagItems}
              checked={(id) => selections.tags[id] !== false}
              onToggle={(id, v) =>
                onChange({
                  ...selections,
                  tags: { ...selections.tags, [id]: v },
                })
              }
            />
          )}
          {analysis.aliasItems.length > 0 && (
            <ListKeepPanel
              title="Aliases"
              items={analysis.aliasItems}
              checked={(id) => selections.aliases[id] !== false}
              onToggle={(id, v) =>
                onChange({
                  ...selections,
                  aliases: { ...selections.aliases, [id]: v },
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function ListKeepPanel({
  title,
  items,
  checked,
  onToggle,
}: {
  title: string;
  items: MergeListItem[];
  checked: (id: string) => boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800">
      <p className="border-b border-zinc-800 px-3 py-2 text-xs font-medium uppercase text-zinc-500">
        {title}
      </p>
      <ul className="max-h-48 divide-y divide-zinc-800/60 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-3 py-2">
            <input
              type="checkbox"
              checked={checked(item.id)}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="mt-0.5 rounded border-zinc-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.summary}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValidityPicker({
  label,
  primaryText,
  secondaryText,
  value,
  onChange,
  conflict,
}: {
  label: string;
  primaryText: string;
  secondaryText: string;
  value: ValiditySide;
  onChange: (v: ValiditySide) => void;
  conflict?: boolean;
}) {
  const options: { side: ValiditySide; heading: string; text: string }[] = [
    { side: "primary", heading: "Primary", text: primaryText },
    { side: "secondary", heading: "Duplicate", text: secondaryText },
  ];

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </legend>
      {options.map((opt) => (
        <label
          key={opt.side}
          className={cn(
            "flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5",
            value === opt.side
              ? "border-zinc-600 bg-zinc-900/60"
              : "border-zinc-800/60 bg-transparent",
            conflict && value !== opt.side && "border-amber-900/30",
          )}
        >
          <input
            type="radio"
            name={`${label}-${primaryText}-${secondaryText}`}
            checked={value === opt.side}
            onChange={() => onChange(opt.side)}
            className="mt-0.5 border-zinc-600"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {opt.heading}
            </span>
            <span
              className={cn(
                "block break-words text-[11px] leading-snug",
                opt.text === "(none)" ? "italic text-zinc-600" : "text-zinc-300",
              )}
            >
              {opt.text}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function FieldMergeControls({
  field,
  choice,
  selections,
  onChange,
}: {
  field: MergeFieldRow;
  choice: FieldMergeChoice;
  selections: MergeSelections;
  onChange: (next: MergeSelections) => void;
}) {
  const showValidity =
    field.primary &&
    field.secondary &&
    choice !== "exclude" &&
    choice !== "both";

  const showPrimaryLabel =
    choice !== "exclude" &&
    (choice === "primary" ||
      choice === "both" ||
      field.status === "primary_only") &&
    field.primary;
  const showSecondaryLabel =
    choice !== "exclude" &&
    (choice === "secondary" ||
      choice === "both" ||
      field.status === "secondary_only") &&
    field.secondary;

  const primaryField = field.primary;
  const secondaryField = field.secondary;

  return (
    <div className="space-y-2">
      {showPrimaryLabel && primaryField && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Primary label
          </p>
          <Input
            value={
              selections.fieldLabels[
                fieldSideKey("primary", primaryField.id)
              ] ?? primaryField.label
            }
            onChange={(e) =>
              onChange({
                ...selections,
                fieldLabels: {
                  ...selections.fieldLabels,
                  [fieldSideKey("primary", primaryField.id)]: e.target.value,
                },
              })
            }
            className="h-7 text-xs"
          />
        </div>
      )}
      {showSecondaryLabel && secondaryField && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Duplicate label
          </p>
          <Input
            value={
              selections.fieldLabels[
                fieldSideKey("secondary", secondaryField.id)
              ] ??
              defaultSecondaryFieldLabel(secondaryField, primaryField)
            }
            onChange={(e) =>
              onChange({
                ...selections,
                fieldLabels: {
                  ...selections.fieldLabels,
                  [fieldSideKey("secondary", secondaryField.id)]:
                    e.target.value,
                },
              })
            }
            className="h-7 text-xs"
          />
        </div>
      )}
      {showValidity && (
        <div className="grid gap-2 border-t border-zinc-800/60 pt-2">
          <ValidityPicker
            label="Value period"
            primaryText={fieldPeriodLabel(field.primary!, "value")}
            secondaryText={fieldPeriodLabel(field.secondary!, "value")}
            value={selections.fieldValueValidity[field.id] ?? "primary"}
            onChange={(v) =>
              onChange({
                ...selections,
                fieldValueValidity: {
                  ...selections.fieldValueValidity,
                  [field.id]: v,
                },
              })
            }
            conflict={field.valueValidityConflict}
          />
          <ValidityPicker
            label="Source period"
            primaryText={fieldPeriodLabel(field.primary!, "source")}
            secondaryText={fieldPeriodLabel(field.secondary!, "source")}
            value={selections.fieldSourceValidity[field.id] ?? "primary"}
            onChange={(v) =>
              onChange({
                ...selections,
                fieldSourceValidity: {
                  ...selections.fieldSourceValidity,
                  [field.id]: v,
                },
              })
            }
            conflict={field.sourceValidityConflict}
          />
        </div>
      )}
    </div>
  );
}

function SectionsMergeSection({
  analysis,
  selections,
  onChange,
  allEntities = [],
}: {
  analysis: MergeAnalysis;
  selections: MergeSelections;
  onChange: (next: MergeSelections) => void;
  allEntities?: Entity[];
}) {
  if (analysis.sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Sections & fields ({analysis.sections.length})
      </p>
      {analysis.sections.map((sec) => {
        const strategy = sec.secondary
          ? (selections.secondarySections[sec.secondary.id] ?? "merge_fields")
          : "keep_primary";
        const includePrimary =
          !sec.primary || selections.primarySections[sec.primary.id] !== false;

        return (
          <div
            key={sec.key}
            className={cn(
              "rounded-md border border-zinc-800",
              sec.status === "both" && "border-amber-900/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950/50 px-3 py-3">
              <div>
                <p className="font-medium text-zinc-100">{sec.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {sec.status === "both" && "Overlapping section · "}
                  {sec.status === "primary_only" && "Primary only · "}
                  {sec.status === "secondary_only" && "Duplicate only · "}
                  {sec.fields.length} field
                  {sec.fields.length === 1 ? "" : "s"}
                  {sec.fields.some((f) => f.status === "both_differ") &&
                    " · has conflicts"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {sec.primary && (
                  <KeepCheckbox
                    checked={includePrimary}
                    onChange={(v) =>
                      onChange({
                        ...selections,
                        primarySections: {
                          ...selections.primarySections,
                          [sec.primary!.id]: v,
                        },
                      })
                    }
                    label="Include primary"
                  />
                )}
                {sec.secondary && sec.status === "both" && (
                  <Select
                    value={strategy}
                    onValueChange={(v) => {
                      const secSecondary = sec.secondary;
                      if (!secSecondary) return;
                      const nextStrategy = v as SectionMergeStrategy;
                      const patch: MergeSelections = {
                        ...selections,
                        secondarySections: {
                          ...selections.secondarySections,
                          [secSecondary.id]: nextStrategy,
                        },
                      };
                      if (
                        nextStrategy === "keep_both" &&
                        !selections.sectionTitles[
                          sectionSideKey("secondary", secSecondary.id)
                        ]
                      ) {
                        patch.sectionTitles = {
                          ...selections.sectionTitles,
                          [sectionSideKey("secondary", secSecondary.id)]:
                            defaultSecondarySectionTitle(sec.title),
                        };
                      }
                      onChange(patch);
                    }}
                  >
                    <SelectTrigger className="h-8 w-64 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(SECTION_STRATEGY_LABELS) as [
                          SectionMergeStrategy,
                          string,
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {sec.status === "both" && strategy === "keep_both" && (
              <div className="grid gap-3 border-b border-zinc-800/60 px-3 py-3 sm:grid-cols-2">
                {sec.primary && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      Primary section title
                    </p>
                    <Input
                      value={
                        selections.sectionTitles[
                          sectionSideKey("primary", sec.primary.id)
                        ] ?? sec.title
                      }
                      onChange={(e) => {
                        const secPrimary = sec.primary;
                        if (!secPrimary) return;
                        onChange({
                          ...selections,
                          sectionTitles: {
                            ...selections.sectionTitles,
                            [sectionSideKey("primary", secPrimary.id)]:
                              e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {sec.secondary && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      Duplicate section title
                    </p>
                    <Input
                      value={
                        selections.sectionTitles[
                          sectionSideKey("secondary", sec.secondary.id)
                        ] ?? defaultSecondarySectionTitle(sec.title)
                      }
                      onChange={(e) => {
                        const secSecondary = sec.secondary;
                        if (!secSecondary) return;
                        onChange({
                          ...selections,
                          sectionTitles: {
                            ...selections.sectionTitles,
                            [sectionSideKey("secondary", secSecondary.id)]:
                              e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {sec.fields.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60 text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-2 font-medium">Field</th>
                      <th className="px-3 py-2 font-medium">Primary value</th>
                      <th className="px-3 py-2 font-medium">Duplicate value</th>
                      <th className="px-3 py-2 font-medium w-40">Resolution</th>
                      <th className="px-3 py-2 font-medium w-52">Labels & dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.fields.map((field) => {
                      const choice =
                        selections.fieldChoices[field.id] ?? "primary";
                      const showFields =
                        sec.status !== "both" ||
                        strategy === "merge_fields" ||
                        strategy === "keep_both" ||
                        (strategy === "keep_primary" && field.primary) ||
                        (strategy === "use_secondary" && field.secondary);

                      if (!showFields) return null;

                      return (
                        <tr
                          key={field.id}
                          className={cn(
                            "border-b border-zinc-800/40 align-top",
                            (field.status === "both_differ" ||
                              field.valueValidityConflict ||
                              field.sourceValidityConflict) &&
                              "bg-amber-950/10",
                          )}
                        >
                          <td className="px-3 py-3">
                            <p className="text-zinc-200">{field.label}</p>
                            {field.status === "both_same" &&
                              field.primary &&
                              field.secondary &&
                              field.primary.label !==
                                field.secondary.label && (
                                <span className="text-xs text-blue-400/90">
                                  Same value · different labels
                                </span>
                              )}
                            {field.status === "both_differ" && (
                              <span className="text-xs text-amber-400">
                                Conflict
                              </span>
                            )}
                            {(field.valueValidityConflict ||
                              field.sourceValidityConflict) && (
                              <span className="text-xs text-amber-400/90">
                                Date range conflict
                              </span>
                            )}
                            {field.status === "primary_only" && (
                              <span className="text-xs text-blue-400/80">
                                Primary only
                              </span>
                            )}
                            {field.status === "secondary_only" && (
                              <span className="text-xs text-amber-400/80">
                                Duplicate only
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <EntityFieldCompareValue
                              field={field.primary}
                              entities={allEntities}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <EntityFieldCompareValue
                              field={field.secondary}
                              entities={allEntities}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Select
                              value={choice}
                              onValueChange={(v) =>
                                onChange({
                                  ...selections,
                                  fieldChoices: {
                                    ...selections.fieldChoices,
                                    [field.id]: v as FieldMergeChoice,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.status === "both_differ" ||
                                field.status === "both_same"
                                  ? (
                                      [
                                        ["primary", "Primary"],
                                        ["secondary", "Duplicate"],
                                        ["both", "Keep both"],
                                        ["exclude", "Exclude"],
                                      ] as const
                                    )
                                  : field.status === "primary_only"
                                    ? (
                                        [
                                          ["primary", "Include"],
                                          ["exclude", "Exclude"],
                                        ] as const
                                      )
                                    : (
                                        [
                                          ["secondary", "Include"],
                                          ["exclude", "Exclude"],
                                        ] as const
                                      )
                                ).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-3">
                            <FieldMergeControls
                              field={field}
                              choice={choice}
                              selections={selections}
                              onChange={onChange}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MergeItemSideCell({
  item,
  checked,
  onToggle,
}: {
  item?: MergeListItem;
  checked: (id: string) => boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  if (!item) {
    return <span className="text-xs italic text-zinc-600">—</span>;
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-center gap-2">
        <input
          type="checkbox"
          checked={checked(item.id)}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="rounded border-zinc-600"
        />
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">
          Keep
        </span>
      </label>
      {item.detail && (
        <p
          className={cn(
            "whitespace-pre-wrap break-words text-left text-xs leading-relaxed",
            item.detail === "(No body text)"
              ? "italic text-zinc-600"
              : "text-zinc-300",
          )}
        >
          {item.detail}
        </p>
      )}
      {!item.detail && item.summary && (
        <p className="whitespace-pre-wrap break-words text-left text-xs text-zinc-400">
          {item.summary}
        </p>
      )}
    </div>
  );
}

function ItemKeepTable({
  title,
  items,
  checked,
  onToggle,
  bulkActions,
  paired = false,
}: {
  title: string;
  items: MergeListItem[];
  checked: (id: string) => boolean;
  onToggle: (id: string, value: boolean) => void;
  bulkActions?: {
    onKeepPrimary: () => void;
    onKeepDuplicate: () => void;
    onKeepAll: () => void;
  };
  paired?: boolean;
}) {
  if (items.length === 0) return null;

  const rows: MergeListPairRow[] = paired
    ? pairMergeListItems(items)
    : items.map((item) => ({
        key: item.id,
        label: item.label,
        summary: item.summary,
        ...(item.source === "primary"
          ? { primary: item }
          : { secondary: item }),
      }));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {title} ({items.length})
        </p>
        {bulkActions && <BulkKeepRow {...bulkActions} />}
      </div>
      <div className="overflow-x-auto rounded-md border border-zinc-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Primary</th>
              <th className="px-3 py-2 font-medium">Duplicate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={cn(
                  "border-b border-zinc-800/60 align-top",
                  row.primary &&
                    row.secondary &&
                    row.primary.detail !== row.secondary.detail &&
                    "bg-amber-950/10",
                )}
              >
                <td className="px-3 py-3">
                  <p className="text-zinc-200">{row.label}</p>
                  <p className="text-xs text-zinc-500">{row.summary}</p>
                  {!row.primary && (
                    <span className="text-xs text-amber-400/80">
                      Duplicate only
                    </span>
                  )}
                  {!row.secondary && row.primary && (
                    <span className="text-xs text-blue-400/80">Primary only</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <MergeItemSideCell
                    item={row.primary}
                    checked={checked}
                    onToggle={onToggle}
                  />
                </td>
                <td className="px-3 py-3">
                  <MergeItemSideCell
                    item={row.secondary}
                    checked={checked}
                    onToggle={onToggle}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProofsSection({
  proofs,
  selections,
  onChange,
  bulkActions,
}: {
  proofs: MergeProofRow[];
  selections: MergeSelections;
  onChange: (next: MergeSelections) => void;
  bulkActions?: {
    onKeepPrimary: () => void;
    onKeepDuplicate: () => void;
    onKeepAll: () => void;
  };
}) {
  if (proofs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Evidence / proof ({proofs.length})
        </p>
        {bulkActions && <BulkKeepRow {...bulkActions} />}
      </div>
      <div className="overflow-x-auto rounded-md border border-zinc-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-medium">Evidence</th>
              <th className="px-3 py-2 font-medium">Scope</th>
              <th className="px-3 py-2 font-medium">Valid period</th>
              <th className="px-3 py-2 font-medium w-24 text-center">Primary</th>
              <th className="px-3 py-2 font-medium w-24 text-center">
                Duplicate
              </th>
            </tr>
          </thead>
          <tbody>
            {proofs.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-800/60 align-top"
              >
                <td className="px-3 py-3">
                  <p className="text-zinc-200">{row.proof.title}</p>
                  <p className="text-xs text-zinc-500">{row.summary}</p>
                </td>
                <td className="px-3 py-3 text-xs text-zinc-400">
                  {row.scopeLabel}
                </td>
                <td className="px-3 py-3 text-xs text-zinc-400">
                  {row.validityLabel}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.source === "primary" ? (
                    <input
                      type="checkbox"
                      checked={selections.proofs[row.id] !== false}
                      onChange={(e) =>
                        onChange({
                          ...selections,
                          proofs: {
                            ...selections.proofs,
                            [row.id]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-zinc-600"
                    />
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.source === "secondary" ? (
                    <input
                      type="checkbox"
                      checked={selections.proofs[row.id] !== false}
                      onChange={(e) =>
                        onChange({
                          ...selections,
                          proofs: {
                            ...selections.proofs,
                            [row.id]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-zinc-600"
                    />
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MergePanel({
  primary,
  secondary,
  showCompare = true,
  allEntities,
}: {
  primary: Entity;
  secondary: Entity;
  showCompare?: boolean;
  allEntities?: Entity[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MergeTab>("overview");

  const analysis = useMemo(
    () => analyzeEntityMerge(primary, secondary),
    [primary, secondary],
  );

  const [selections, setSelections] = useState<MergeSelections>(() =>
    defaultMergeSelections(analysis),
  );

  const tabCounts = useMemo(
    (): Record<MergeTab, number> => ({
      overview:
        analysis.metadata.length +
        analysis.tagItems.length +
        analysis.aliasItems.length,
      sections: analysis.sections.length,
      evidence: analysis.proofs.length,
      media: analysis.gallery.length + analysis.attachments.length,
      timeline:
        analysis.events.length +
        analysis.contextEntries.length +
        analysis.noteEntries.length,
    }),
    [analysis],
  );

  function bulkForItems(items: MergeListItem[]) {
    const primaryIds = items.filter((i) => i.source === "primary").map((i) => i.id);
    const secondaryIds = items
      .filter((i) => i.source === "secondary")
      .map((i) => i.id);
    return {
      onKeepPrimary: () => {
        const patch: Record<string, boolean> = {};
        for (const id of [...primaryIds, ...secondaryIds]) patch[id] = false;
        for (const id of primaryIds) patch[id] = true;
        return patch;
      },
      onKeepDuplicate: () => {
        const patch: Record<string, boolean> = {};
        for (const id of [...primaryIds, ...secondaryIds]) patch[id] = false;
        for (const id of secondaryIds) patch[id] = true;
        return patch;
      },
      onKeepAll: () =>
        Object.fromEntries(
          [...primaryIds, ...secondaryIds].map((id) => [id, true]),
        ),
    };
  }

  function applyItemBulk(
    key: keyof Pick<
      MergeSelections,
      "gallery" | "attachments" | "events" | "contextEntries" | "noteEntries"
    >,
    mode: "primary" | "secondary" | "all",
    items: MergeListItem[],
  ) {
    const { onKeepPrimary, onKeepDuplicate, onKeepAll } = bulkForItems(items);
    const patch =
      mode === "primary"
        ? onKeepPrimary()
        : mode === "secondary"
          ? onKeepDuplicate()
          : onKeepAll();
    setSelections((s) => ({
      ...s,
      [key]: { ...s[key], ...patch },
    }));
  }

  function applyProofBulk(mode: "primary" | "secondary" | "all") {
    const primaryIds = analysis.proofs
      .filter((p) => p.source === "primary")
      .map((p) => p.id);
    const secondaryIds = analysis.proofs
      .filter((p) => p.source === "secondary")
      .map((p) => p.id);
    const patch: Record<string, boolean> = {};
    for (const id of [...primaryIds, ...secondaryIds]) patch[id] = false;
    if (mode === "primary") {
      for (const id of primaryIds) patch[id] = true;
    } else if (mode === "secondary") {
      for (const id of secondaryIds) patch[id] = true;
    } else {
      for (const id of [...primaryIds, ...secondaryIds]) patch[id] = true;
    }
    setSelections((s) => ({ ...s, proofs: { ...s.proofs, ...patch } }));
  }

  async function merge() {
    const ok = await confirmDialog({
      title: "Merge entities",
      description: `Merge "${secondary.displayName}" into "${primary.displayName}"? The duplicate will be moved to trash.`,
      confirmLabel: "Merge",
      destructive: true,
    });
    if (!ok) return;
    setLoading(true);
    try {
      await mergeEntities(primary.id, secondary.id, selections);
      router.push(`/entities/${primary.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-amber-900/50 bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base text-amber-200">
          Merge duplicate
          {analysis.conflictCount > 0 && (
            <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-xs font-normal text-amber-300">
              {analysis.conflictCount} conflict
              {analysis.conflictCount === 1 ? "" : "s"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {showCompare && (
          <EntityComparePanel
            primary={primary}
            secondary={secondary}
            title="Side-by-side comparison"
            allEntities={allEntities}
          />
        )}

        <p className="text-zinc-400">
          Use the tabs to review metadata, fields (with date ranges and field
          notes), evidence, media, and timeline data. Check what to keep from
          each side. The primary record survives; the duplicate goes to trash.
        </p>

        <MergeTabBar
          active={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
        />

        {activeTab === "overview" && (
          <MetadataSection
            analysis={analysis}
            selections={selections}
            onChange={setSelections}
          />
        )}

        {activeTab === "sections" && (
          <SectionsMergeSection
            analysis={analysis}
            selections={selections}
            onChange={setSelections}
            allEntities={allEntities}
          />
        )}

        {activeTab === "evidence" && (
          <ProofsSection
            proofs={analysis.proofs}
            selections={selections}
            onChange={setSelections}
            bulkActions={{
              onKeepPrimary: () => applyProofBulk("primary"),
              onKeepDuplicate: () => applyProofBulk("secondary"),
              onKeepAll: () => applyProofBulk("all"),
            }}
          />
        )}

        {activeTab === "media" && (
          <>
            <ItemKeepTable
              title="Gallery"
              items={analysis.gallery}
              paired
              checked={(id) => selections.gallery[id] !== false}
              onToggle={(id, v) =>
                setSelections((s) => ({
                  ...s,
                  gallery: { ...s.gallery, [id]: v },
                }))
              }
              bulkActions={{
                onKeepPrimary: () =>
                  applyItemBulk("gallery", "primary", analysis.gallery),
                onKeepDuplicate: () =>
                  applyItemBulk("gallery", "secondary", analysis.gallery),
                onKeepAll: () =>
                  applyItemBulk("gallery", "all", analysis.gallery),
              }}
            />
            <ItemKeepTable
              title="Attachments"
              items={analysis.attachments}
              paired
              checked={(id) => selections.attachments[id] !== false}
              onToggle={(id, v) =>
                setSelections((s) => ({
                  ...s,
                  attachments: { ...s.attachments, [id]: v },
                }))
              }
              bulkActions={{
                onKeepPrimary: () =>
                  applyItemBulk("attachments", "primary", analysis.attachments),
                onKeepDuplicate: () =>
                  applyItemBulk(
                    "attachments",
                    "secondary",
                    analysis.attachments,
                  ),
                onKeepAll: () =>
                  applyItemBulk("attachments", "all", analysis.attachments),
              }}
            />
          </>
        )}

        {activeTab === "timeline" && (
          <>
            <ItemKeepTable
              title="Timeline events"
              items={analysis.events}
              paired
              checked={(id) => selections.events[id] !== false}
              onToggle={(id, v) =>
                setSelections((s) => ({
                  ...s,
                  events: { ...s.events, [id]: v },
                }))
              }
              bulkActions={{
                onKeepPrimary: () =>
                  applyItemBulk("events", "primary", analysis.events),
                onKeepDuplicate: () =>
                  applyItemBulk("events", "secondary", analysis.events),
                onKeepAll: () => applyItemBulk("events", "all", analysis.events),
              }}
            />
            <ItemKeepTable
              title="Context entries"
              items={analysis.contextEntries}
              paired
              checked={(id) => selections.contextEntries[id] !== false}
              onToggle={(id, v) =>
                setSelections((s) => ({
                  ...s,
                  contextEntries: { ...s.contextEntries, [id]: v },
                }))
              }
              bulkActions={{
                onKeepPrimary: () =>
                  applyItemBulk(
                    "contextEntries",
                    "primary",
                    analysis.contextEntries,
                  ),
                onKeepDuplicate: () =>
                  applyItemBulk(
                    "contextEntries",
                    "secondary",
                    analysis.contextEntries,
                  ),
                onKeepAll: () =>
                  applyItemBulk(
                    "contextEntries",
                    "all",
                    analysis.contextEntries,
                  ),
              }}
            />
            <ItemKeepTable
              title="Investigation notes"
              items={analysis.noteEntries}
              paired
              checked={(id) => selections.noteEntries[id] !== false}
              onToggle={(id, v) =>
                setSelections((s) => ({
                  ...s,
                  noteEntries: { ...s.noteEntries, [id]: v },
                }))
              }
              bulkActions={{
                onKeepPrimary: () =>
                  applyItemBulk(
                    "noteEntries",
                    "primary",
                    analysis.noteEntries,
                  ),
                onKeepDuplicate: () =>
                  applyItemBulk(
                    "noteEntries",
                    "secondary",
                    analysis.noteEntries,
                  ),
                onKeepAll: () =>
                  applyItemBulk("noteEntries", "all", analysis.noteEntries),
              }}
            />
          </>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800/80 pt-4">
          <Button onClick={merge} disabled={loading} variant="secondary">
            {loading ? "Merging…" : "Merge duplicate into primary"}
          </Button>
          <p className="text-xs text-zinc-500">
            {tabCounts.evidence} evidence · {tabCounts.timeline} timeline/notes
            · {tabCounts.media} media items
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
