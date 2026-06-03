import { formatDateRanges } from "@/lib/date-range/format";
import { migrateFieldValueData } from "@/lib/date-range/migrate";
import { createEmptyField } from "@/lib/entities/helpers";
import {
  stringValue,
  supportsValueFlavor,
} from "@/lib/field-value-display";
import type {
  Field,
  FieldTypeDefinition,
  FieldTypeId,
} from "@/lib/types";

/** Types that share a single string value and can be converted between each other. */
export const STRING_COMPATIBLE_FIELD_TYPES: FieldTypeId[] = [
  "shortText",
  "longText",
  "url",
  "email",
  "phone",
  "richMarkdown",
  "obsidianMarkdown",
];

function extractStringValue(data: unknown, fromType: FieldTypeId): string {
  if (fromType === "image") {
    const img = data as { url?: string } | null;
    return img?.url?.trim() ?? "";
  }
  if (fromType === "tags" || fromType === "checklist") {
    return Array.isArray(data) ? data.map(String).join(", ") : "";
  }
  if (fromType === "boolean") {
    return data ? "true" : "";
  }
  if (fromType === "date" || fromType === "datetime" || fromType === "dateRange") {
    const migrated = migrateFieldValueData(fromType, data);
    if (
      migrated &&
      typeof migrated === "object" &&
      "entries" in migrated
    ) {
      return formatDateRanges(migrated as import("@/lib/types").DateRangesValue);
    }
    return typeof data === "string" ? data : "";
  }
  return stringValue(data);
}

function coerceValue(
  data: unknown,
  fromType: FieldTypeId,
  toType: FieldTypeId,
): unknown {
  const text = extractStringValue(data, fromType);

  switch (toType) {
    case "shortText":
    case "longText":
    case "url":
    case "email":
    case "phone":
    case "richMarkdown":
    case "obsidianMarkdown":
      return text;
    case "number": {
      const n = Number(text.trim());
      return Number.isFinite(n) ? n : 0;
    }
    default:
      return createEmptyField(toType, "").value.data;
  }
}

export function canTransformFieldType(
  from: FieldTypeId,
  to: FieldTypeId,
): boolean {
  if (from === to) return false;
  if (
    STRING_COMPATIBLE_FIELD_TYPES.includes(from) &&
    STRING_COMPATIBLE_FIELD_TYPES.includes(to)
  ) {
    return true;
  }
  if (from === "number" && STRING_COMPATIBLE_FIELD_TYPES.includes(to)) {
    return true;
  }
  if (STRING_COMPATIBLE_FIELD_TYPES.includes(from) && to === "number") {
    return true;
  }
  return false;
}

export function getFieldTransformTargets(
  from: FieldTypeId,
  fieldTypes: FieldTypeDefinition[],
): FieldTypeDefinition[] {
  return fieldTypes
    .filter((ft) => ft.enabled && canTransformFieldType(from, ft.id))
    .sort((a, b) => a.order - b.order);
}

export function transformFieldType(
  field: Field,
  targetType: FieldTypeId,
  fieldTypes: FieldTypeDefinition[],
): Field {
  if (!canTransformFieldType(field.type, targetType)) {
    throw new Error(`Cannot transform ${field.type} into ${targetType}`);
  }

  const data = coerceValue(field.value.data, field.type, targetType);
  const def = fieldTypes.find((f) => f.id === targetType);

  let typeConfig: Field["typeConfig"];
  if (targetType === "dropdown" || targetType === "checklist") {
    typeConfig = def?.defaultTypeConfig ?? field.typeConfig;
  } else {
    typeConfig = undefined;
  }

  const valueFlavor = supportsValueFlavor({ ...field, type: targetType })
    ? field.valueFlavor
    : undefined;

  return {
    ...field,
    type: targetType,
    typeConfig,
    value: { type: targetType, data },
    valueFlavor,
  };
}
