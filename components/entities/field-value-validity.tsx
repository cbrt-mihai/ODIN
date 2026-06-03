"use client";

import { Label } from "@/components/ui/label";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { DateRangesReadonly } from "@/components/entities/date-range-confidence-readonly";
import { isEmptyDateRanges } from "@/lib/date-range/format";
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

export function FieldValueValidityReadonly({
  field,
  confidenceTypes = [],
}: {
  field: Field;
  confidenceTypes?: ConfidenceTypeDefinition[];
}) {
  if (fieldValueUsesDateRangeData(field.type)) return null;
  const ranges = migrateDateRangesValue(field.value.validity);
  if (isEmptyDateRanges(ranges)) return null;
  return (
    <div className="mt-2 space-y-2 text-xs">
      <DateRangesReadonly
        ranges={ranges.entries}
        confidenceTypes={confidenceTypes}
        labelAfterCertainty="Valid period"
      />
    </div>
  );
}
