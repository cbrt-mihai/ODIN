"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DateRangeFieldEditor } from "@/components/entities/date-range-field-editor";
import {
  migrateDateRangesValue,
} from "@/lib/date-range/migrate";
import {
  defaultDateRangeValue,
  type ConfidenceTypeDefinition,
  type DateRangesValue,
} from "@/lib/types";

export function DateRangesFieldEditor({
  value,
  onChange,
  confidenceTypes,
  useDateTime = false,
  addLabel = "Add period",
}: {
  value: DateRangesValue;
  onChange: (value: DateRangesValue) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  useDateTime?: boolean;
  addLabel?: string;
}) {
  const confirmDialog = useConfirm();
  const ranges = migrateDateRangesValue(value);

  function setEntries(entries: typeof ranges.entries) {
    onChange({ entries });
  }

  function updateEntry(index: number, next: (typeof ranges.entries)[number]) {
    setEntries(ranges.entries.map((e, i) => (i === index ? next : e)));
  }

  function addEntry() {
    setEntries([...ranges.entries, defaultDateRangeValue()]);
  }

  async function removeEntry(index: number) {
    const ok = await confirmDialog({
      title: "Remove period",
      description: "Remove this date period?",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setEntries(ranges.entries.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {ranges.entries.length === 0 && (
        <p className="text-sm text-zinc-500">No periods yet.</p>
      )}
      {ranges.entries.map((range, index) => (
        <div
          key={`${index}-${range.start.kind}-${range.end.kind}`}
          className="space-y-2 rounded-md border border-zinc-800 p-3"
        >
          {ranges.entries.length > 1 && (
            <p className="text-xs font-medium text-zinc-500">
              Period {index + 1}
            </p>
          )}
          <DateRangeFieldEditor
            value={range}
            onChange={(next) => updateEntry(index, next)}
            confidenceTypes={confidenceTypes}
            useDateTime={useDateTime}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeEntry(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
