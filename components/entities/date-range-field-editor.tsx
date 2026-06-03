"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateBoundEditor } from "@/components/entities/date-bound-editor";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import type { DateRangeValue, ConfidenceTypeDefinition } from "@/lib/types";

export function DateRangeFieldEditor({
  value,
  onChange,
  confidenceTypes,
  useDateTime = false,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  /** Use datetime-local inputs for known bounds (datetime fields). */
  useDateTime?: boolean;
}) {
  const showMiddle =
    value.start.kind === "unknown" && value.end.kind === "unknown";

  const rangeLabelValue = showMiddle ? (value.label ?? "") : (value.label ?? "");

  function setRangeLabel(next: string) {
    const label = next.trim() || undefined;
    onChange({
      ...value,
      label,
    });
  }

  function setKnownMiddle(
    patch: Partial<NonNullable<DateRangeValue["knownMiddle"]>>,
  ) {
    onChange({
      ...value,
      knownMiddle: {
        value: value.knownMiddle?.value ?? "",
        ...value.knownMiddle,
        ...patch,
      },
    });
  }

  return (
    <div className="space-y-3">
      {!showMiddle && (
        <div>
          <Label className="text-xs text-zinc-500">Label</Label>
          <Input
            className="h-8 text-sm"
            value={rangeLabelValue}
            onChange={(e) => setRangeLabel(e.target.value)}
            placeholder="e.g. Employment at Acme, investigation window"
          />
        </div>
      )}
      <DateBoundEditor
        label="Start"
        bound={value.start}
        onChange={(start) => onChange({ ...value, start })}
        confidenceTypes={confidenceTypes}
        useDateTime={useDateTime}
      />
      <DateBoundEditor
        label="End"
        bound={value.end}
        onChange={(end) => onChange({ ...value, end })}
        confidenceTypes={confidenceTypes}
        useDateTime={useDateTime}
      />
      {showMiddle && (
        <div className="space-y-2 rounded-md border border-dashed border-zinc-700 p-3">
          <p className="text-xs font-medium text-zinc-400">
            Known middle (both ends unknown)
          </p>
          <div>
            <Label className="text-xs text-zinc-500">Period label (optional)</Label>
            <Input
              className="h-8 text-sm"
              value={value.label ?? ""}
              onChange={(e) => setRangeLabel(e.target.value)}
              placeholder="e.g. Peak activity, investigation window"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-500">Text before date</Label>
            <Input
              className="h-8 text-sm"
              value={
                value.knownMiddle?.prefix ?? value.knownMiddle?.label ?? ""
              }
              onChange={(e) =>
                setKnownMiddle({
                  prefix: e.target.value || undefined,
                  label: undefined,
                })
              }
              placeholder="Around"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-zinc-500">Date</Label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={value.knownMiddle?.value?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setKnownMiddle({
                    value: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>
            <ConfidenceSelect
              value={value.knownMiddle?.confidence}
              onChange={(confidence) => setKnownMiddle({ confidence })}
              confidenceTypes={confidenceTypes}
            />
          </div>
        </div>
      )}
      <div>
        <Label className="text-xs text-zinc-500">Notes</Label>
        <Textarea
          rows={2}
          value={value.notes ?? ""}
          onChange={(e) =>
            onChange({ ...value, notes: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}
