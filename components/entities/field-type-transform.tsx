"use client";

import { ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFieldTransformTargets,
  transformFieldType,
} from "@/lib/entities/field-transform";
import type { Field, FieldTypeDefinition, FieldTypeId } from "@/lib/types";

export function FieldTypeTransform({
  field,
  fieldTypes,
  onTransform,
}: {
  field: Field;
  fieldTypes: FieldTypeDefinition[];
  onTransform: (field: Field) => void;
}) {
  const targets = getFieldTransformTargets(field.type, fieldTypes);
  const current = fieldTypes.find((f) => f.id === field.type);

  if (targets.length === 0) return null;

  return (
    <Select
      value={field.type}
      onValueChange={(next) => {
        if (next === field.type) return;
        onTransform(
          transformFieldType(field, next as FieldTypeId, fieldTypes),
        );
      }}
    >
      <SelectTrigger
        className="h-8 w-[8.5rem] shrink-0 gap-1 text-xs"
        title="Transform field type"
      >
        <ArrowRightLeft className="h-3 w-3 shrink-0 text-zinc-500" />
        <SelectValue placeholder={current?.label ?? field.type} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={field.type} disabled>
          {current?.label ?? field.type} (current)
        </SelectItem>
        {targets.map((ft) => (
          <SelectItem key={ft.id} value={ft.id}>
            {ft.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
