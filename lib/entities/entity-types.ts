import type { Entity, EntityType, EntityTypeDefinition, Settings } from "@/lib/types";

/** Slug pattern for entity type ids (also used in entity references). */
export const ENTITY_TYPE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export const BUILTIN_ENTITY_TYPES = [
  "person",
  "organization",
  "domain",
  "general",
  "email",
  "phone",
] as const satisfies readonly EntityType[];

/** Builtins added after initial release — merged into existing settings once. */
const MIGRATION_BUILTIN_TYPES = new Set<EntityType>(["email", "phone"]);

export const DEFAULT_ENTITY_TYPE_DEFINITIONS: EntityTypeDefinition[] = [
  {
    id: "person",
    label: "Person",
    enabled: true,
    order: 0,
    color: "#3b82f6",
  },
  {
    id: "organization",
    label: "Organization",
    enabled: true,
    order: 1,
    color: "#a855f7",
  },
  {
    id: "domain",
    label: "Domain",
    enabled: true,
    order: 2,
    color: "#10b981",
  },
  {
    id: "general",
    label: "General",
    enabled: true,
    order: 3,
    color: "#71717a",
  },
  {
    id: "email",
    label: "Email",
    enabled: false,
    order: 4,
    color: "#f472b6",
  },
  {
    id: "phone",
    label: "Phone",
    enabled: false,
    order: 5,
    color: "#38bdf8",
  },
];

const KNOWN_COLORS: Record<string, string> = {
  person: "#3b82f6",
  organization: "#a855f7",
  domain: "#10b981",
  general: "#71717a",
  email: "#f472b6",
  phone: "#38bdf8",
};

const COLOR_PALETTE = [
  "#3b82f6",
  "#a855f7",
  "#10b981",
  "#f472b6",
  "#38bdf8",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

export function isValidEntityTypeId(id: string): boolean {
  return ENTITY_TYPE_ID_PATTERN.test(id);
}

/** @deprecated Use isValidEntityTypeId — kept for graph URL parsing compatibility */
export function isEntityType(value: string): value is EntityType {
  return isValidEntityTypeId(value);
}

export function slugFromEntityTypeLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!base) return "custom_type";
  return ENTITY_TYPE_ID_PATTERN.test(base) ? base : `type_${base}`.slice(0, 48);
}

export function humanizeEntityTypeId(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function hashEntityTypeColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(h) % COLOR_PALETTE.length]!;
}

export function sortedEntityTypeDefinitions(
  definitions: EntityTypeDefinition[],
): EntityTypeDefinition[] {
  return [...definitions].sort((a, b) => a.order - b.order);
}

/** Load settings entity types; empty file → full defaults. Stored list is authoritative (removals stick). */
export function mergeEntityTypeDefinitions(
  stored?: EntityTypeDefinition[],
): EntityTypeDefinition[] {
  if (!stored?.length) {
    return sortedEntityTypeDefinitions([...DEFAULT_ENTITY_TYPE_DEFINITIONS]);
  }

  const validStored = stored.filter((d) => isValidEntityTypeId(d.id));
  const storedIds = new Set(validStored.map((d) => d.id));

  const migrated = DEFAULT_ENTITY_TYPE_DEFINITIONS.filter(
    (def) => MIGRATION_BUILTIN_TYPES.has(def.id) && !storedIds.has(def.id),
  );

  return sortedEntityTypeDefinitions([...validStored, ...migrated]);
}

export function retiredEntityTypeDefinition(id: string): EntityTypeDefinition {
  return {
    id,
    label: humanizeEntityTypeId(id),
    enabled: false,
    order: 9000 + (hashEntityTypeColor(id).length % 100),
    color: hashEntityTypeColor(id),
    retired: true,
  };
}

/** Include types used by existing entities that are no longer in settings. */
export function augmentEntityTypesWithInUse(
  definitions: EntityTypeDefinition[],
  typesInUse: Iterable<string>,
): EntityTypeDefinition[] {
  const byId = new Map(definitions.map((d) => [d.id, d]));
  const extra: EntityTypeDefinition[] = [];
  for (const id of typesInUse) {
    if (!id || byId.has(id)) continue;
    if (!isValidEntityTypeId(id)) continue;
    extra.push(retiredEntityTypeDefinition(id));
  }
  if (extra.length === 0) return sortedEntityTypeDefinitions(definitions);
  return sortedEntityTypeDefinitions([...definitions, ...extra]);
}

export function augmentEntityTypesForEntities(
  definitions: EntityTypeDefinition[],
  entities: Pick<Entity, "type">[],
): EntityTypeDefinition[] {
  return augmentEntityTypesWithInUse(
    definitions,
    entities.map((e) => e.type),
  );
}

export function enabledEntityTypes(
  settings: Pick<Settings, "entityTypes">,
): EntityType[] {
  return sortedEntityTypeDefinitions(settings.entityTypes)
    .filter((d) => d.enabled && !d.retired)
    .map((d) => d.id);
}

export function isEntityTypeEnabled(
  type: EntityType,
  settings: Settings,
): boolean {
  const def = settings.entityTypes.find((d) => d.id === type);
  return Boolean(def?.enabled && !def.retired);
}

export function entityTypeLabel(
  type: EntityType,
  settings?: Pick<Settings, "entityTypes">,
): string {
  const def = settings?.entityTypes.find((d) => d.id === type);
  return def?.label ?? humanizeEntityTypeId(type);
}

export function entityTypeColor(
  type: EntityType,
  settings?: Pick<Settings, "entityTypes">,
): string {
  const def = settings?.entityTypes.find((d) => d.id === type);
  if (def?.color?.trim()) return def.color.trim();
  return KNOWN_COLORS[type] ?? hashEntityTypeColor(type);
}

export function entityTypeFilterOptions(
  settings: Pick<Settings, "entityTypes">,
  entities?: Pick<Entity, "type">[],
): { value: EntityType | "all"; label: string }[] {
  const defs = entities
    ? augmentEntityTypesForEntities(settings.entityTypes, entities)
    : settings.entityTypes;

  const options: { value: EntityType | "all"; label: string }[] = [
    { value: "all", label: "All types" },
  ];

  for (const d of sortedEntityTypeDefinitions(defs)) {
    if (d.enabled && !d.retired) {
      options.push({ value: d.id, label: d.label });
    }
  }

  for (const d of sortedEntityTypeDefinitions(defs)) {
    if (d.retired) {
      options.push({
        value: d.id,
        label: `${d.label} (removed from catalog)`,
      });
    }
  }

  return options;
}

export function entityTypesForGraphFilters(
  definitions: EntityTypeDefinition[],
  entities: Pick<Entity, "type">[],
): EntityTypeDefinition[] {
  const augmented = augmentEntityTypesForEntities(definitions, entities);
  return augmented.filter((d) => d.enabled || d.retired);
}

export function defaultEntityTemplateForType(
  entityType: EntityType,
  label: string,
): Settings["entityTemplates"][number] {
  return {
    id: `${entityType}-default`,
    title: label,
    entityType,
    sections: [
      { title: "Overview", order: 0, fields: [] },
      { title: "Notes", order: 1, fields: [] },
    ],
  };
}
