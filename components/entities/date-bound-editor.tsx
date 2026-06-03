"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import { DATE_BOUND_KINDS } from "@/lib/date-range/format";
import type { DateBound, ConfidenceTypeDefinition } from "@/lib/types";

export function DateBoundEditor({
  label,
  bound,
  onChange,
  confidenceTypes,
  showConfidence = true,
  useDateTime = false,
}: {
  label: string;
  bound: DateBound;
  onChange: (bound: DateBound) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  showConfidence?: boolean;
  useDateTime?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-md border border-zinc-800 p-3">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-zinc-500">Bound</Label>
          <Select
            value={bound.kind}
            onValueChange={(kind) =>
              onChange({
                ...bound,
                kind: kind as DateBound["kind"],
                value: kind === "known" ? bound.value ?? "" : undefined,
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_BOUND_KINDS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {bound.kind === "known" && (
          <>
            <div>
              <Label className="text-xs text-zinc-500">Date</Label>
              <Input
                type={useDateTime ? "datetime-local" : "date"}
                className="h-8 text-sm"
                value={
                  useDateTime
                    ? (bound.value?.slice(0, 16) ?? "")
                    : (bound.value?.slice(0, 10) ?? "")
                }
                onChange={(e) =>
                  onChange({
                    ...bound,
                    value: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Precision</Label>
              <Select
                value={bound.precision ?? "day"}
                onValueChange={(precision) =>
                  onChange({
                    ...bound,
                    precision: precision as DateBound["precision"],
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {showConfidence && (
          <ConfidenceSelect
            value={bound.confidence}
            onChange={(confidence) => onChange({ ...bound, confidence })}
            confidenceTypes={confidenceTypes}
          />
        )}
      </div>
    </div>
  );
}
