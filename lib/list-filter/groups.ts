import {
  isGroupArchived,
  matchesArchiveFilter,
} from "@/lib/archive/status";
import {
  compareValues,
  matchesSearchQuery,
  parseTagsParam,
  type ListFilterState,
  type SortDirection,
} from "@/lib/list-filter/url-state";
import type { Group } from "@/lib/types";

export const GROUP_SORT_OPTIONS = [
  { id: "updatedAt", label: "Last updated" },
  { id: "createdAt", label: "Created" },
  { id: "title", label: "Title" },
  { id: "entityCount", label: "Entity count" },
] as const;

export function filterAndSortGroups(
  groups: Group[],
  state: ListFilterState,
): Group[] {
  const q = state.q;
  const tagFilter = parseTagsParam(state.tags);
  const dir = (state.dir as SortDirection) ?? "desc";
  const sort = state.sort ?? "updatedAt";
  const minEntities = state.minEntities
    ? Number(state.minEntities)
    : undefined;

  let result = groups.filter((g) => {
    if (!matchesArchiveFilter(isGroupArchived(g), state.archived)) return false;
    if (
      minEntities != null &&
      !Number.isNaN(minEntities) &&
      g.entityIds.length < minEntities
    ) {
      return false;
    }
    if (
      tagFilter.length > 0 &&
      !tagFilter.some((t) => (g.tags ?? []).map((x) => x.toLowerCase()).includes(t))
    ) {
      return false;
    }
    if (
      !matchesSearchQuery(q, g.title, g.description, ...(g.tags ?? []))
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "title":
        return compareValues(a.title, b.title, dir);
      case "createdAt":
        return compareValues(a.createdAt, b.createdAt, dir);
      case "entityCount":
        return compareValues(
          a.entityIds.length,
          b.entityIds.length,
          dir,
        );
      default:
        return compareValues(a.updatedAt, b.updatedAt, dir);
    }
  });

  return result;
}

export function groupFilterDefaults(
  overrides?: ListFilterState,
): ListFilterState {
  return {
    archived: "exclude",
    sort: "updatedAt",
    dir: "desc",
    ...overrides,
  };
}
