"use client";

import { v4 as uuidv4 } from "uuid";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DateRangeFieldEditor } from "@/components/entities/date-range-field-editor";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import { EntryAnnotationsPanel } from "@/components/entities/entry-annotations";
import { migrateDateEntry } from "@/lib/date-range/migrate";
import {
  defaultDateRangeValue,
  type DateEntry,
  type DatesValue,
  type ConfidenceTypeDefinition,
} from "@/lib/types";

export function DatesFieldEditor({
  value,
  onChange,
  confidenceTypes,
}: {
  value: DatesValue;
  onChange: (value: DatesValue) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const confirmDialog = useConfirm();

  function updateEntry(id: string, patch: Partial<DateEntry>) {
    onChange({
      entries: value.entries.map((e) =>
        e.id === id ? migrateDateEntry({ ...migrateDateEntry(e), ...patch }) : migrateDateEntry(e),
      ),
    });
  }

  function addEntry() {
    onChange({
      entries: [
        ...value.entries,
        migrateDateEntry({
          id: uuidv4(),
          validity: defaultDateRangeValue(),
          tags: [],
        }),
      ],
    });
  }

  async function removeEntry(id: string) {
    const ok = await confirmDialog({
      title: "Remove date",
      description: "Remove this date entry?",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    onChange({ entries: value.entries.filter((e) => e.id !== id) });
  }

  return (
    <div className="space-y-3">
      {value.entries.length === 0 && (
        <p className="text-sm text-zinc-500">No dates yet.</p>
      )}
      {value.entries.map((raw) => {
        const entry = migrateDateEntry(raw);
        return (
          <div
            key={entry.id}
            className="space-y-3 rounded-md border border-zinc-800 p-3"
          >
            <DateRangeFieldEditor
              value={entry.validity}
              onChange={(validity) => updateEntry(entry.id, { validity })}
              confidenceTypes={confidenceTypes}
            />
            <ConfidenceSelect
              value={entry.confidence}
              onChange={(confidence) => updateEntry(entry.id, { confidence })}
              confidenceTypes={confidenceTypes}
            />
            <EntryAnnotationsPanel
              value={{
                description: entry.description,
                descriptionFlavor: entry.descriptionFlavor,
                tags: entry.tags,
                notes: entry.notes,
                notesFlavor: entry.notesFlavor,
              }}
              onChange={(ann) => updateEntry(entry.id, ann)}
              compact
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="h-4 w-4" />
        Add date period
      </Button>
    </div>
  );
}
