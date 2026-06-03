"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import {
  getCase,
  getCases,
  getEntity,
  getGroup,
  saveCase,
  saveEntity,
  saveGroup,
} from "@/lib/storage";
import { moveCaseToTrash } from "@/lib/storage/trash";

export async function listCases() {
  const cases = await getCases();
  return cases.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getCaseById(id: string) {
  return getCase(id);
}

export async function createCase(title: string, description?: string) {
  const now = new Date().toISOString();
  const caseData = {
    id: uuidv4(),
    title: title.trim(),
    description,
    status: "active" as const,
    entityIds: [],
    groupIds: [],
    linkedCaseIds: [],
    toolIds: [],
    resourceIds: [],
    playbookIds: [],
    events: [],
    playbookProgress: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveCase(caseData);
  await logActivity({
    action: "create",
    targetType: "case",
    targetId: caseData.id,
    summary: `Created case "${caseData.title}"`,
  });
  return caseData;
}

export async function updateCase(
  caseData: Awaited<ReturnType<typeof getCase>>,
) {
  if (!caseData) return;
  caseData.updatedAt = new Date().toISOString();
  await saveCase(caseData);
  await logActivity({
    action: "update",
    targetType: "case",
    targetId: caseData.id,
    summary: `Updated case "${caseData.title}"`,
  });
}

export async function deleteCase(id: string) {
  const c = await getCase(id);
  if (!c) return;
  await moveCaseToTrash(id, c.title);
  await logActivity({
    action: "delete",
    targetType: "case",
    targetId: id,
    summary: `Moved case "${c.title}" to trash`,
  });
  revalidatePath("/cases");
  revalidatePath("/trash");
}

export async function attachPlaybookToCase(caseId: string, playbookId: string) {
  const c = await getCase(caseId);
  if (!c) return;
  const now = new Date().toISOString();
  c.playbookIds = [...new Set([...(c.playbookIds ?? []), playbookId])];
  if (!c.playbookProgress.some((p) => p.playbookId === playbookId)) {
    c.playbookProgress.push({
      playbookId,
      completedStepIds: [],
      startedAt: now,
      updatedAt: now,
    });
  }
  c.updatedAt = now;
  await saveCase(c);
}

export async function togglePlaybookStep(
  caseId: string,
  playbookId: string,
  stepId: string,
  completed: boolean,
) {
  const c = await getCase(caseId);
  if (!c) return;
  const progress = c.playbookProgress.find((p) => p.playbookId === playbookId);
  if (!progress) return;
  const set = new Set(progress.completedStepIds);
  if (completed) set.add(stepId);
  else set.delete(stepId);
  progress.completedStepIds = [...set];
  progress.updatedAt = new Date().toISOString();
  c.updatedAt = progress.updatedAt;
  await saveCase(c);
}

export async function detachPlaybookFromCase(
  caseId: string,
  playbookId: string,
) {
  const c = await getCase(caseId);
  if (!c) return;
  c.playbookIds = (c.playbookIds ?? []).filter((id) => id !== playbookId);
  c.playbookProgress = c.playbookProgress.filter(
    (p) => p.playbookId !== playbookId,
  );
  c.updatedAt = new Date().toISOString();
  await saveCase(c);
}

export async function linkEntityToCase(caseId: string, entityId: string) {
  const [c, entity] = await Promise.all([getCase(caseId), getEntity(entityId)]);
  if (!c || !entity) return;
  const now = new Date().toISOString();
  if (!c.entityIds.includes(entityId)) {
    c.entityIds.push(entityId);
    c.updatedAt = now;
    await saveCase(c);
  }
  if (!entity.caseIds?.includes(caseId)) {
    entity.caseIds = [...(entity.caseIds ?? []), caseId];
    entity.updatedAt = now;
    await saveEntity(entity);
  }
  revalidatePath(`/entities/${entityId}`);
  revalidatePath(`/cases/${caseId}`);
}

export async function linkCaseToCase(caseId: string, otherCaseId: string) {
  if (caseId === otherCaseId) return;
  const [a, b] = await Promise.all([getCase(caseId), getCase(otherCaseId)]);
  if (!a || !b) return;
  const now = new Date().toISOString();
  if (!(a.linkedCaseIds ?? []).includes(otherCaseId)) {
    a.linkedCaseIds = [...(a.linkedCaseIds ?? []), otherCaseId];
    a.updatedAt = now;
    await saveCase(a);
  }
  if (!(b.linkedCaseIds ?? []).includes(caseId)) {
    b.linkedCaseIds = [...(b.linkedCaseIds ?? []), caseId];
    b.updatedAt = now;
    await saveCase(b);
  }
}

export async function linkGroupToCase(caseId: string, groupId: string) {
  const [c, group] = await Promise.all([getCase(caseId), getGroup(groupId)]);
  if (!c || !group) return;
  const now = new Date().toISOString();
  if (!(c.groupIds ?? []).includes(groupId)) {
    c.groupIds = [...(c.groupIds ?? []), groupId];
    c.updatedAt = now;
    await saveCase(c);
  }
  if (!(group.caseIds ?? []).includes(caseId)) {
    group.caseIds = [...(group.caseIds ?? []), caseId];
    group.updatedAt = now;
    await saveGroup(group);
  }
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/groups/${groupId}`);
}

export async function unlinkGroupFromCase(caseId: string, groupId: string) {
  const [c, group] = await Promise.all([getCase(caseId), getGroup(groupId)]);
  if (!c || !group) return;
  const now = new Date().toISOString();
  c.groupIds = (c.groupIds ?? []).filter((id) => id !== groupId);
  c.updatedAt = now;
  await saveCase(c);
  group.caseIds = (group.caseIds ?? []).filter((id) => id !== caseId);
  group.updatedAt = now;
  await saveGroup(group);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/groups/${groupId}`);
}

export async function unlinkCaseFromCase(caseId: string, otherCaseId: string) {
  const [a, b] = await Promise.all([getCase(caseId), getCase(otherCaseId)]);
  if (!a || !b) return;
  const now = new Date().toISOString();
  a.linkedCaseIds = (a.linkedCaseIds ?? []).filter((id) => id !== otherCaseId);
  a.updatedAt = now;
  await saveCase(a);
  b.linkedCaseIds = (b.linkedCaseIds ?? []).filter((id) => id !== caseId);
  b.updatedAt = now;
  await saveCase(b);
}

export async function unlinkEntityFromCase(caseId: string, entityId: string) {
  const [c, entity] = await Promise.all([getCase(caseId), getEntity(entityId)]);
  if (!c || !entity) return;
  const now = new Date().toISOString();
  c.entityIds = c.entityIds.filter((id) => id !== entityId);
  c.updatedAt = now;
  await saveCase(c);
  entity.caseIds = (entity.caseIds ?? []).filter((id) => id !== caseId);
  entity.updatedAt = now;
  await saveEntity(entity);
  revalidatePath(`/entities/${entityId}`);
  revalidatePath(`/cases/${caseId}`);
}
