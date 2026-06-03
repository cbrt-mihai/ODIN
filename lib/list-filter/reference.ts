import {
  compareValues,
  matchesSearchQuery,
  parseTagsParam,
  type ListFilterState,
  type SortDirection,
} from "@/lib/list-filter/url-state";
import type { Resource, Tool } from "@/lib/types";

type Item = Tool | Resource;

export const REFERENCE_SORT_OPTIONS = [
  { id: "updatedAt", label: "Last updated" },
  { id: "createdAt", label: "Created" },
  { id: "name", label: "Name" },
  { id: "category", label: "Category" },
] as const;

export const REFERENCE_KIND_OPTIONS = [
  { value: "all", label: "All kinds" },
  { value: "external", label: "External" },
  { value: "internal_page", label: "Internal pages" },
] as const;

export function filterAndSortReference(
  items: Item[],
  state: ListFilterState,
): Item[] {
  const q = state.q;
  const kind = state.kind ?? "all";
  const tagFilter = parseTagsParam(state.tags);
  const dir = (state.dir as SortDirection) ?? "desc";
  const sort = state.sort ?? "updatedAt";
  const category = state.category?.trim().toLowerCase();

  let result = items.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;
    if (
      category &&
      !(item.category ?? "").toLowerCase().includes(category)
    ) {
      return false;
    }
    if (
      tagFilter.length > 0 &&
      !tagFilter.some((t) => item.tags.map((x) => x.toLowerCase()).includes(t))
    ) {
      return false;
    }
    if (
      !matchesSearchQuery(
        q,
        item.name,
        item.description,
        item.category,
        ...item.tags,
      )
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "name":
        return compareValues(a.name, b.name, dir);
      case "createdAt":
        return compareValues(a.createdAt, b.createdAt, dir);
      case "category":
        return compareValues(a.category ?? "", b.category ?? "", dir);
      default:
        return compareValues(a.updatedAt, b.updatedAt, dir);
    }
  });

  return result;
}

export function referenceFilterDefaults(
  overrides?: ListFilterState,
): ListFilterState {
  return {
    kind: "all",
    sort: "updatedAt",
    dir: "desc",
    ...overrides,
  };
}
