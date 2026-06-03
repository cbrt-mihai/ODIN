export type SortDirection = "asc" | "desc";

export type ListFilterState = Record<string, string | undefined>;

export function parseListParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): ListFilterState {
  const out: ListFilterState = {};
  const entries =
    params instanceof URLSearchParams
      ? [...params.entries()]
      : Object.entries(params).flatMap(([k, v]) =>
          v === undefined
            ? []
            : Array.isArray(v)
              ? v.map((x) => [k, x] as const)
              : [[k, v] as const],
        );

  for (const [key, value] of entries) {
    if (value) out[key] = value;
  }
  return out;
}

export function buildListQuery(state: ListFilterState): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value && value !== "all" && value !== "") {
      sp.set(key, value);
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function parseTagsParam(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function joinTagsParam(tags: string[]): string | undefined {
  const list = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  return list.length ? list.join(",") : undefined;
}

export function matchesSearchQuery(
  query: string | undefined,
  ...parts: (string | undefined)[]
): boolean {
  const q = query?.trim().toLowerCase();
  if (!q) return true;
  const blob = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => blob.includes(term));
}

export function compareValues(
  a: string | number,
  b: string | number,
  dir: SortDirection,
): number {
  if (typeof a === "number" && typeof b === "number") {
    return dir === "asc" ? a - b : b - a;
  }
  const cmp = String(a).localeCompare(String(b), undefined, {
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}
