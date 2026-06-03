import type { Entity } from "@/lib/types";

export function collectFieldValues(
  entity: Entity,
  type: "email" | "phone",
): string[] {
  const vals: string[] = [];
  for (const s of entity.sections) {
    for (const f of s.fields) {
      if (f.type === type && typeof f.value.data === "string") {
        const v = f.value.data.trim().toLowerCase();
        if (v) vals.push(v);
      }
    }
  }
  return vals;
}
