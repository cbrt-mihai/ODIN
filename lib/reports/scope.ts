import type { Case, Entity, Group } from "@/lib/types";

export function resolveCaseLinkedGroups(
  caseData: Case,
  allGroups: Group[],
): Group[] {
  const ids = new Set(caseData.groupIds ?? []);
  return allGroups.filter((g) => ids.has(g.id));
}

export function resolveGroupLinkedGroups(
  group: Group,
  allGroups: Group[],
): Group[] {
  const ids = new Set(group.linkedGroupIds ?? []);
  return allGroups.filter((g) => ids.has(g.id));
}

/** Entity IDs for a case report: direct members, linked groups, and linked cases. */
export function collectCaseReportEntityIds(
  caseData: Case,
  linkedCases: Case[],
  linkedGroups: Group[],
): string[] {
  const ids = new Set<string>();
  for (const id of caseData.entityIds) ids.add(id);
  for (const group of linkedGroups) {
    for (const id of group.entityIds) ids.add(id);
  }
  for (const linkedCase of linkedCases) {
    for (const id of linkedCase.entityIds) ids.add(id);
  }
  return [...ids];
}

/** Entity IDs for a group report: members, linked groups, and linked cases. */
export function collectGroupReportEntityIds(
  group: Group,
  linkedCases: Case[],
  linkedGroups: Group[],
): string[] {
  const ids = new Set<string>();
  for (const id of group.entityIds) ids.add(id);
  for (const linkedGroup of linkedGroups) {
    for (const id of linkedGroup.entityIds) ids.add(id);
  }
  for (const linkedCase of linkedCases) {
    for (const id of linkedCase.entityIds) ids.add(id);
  }
  return [...ids];
}

export function entitiesForIds(
  allEntities: Entity[],
  entityIds: string[],
): Entity[] {
  const order = new Map(entityIds.map((id, index) => [id, index]));
  return allEntities
    .filter((e) => order.has(e.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function caseEntitySourceLabel(
  entityId: string,
  caseData: Case,
  linkedCases: Case[],
  linkedGroups: Group[],
): string {
  const parts: string[] = [];
  if (caseData.entityIds.includes(entityId)) parts.push("Direct");
  for (const group of linkedGroups) {
    if (group.entityIds.includes(entityId)) {
      parts.push(`Group: ${group.title}`);
    }
  }
  for (const linkedCase of linkedCases) {
    if (linkedCase.entityIds.includes(entityId)) {
      parts.push(`Case: ${linkedCase.title}`);
    }
  }
  return parts.join(" · ");
}

export function groupEntitySourceLabel(
  entityId: string,
  group: Group,
  linkedCases: Case[],
  linkedGroups: Group[],
): string {
  const parts: string[] = [];
  if (group.entityIds.includes(entityId)) parts.push("Direct");
  for (const linkedGroup of linkedGroups) {
    if (linkedGroup.entityIds.includes(entityId)) {
      parts.push(`Group: ${linkedGroup.title}`);
    }
  }
  for (const linkedCase of linkedCases) {
    if (linkedCase.entityIds.includes(entityId)) {
      parts.push(`Case: ${linkedCase.title}`);
    }
  }
  return parts.join(" · ");
}
