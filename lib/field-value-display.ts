import type { Field, FieldTypeId, TextFlavor } from "@/lib/types";

const NATIVE_MD: FieldTypeId[] = ["richMarkdown", "obsidianMarkdown"];

export function effectiveValueFlavor(field: Field): TextFlavor {
  if (NATIVE_MD.includes(field.type)) {
    return "markdown";
  }
  const v = field.valueFlavor ?? "plain";
  return v === "obsidian" ? "markdown" : v;
}

export function supportsValueFlavor(field: Field): boolean {
  return !NATIVE_MD.includes(field.type);
}

export function stringValue(data: unknown): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
