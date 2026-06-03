import type { Group } from "@/lib/types";

export function normalizeGroup(group: Group): Group {
  return {
    ...group,
    entityIds: group.entityIds ?? [],
    caseIds: group.caseIds ?? [],
    linkedGroupIds: group.linkedGroupIds ?? [],
    tags: group.tags ?? [],
  };
}
