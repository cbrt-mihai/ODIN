"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { ReadonlyFieldValue } from "@/components/entities/readonly-field-value";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import { DatesFieldEditor } from "@/components/entities/dates-field-editor";
import {
  FieldValueValidityEditor,
  fieldValueUsesDateRangeData,
} from "@/components/entities/field-value-validity";
import { LocationFieldEditor } from "@/components/entities/location-field-editor";
import {
  effectiveValueFlavor,
  stringValue,
} from "@/lib/field-value-display";
import {
  isMarkdownFlavor,
  MARKDOWN_EDITOR_PLACEHOLDER,
} from "@/lib/markdown/flavor";
import type {
  Case,
  ConfidenceTypeDefinition,
  DateRangeValue,
  DatesValue,
  Entity,
  Field,
  FieldTypeId,
  LocationValue,
} from "@/lib/types";

function FlavoredStringEditor({
  field,
  value,
  onChange,
  multiline,
  inputType = "text",
  entities = [],
  cases = [],
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  inputType?: string;
  entities?: Entity[];
  cases?: Case[];
}) {
  const flavor = effectiveValueFlavor(field);
  if (isMarkdownFlavor(flavor)) {
    return (
      <MarkdownFieldEditor
        value={value}
        onChange={onChange}
        flavor="obsidian"
        entities={entities}
        cases={cases}
        placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
        minRows={multiline ? 6 : 4}
        showPreview={multiline}
      />
    );
  }
  return (
    <Input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

interface FieldRendererProps {
  field: Field;
  entities: Entity[];
  cases?: Case[];
  onChange: (field: Field) => void;
  readOnly?: boolean;
  confidenceTypes?: ConfidenceTypeDefinition[];
}

function wrapFieldValue(
  field: Field,
  onChange: (field: Field) => void,
  confidenceTypes: ConfidenceTypeDefinition[],
  input: ReactNode,
) {
  return (
    <div className="space-y-3">
      {input}
      <FieldValueValidityEditor
        field={field}
        onChange={onChange}
        confidenceTypes={confidenceTypes}
      />
    </div>
  );
}

export function FieldRenderer({
  field,
  entities,
  cases = [],
  onChange,
  readOnly,
  confidenceTypes = [],
}: FieldRendererProps) {
  const data = field.value.data;

  function updateData(next: unknown) {
    onChange({
      ...field,
      value: { ...field.value, type: field.type, data: next },
    });
  }

  if (readOnly) {
    return (
      <ReadonlyFieldValue
        field={field}
        entities={entities}
        confidenceTypes={confidenceTypes}
      />
    );
  }

  const renderInput = (): ReactNode => {
    switch (field.type as FieldTypeId) {
      case "shortText":
      case "url":
      case "email":
      case "phone":
        return (
          <FlavoredStringEditor
            field={field}
            value={(data as string) ?? ""}
            onChange={updateData}
            inputType={field.type === "url" ? "url" : "text"}
            entities={entities}
            cases={cases}
          />
        );
      case "longText":
        return (
          <FlavoredStringEditor
            field={field}
            value={(data as string) ?? ""}
            onChange={updateData}
            multiline
            entities={entities}
            cases={cases}
          />
        );
      case "richMarkdown":
      case "obsidianMarkdown":
        return (
          <MarkdownFieldEditor
            value={(data as string) ?? ""}
            onChange={(v) => updateData(v)}
            flavor="obsidian"
            entities={entities}
            cases={cases}
            placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
          />
        );
      case "number": {
        const flavor = effectiveValueFlavor(field);
        if (flavor !== "plain") {
          return (
            <FlavoredStringEditor
              field={field}
              value={stringValue(data)}
              onChange={(v) => {
                const n = Number(v);
                updateData(Number.isNaN(n) ? v : n);
              }}
              multiline
              entities={entities}
              cases={cases}
            />
          );
        }
        return (
          <Input
            type="number"
            value={(data as number) ?? 0}
            onChange={(e) => updateData(Number(e.target.value))}
          />
        );
      }
      case "date":
      case "datetime":
        return (
          <DateRangesFieldEditor
            value={migrateDateRangesValue(data)}
            onChange={(v) => updateData(v)}
            confidenceTypes={confidenceTypes}
            useDateTime={field.type === "datetime"}
            addLabel="Add date"
          />
        );
      case "dateRange":
        return (
          <DateRangesFieldEditor
            value={migrateDateRangesValue(data)}
            onChange={(v) => updateData(v)}
            confidenceTypes={confidenceTypes}
          />
        );
      case "dates":
        return (
          <DatesFieldEditor
            value={(data as DatesValue) ?? { entries: [] }}
            onChange={(v) => updateData(v)}
            confidenceTypes={confidenceTypes}
          />
        );
      case "location":
        return (
          <LocationFieldEditor
            value={(data as LocationValue) ?? {}}
            onChange={(v) => updateData(v)}
          />
        );
      case "boolean":
        return (
          <input
            type="checkbox"
            checked={Boolean(data)}
            onChange={(e) => updateData(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600"
          />
        );
      case "dropdown":
        return (
          <Select
            value={(data as string) || undefined}
            onValueChange={(v) => updateData(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {(field.typeConfig?.options ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checklist": {
        const selected = (data as string[]) ?? [];
        return (
          <div className="space-y-2">
            {(field.typeConfig?.options ?? []).map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((id) => id !== o.id);
                    updateData(next);
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        );
      }
      case "tags": {
        const tags = (data as string[]) ?? [];
        return (
          <Input
            value={tags.join(", ")}
            onChange={(e) =>
              updateData(
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Comma-separated tags"
          />
        );
      }
      case "entityLink": {
        const link = (data as { entityId: string; entityType?: string }) ?? {
          entityId: "",
        };
        return (
          <Select
            value={link.entityId || undefined}
            onValueChange={(entityId) => {
              const ent = entities.find((x) => x.id === entityId);
              updateData({
                entityId,
                entityType: ent?.type,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity…" />
            </SelectTrigger>
            <SelectContent>
              {entities.map((ent) => (
                <SelectItem key={ent.id} value={ent.id}>
                  [{ent.type}] {ent.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "image":
        return (
          <Input
            type="url"
            value={
              ((data as { url?: string })?.url as string) ??
              (data as string) ??
              ""
            }
            onChange={(e) =>
              updateData({ source: "url", url: e.target.value })
            }
            placeholder="Image URL"
          />
        );
      default:
        return (
          <FlavoredStringEditor
            field={field}
            value={stringValue(data)}
            onChange={(v) => updateData(v)}
            multiline
          />
        );
    }
  };

  const input = renderInput();
  if (fieldValueUsesDateRangeData(field.type)) {
    return input;
  }
  return wrapFieldValue(field, onChange, confidenceTypes, input);
}
