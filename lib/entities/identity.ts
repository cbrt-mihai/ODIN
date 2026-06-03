import { collectFieldValues } from "@/lib/entities/contact-fields";
import { fieldDisplayValue } from "@/lib/reports/shared";
import { entityRootSlug } from "@/lib/references/path";
import type { Entity, EntityType } from "@/lib/types";

export function normalizeDisplayNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface EntityIdentity {
  entityId: string;
  displayName: string;
  type: EntityType;
  /** Short differentiator within a same-name group (user override or auto). */
  disambiguator: string;
  /** Display name plus disambiguator when needed, e.g. Marcus Reed (marcus-reed-austin). */
  qualifiedName: string;
  /** @ path root slug for references. */
  referenceSlug: string;
  isHomonym: boolean;
  homonymCount: number;
  /** Extra tokens for search / filter. */
  searchText: string;
}

function firstLocationLabel(entity: Entity): string | null {
  for (const sec of entity.sections) {
    for (const f of sec.fields) {
      if (f.type !== "location") continue;
      const v = fieldDisplayValue(f).trim();
      if (v) return v.split(",")[0]?.trim() || v;
    }
  }
  return null;
}

function firstOrgLabel(entity: Entity, allById: Map<string, Entity>): string | null {
  for (const sec of entity.sections) {
    for (const f of sec.fields) {
      if (f.type !== "entityLink" || !f.value.data || typeof f.value.data !== "object") {
        continue;
      }
      const entityId = (f.value.data as { entityId?: string }).entityId;
      if (typeof entityId === "string") {
        return allById.get(entityId)?.displayName ?? null;
      }
    }
  }
  return null;
}

function disambiguatorCandidates(
  entity: Entity,
  allById: Map<string, Entity>,
): string[] {
  const out: string[] = [];
  const push = (s: string | null | undefined) => {
    const t = s?.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  push(entity.disambiguator);
  push(entity.slug);
  push(entityRootSlug(entity));

  push(firstLocationLabel(entity));
  push(firstOrgLabel(entity, allById));
  for (const email of collectFieldValues(entity, "email")) push(email);
  for (const phone of collectFieldValues(entity, "phone")) push(phone);

  push(entity.type);
  return out;
}

function assignGroupDisambiguators(
  group: Entity[],
  allById: Map<string, Entity>,
): Map<string, string> {
  const used = new Set<string>();
  const result = new Map<string, string>();
  const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));

  for (const entity of sorted) {
    const candidates = disambiguatorCandidates(entity, allById);
    let pick =
      candidates.find((c) => !used.has(c.toLowerCase())) ?? candidates[0];

    if (!pick || used.has(pick.toLowerCase())) {
      pick = `${entityRootSlug(entity)}`;
      let n = 2;
      while (used.has(pick.toLowerCase())) {
        pick = `${entityRootSlug(entity)}-${n}`;
        n += 1;
      }
    }

    used.add(pick.toLowerCase());
    result.set(entity.id, pick);
  }

  return result;
}

export function formatQualifiedName(
  displayName: string,
  disambiguator: string,
  isHomonym: boolean,
): string {
  if (!isHomonym) return displayName;
  const d = disambiguator.trim();
  if (!d) return displayName;
  return `${displayName} (${d})`;
}

export function buildEntityIdentityMap(
  entities: Entity[],
): Map<string, EntityIdentity> {
  const allById = new Map(entities.map((e) => [e.id, e]));
  const groups = new Map<string, Entity[]>();

  for (const entity of entities) {
    const key = normalizeDisplayNameKey(entity.displayName);
    const list = groups.get(key) ?? [];
    list.push(entity);
    groups.set(key, list);
  }

  const result = new Map<string, EntityIdentity>();

  for (const group of groups.values()) {
    const isHomonym = group.length > 1;
    const disambiguators = isHomonym
      ? assignGroupDisambiguators(group, allById)
      : new Map(group.map((e) => [e.id, ""]));

    for (const entity of group) {
      const disambiguator = disambiguators.get(entity.id) ?? "";
      const qualifiedName = formatQualifiedName(
        entity.displayName,
        disambiguator,
        isHomonym,
      );
      const referenceSlug = entityRootSlug(entity);
      const searchText = [
        entity.displayName,
        qualifiedName,
        disambiguator,
        referenceSlug,
        entity.slug,
        ...(entity.aliases ?? []),
        ...(entity.tags ?? []),
        ...collectFieldValues(entity, "email"),
        ...collectFieldValues(entity, "phone"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      result.set(entity.id, {
        entityId: entity.id,
        displayName: entity.displayName,
        type: entity.type,
        disambiguator,
        qualifiedName,
        referenceSlug,
        isHomonym,
        homonymCount: group.length - 1,
        searchText,
      });
    }
  }

  return result;
}

export function getEntityIdentity(
  entity: Entity,
  allEntities: Entity[],
): EntityIdentity {
  const map = buildEntityIdentityMap(allEntities);
  return (
    map.get(entity.id) ?? {
      entityId: entity.id,
      displayName: entity.displayName,
      type: entity.type,
      disambiguator: "",
      qualifiedName: entity.displayName,
      referenceSlug: entityRootSlug(entity),
      isHomonym: false,
      homonymCount: 0,
      searchText: entity.displayName.toLowerCase(),
    }
  );
}

/** Entities sharing the same display name (case-insensitive). */
export function findHomonyms(entity: Entity, allEntities: Entity[]): Entity[] {
  const key = normalizeDisplayNameKey(entity.displayName);
  return allEntities.filter(
    (e) =>
      e.id !== entity.id && normalizeDisplayNameKey(e.displayName) === key,
  );
}

export function homonymCount(entity: Entity, allEntities: Entity[]): number {
  return findHomonyms(entity, allEntities).length;
}

/** Parse `Name (disambiguator)` used in wikilinks and search. */
export function parseQualifiedDisplayName(target: string): {
  name: string;
  disambiguator?: string;
} | null {
  const trimmed = target.trim();
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return null;
  return { name: match[1]!.trim(), disambiguator: match[2]!.trim() };
}

/** Label for &lt;SelectItem&gt; and compact lists. */
export function entityPickerLabel(
  entity: Entity,
  identityMap: Map<string, EntityIdentity>,
): string {
  const identity = identityMap.get(entity.id);
  const name = identity?.isHomonym ? identity.qualifiedName : entity.displayName;
  return `[${entity.type}] ${name}`;
}

export function resolveEntityByDisplayTarget(
  target: string,
  entities: Entity[],
  identityMap?: Map<string, EntityIdentity>,
): Entity | null {
  const map = identityMap ?? buildEntityIdentityMap(entities);
  const trimmed = target.trim();
  if (!trimmed) return null;

  const qualified = parseQualifiedDisplayName(trimmed);
  if (qualified) {
    const nameKey = normalizeDisplayNameKey(qualified.name);
    const disKey = qualified.disambiguator!.toLowerCase();
    const match = entities.find((e) => {
      const id = map.get(e.id);
      return (
        normalizeDisplayNameKey(e.displayName) === nameKey &&
        id?.disambiguator.toLowerCase() === disKey
      );
    });
    if (match) return match;
  }

  const slugLower = trimmed.toLowerCase();
  const bySlug = entities.find(
    (e) =>
      e.slug?.toLowerCase() === slugLower ||
      map.get(e.id)?.referenceSlug.toLowerCase() === slugLower,
  );
  if (bySlug) return bySlug;

  const nameKey = normalizeDisplayNameKey(trimmed);
  const byName = entities.filter(
    (e) =>
      normalizeDisplayNameKey(e.displayName) === nameKey ||
      e.aliases?.some((a) => normalizeDisplayNameKey(a) === nameKey),
  );
  if (byName.length === 1) return byName[0]!;
  return null;
}
