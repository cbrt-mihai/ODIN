"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeTextFlavor } from "@/lib/markdown/flavor";
import { TEXT_FLAVORS, type TextFlavor } from "@/lib/types";

export function FlavorSelect({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value?: TextFlavor;
  onChange: (v: TextFlavor) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Select
        value={normalizeTextFlavor(value)}
        onValueChange={(v) => onChange(v as TextFlavor)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TEXT_FLAVORS.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
