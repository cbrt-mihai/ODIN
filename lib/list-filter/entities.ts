import { entityFieldSearchBlob } from "@/lib/search/field-text";
import {
  compareValues,
  matchesSearchQuery,
  parseTagsParam,
  type ListFilterState,
  type SortDirection,
} from "@/lib/list-filter/url-state";
import { entityTypeFilterOptions } from "@/lib/entities/entity-types";
import type { Entity, EntityType, Settings } from "@/lib/types";

export const ENTITY_SORT_OPTIONS = [
  { id: "updatedAt", label: "Last updated" },
  { id: "createdAt", label: "Created" },
  { id: "displayName", label: "Name" },
  { id: "type", label: "Type" },
] as const;

export function entityTypeOptionsForSettings(
  settings: Settings,
  entities?: Pick<Entity, "type">[],
): { value: EntityType | "all"; label: string }[] {
  return entityTypeFilterOptions(settings, entities);
}

export function filterAndSortEntities(
  entities: Entity[],
  state: ListFilterState,
): Entity[] {
  const q = state.q;
  const type = state.type ?? "all";
  const tagFilter = parseTagsParam(state.tags);
  const dir = (state.dir as SortDirection) ?? "desc";
  const sort = state.sort ?? "updatedAt";

  let result = entities.filter((e) => {
    if (type !== "all" && e.type !== type) return false;
    if (
      tagFilter.length > 0 &&
      !tagFilter.some((t) => (e.tags ?? []).map((x) => x.toLowerCase()).includes(t))
    ) {
      return false;
    }
    if (
      !matchesSearchQuery(
        q,
        e.displayName,
        e.slug,
        ...(e.aliases ?? []),
        ...(e.tags ?? []),
        entityFieldSearchBlob(e),
      )
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "displayName":
        return compareValues(a.displayName, b.displayName, dir);
      case "createdAt":
        return compareValues(a.createdAt, b.createdAt, dir);
      case "type":
        return compareValues(a.type, b.type, dir);
      default:
        return compareValues(a.updatedAt, b.updatedAt, dir);
    }
  });

  return result;
}

export function entityFilterDefaults(
  overrides?: ListFilterState,
): ListFilterState {
  return {
    type: "all",
    sort: "updatedAt",
    dir: "desc",
    ...overrides,
  };
}
