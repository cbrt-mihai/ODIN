import { CONTEXT_ENTRY_KINDS, NOTE_ENTRY_KINDS } from "@/lib/types/entries";
import { fieldDisplayValue } from "@/lib/reports/shared";
import type { Entity, Field, Section } from "@/lib/types";

export function sortSectionsFields(sections: Section[]): Section[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((sec) => ({
      ...sec,
      fields: [...sec.fields].sort((a, b) => a.order - b.order),
    }));
}

export function resolveEntityLinkName(
  field: Field,
  allEntities: Entity[],
): string {
  if (field.type !== "entityLink") {
    return fieldDisplayValue(field);
  }
  const data = field.value.data as
    | { entityId?: string; label?: string }
    | undefined;
  if (data?.label?.trim()) return data.label.trim();
  const ent = allEntities.find((e) => e.id === data?.entityId);
  return ent?.displayName ?? data?.entityId ?? "—";
}

export function resolveFieldDisplayValue(
  field: Field,
  allEntities: Entity[],
): string {
  if (field.type === "entityLink") {
    return resolveEntityLinkName(field, allEntities);
  }
  return fieldDisplayValue(field);
}

export function contextEntryKindLabel(kind: string) {
  return CONTEXT_ENTRY_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

export function noteEntryKindLabel(kind: string) {
  return NOTE_ENTRY_KINDS.find((k) => k.id === kind)?.label ?? kind;
}
