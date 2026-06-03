"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LocationValue } from "@/lib/types";

export function LocationFieldEditor({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label className="text-xs text-zinc-500">Label</Label>
        <Input
          value={value.label ?? ""}
          onChange={(e) =>
            onChange({ ...value, label: e.target.value || undefined })
          }
          placeholder="e.g. Headquarters"
        />
      </div>
      <div className="sm:col-span-2">
        <Label className="text-xs text-zinc-500">Address</Label>
        <Input
          value={value.address ?? ""}
          onChange={(e) =>
            onChange({ ...value, address: e.target.value || undefined })
          }
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-500">Latitude</Label>
        <Input
          type="number"
          step="any"
          value={value.lat ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              lat: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-500">Longitude</Label>
        <Input
          type="number"
          step="any"
          value={value.lng ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              lng: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label className="text-xs text-zinc-500">Place ID</Label>
        <Input
          value={value.placeId ?? ""}
          onChange={(e) =>
            onChange({ ...value, placeId: e.target.value || undefined })
          }
          placeholder="Optional external place reference"
        />
      </div>
      <div className="sm:col-span-2">
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
