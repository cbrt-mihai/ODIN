"use client";

import { Label } from "@/components/ui/label";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { formatProvenanceValidity } from "@/lib/date-range/format";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import { fieldValueUsesDateRangeData } from "@/lib/date-range/migrate";
import type { ConfidenceTypeDefinition, Field } from "@/lib/types";

export { fieldValueUsesDateRangeData };

export function FieldValueValidityEditor({
  field,
  onChange,
  confidenceTypes,
}: {
  field: Field;
  onChange: (field: Field) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  if (fieldValueUsesDateRangeData(field.type)) return null;

  return (
    <div className="space-y-2 rounded-md border border-dashed border-zinc-700/80 bg-zinc-950/40 p-3">
      <Label className="text-xs text-zinc-500">
        Valid period (when this value was true)
      </Label>
      <DateRangesFieldEditor
        value={migrateDateRangesValue(field.value.validity)}
        onChange={(validity) =>
          onChange({
            ...field,
            value: { ...field.value, validity },
          })
        }
        confidenceTypes={confidenceTypes}
        useDateTime={field.type === "datetime"}
      />
    </div>
  );
}

export function FieldValueValidityReadonly({ field }: { field: Field }) {
  if (fieldValueUsesDateRangeData(field.type)) return null;
  const text = formatProvenanceValidity(field.value.validity);
  if (!text) return null;
  return (
    <p className="mt-2 text-xs text-zinc-500">
      <span className="font-medium text-zinc-400">Valid period: </span>
      {text}
    </p>
  );
}
