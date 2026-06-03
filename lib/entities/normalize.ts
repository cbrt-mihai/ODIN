import {
  migrateFieldValueData,
  normalizeStoredValidity,
} from "@/lib/date-range/migrate";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import { defaultProvenance, normalizeProvenance } from "@/lib/proof/helpers";
import type { Entity, Field } from "@/lib/types";

export function normalizeField(field: Field): Field {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(field);
  return {
    ...field,
    contextEntries,
    noteEntries,
    value: {
      ...field.value,
      data: migrateFieldValueData(field.type, field.value.data),
      validity: normalizeStoredValidity(field.value.validity),
    },
    provenance: normalizeProvenance(field.provenance),
  };
}

export function normalizeEntity(entity: Entity): Entity {
  const { contextEntries, noteEntries } = migrateAnnotationsToLists(entity);
  return {
    ...entity,
    contextEntries,
    noteEntries,
    provenance: normalizeProvenance(entity.provenance),
    sections: entity.sections.map((s) => ({
      ...s,
      fields: s.fields.map(normalizeField),
    })),
    gallery: (entity.gallery ?? []).map((g) => {
      const migrated = migrateAnnotationsToLists(g);
      return {
        ...g,
        ...migrated,
        validity: normalizeStoredValidity(g.validity),
        provenance: g.provenance
          ? normalizeProvenance(g.provenance)
          : undefined,
      };
    }),
    attachments: (entity.attachments ?? []).map((a) => {
      const migrated = migrateAnnotationsToLists(a);
      return {
        ...a,
        ...migrated,
        validity: normalizeStoredValidity(a.validity),
        provenance: a.provenance
          ? normalizeProvenance(a.provenance)
          : undefined,
      };
    }),
  };
}

export function defaultEntityRecord() {
  return {
    contextEntries: [] as Entity["contextEntries"],
    noteEntries: [] as Entity["noteEntries"],
    provenance: defaultProvenance(),
  };
}
