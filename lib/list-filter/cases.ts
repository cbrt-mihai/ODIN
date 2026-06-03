import {
  isCaseArchived,
  matchesArchiveFilter,
} from "@/lib/archive/status";
import {
  compareValues,
  matchesSearchQuery,
  parseTagsParam,
  type ListFilterState,
  type SortDirection,
} from "@/lib/list-filter/url-state";
import type { Case } from "@/lib/types";

export const CASE_SORT_OPTIONS = [
  { id: "updatedAt", label: "Last updated" },
  { id: "createdAt", label: "Created" },
  { id: "title", label: "Title" },
  { id: "entityCount", label: "Entity count" },
] as const;

export const CASE_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "closed", label: "Closed" },
] as const;

export function filterAndSortCases(
  cases: Case[],
  state: ListFilterState,
): Case[] {
  const q = state.q;
  const status = state.status ?? "all";
  const tagFilter = parseTagsParam(state.tags);
  const dir = (state.dir as SortDirection) ?? "desc";
  const sort = state.sort ?? "updatedAt";

  let result = cases.filter((c) => {
    if (!matchesArchiveFilter(isCaseArchived(c), state.archived)) return false;
    if (status !== "all" && c.status !== status) return false;
    if (
      tagFilter.length > 0 &&
      !tagFilter.some((t) => (c.tags ?? []).map((x) => x.toLowerCase()).includes(t))
    ) {
      return false;
    }
    if (
      !matchesSearchQuery(q, c.title, c.description, ...(c.tags ?? []))
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

export function caseFilterDefaults(
  overrides?: ListFilterState,
): ListFilterState {
  return {
    status: "all",
    archived: "exclude",
    sort: "updatedAt",
    dir: "desc",
    ...overrides,
  };
}
