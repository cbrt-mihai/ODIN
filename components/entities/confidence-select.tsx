"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortedConfidenceTypes } from "@/lib/confidence";
import type { ConfidenceTypeDefinition } from "@/lib/types";

export function ConfidenceSelect({
  label = "Confirmation",
  value,
  onChange,
  confidenceTypes,
  className,
  hideLabel,
}: {
  label?: string;
  value?: string;
  onChange: (id: string) => void;
  confidenceTypes: ConfidenceTypeDefinition[];
  className?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className={className}>
      {!hideLabel && (
        <Label className="text-xs text-zinc-500">{label}</Label>
      )}
      <Select value={value ?? "unsure"} onValueChange={onChange}>
        <SelectTrigger className={hideLabel ? "h-7 text-xs" : "h-8 text-xs"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortedConfidenceTypes(confidenceTypes).map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
