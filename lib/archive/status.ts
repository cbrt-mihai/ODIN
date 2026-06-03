import type { Case, Entity, Group } from "@/lib/types";

export type ArchiveFilter = "all" | "exclude" | "only";

export const ARCHIVE_FILTER_OPTIONS = [
  { value: "exclude", label: "Hide archived" },
  { value: "all", label: "Include archived" },
  { value: "only", label: "Archived only" },
] as const;

export function isEntityArchived(entity: Pick<Entity, "archived">): boolean {
  return entity.archived === true;
}

export function isGroupArchived(group: Pick<Group, "archived">): boolean {
  return group.archived === true;
}

export function isCaseArchived(caseData: Pick<Case, "status">): boolean {
  return caseData.status === "archived";
}

export function matchesArchiveFilter(
  archived: boolean,
  filter: string | undefined,
): boolean {
  const mode = (filter as ArchiveFilter) ?? "exclude";
  if (mode === "all") return true;
  if (mode === "only") return archived;
  return !archived;
}
