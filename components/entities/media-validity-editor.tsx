"use client";

import { Label } from "@/components/ui/label";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { DateRangesReadonly } from "@/components/entities/date-range-confidence-readonly";
import { isEmptyDateRanges } from "@/lib/date-range/format";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import type {
  Attachment,
  ConfidenceTypeDefinition,
  DateRangesValue,
  GalleryImage,
} from "@/lib/types";

type MediaItem = GalleryImage | Attachment;

export function MediaValidityEditor({
  item,
  onChange,
  confidenceTypes,
  readOnly,
}: {
  item: MediaItem;
  onChange: (item: MediaItem) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  readOnly?: boolean;
}) {
  const ranges = migrateDateRangesValue(item.validity);

  if (readOnly) {
    if (isEmptyDateRanges(ranges)) return null;
    return (
      <DateRangesReadonly
        ranges={ranges.entries}
        confidenceTypes={confidenceTypes}
        labelAfterCertainty="Valid period"
      />
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-zinc-700/80 bg-zinc-950/40 p-3">
      <Label className="text-xs text-zinc-500">
        Valid period (when this applies)
      </Label>
      <DateRangesFieldEditor
        value={ranges}
        onChange={(validity: DateRangesValue) =>
          onChange({ ...item, validity })
        }
        confidenceTypes={confidenceTypes}
      />
    </div>
  );
}
