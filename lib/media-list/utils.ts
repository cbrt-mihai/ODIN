export type MediaSortKey = "order" | "name" | "size" | "date";
export type MediaSortDir = "asc" | "desc";

export interface MediaListControls {
  search: string;
  sort: MediaSortKey;
  sortDir: MediaSortDir;
  sourceFilter: "all" | "upload" | "url";
  mimeFilter: string;
}

export const DEFAULT_MEDIA_CONTROLS: MediaListControls = {
  search: "",
  sort: "order",
  sortDir: "asc",
  sourceFilter: "all",
  mimeFilter: "all",
};

export function matchesSearch(
  query: string,
  ...parts: (string | undefined)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => p?.toLowerCase().includes(q));
}

export function compareStrings(a: string, b: string, dir: MediaSortDir) {
  const cmp = a.localeCompare(b);
  return dir === "asc" ? cmp : -cmp;
}

export function compareNumbers(a: number, b: number, dir: MediaSortDir) {
  return dir === "asc" ? a - b : b - a;
}
