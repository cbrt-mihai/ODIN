"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import {
  getEntity,
  getGroup,
  getGroups,
  saveEntity,
  saveGroup,
} from "@/lib/storage";
import { moveGroupToTrash } from "@/lib/storage/trash";

export async function listGroups() {
  const groups = await getGroups();
  return groups.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getGroupById(id: string) {
  return getGroup(id);
}

export async function createGroup(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const now = new Date().toISOString();
  const group = {
    id: uuidv4(),
    title,
    description: undefined as string | undefined,
    color: "#6366f1",
    entityIds: [] as string[],
    caseIds: [] as string[],
    linkedGroupIds: [] as string[],
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
  };
  await saveGroup(group);
  await logActivity({
    action: "create",
    targetType: "group",
    targetId: group.id,
    summary: `Created group "${group.title}"`,
  });
  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function createGroupByTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Group title is required");

  const now = new Date().toISOString();
  const group = {
    id: uuidv4(),
    title: trimmed,
    description: undefined as string | undefined,
    color: "#6366f1",
    entityIds: [] as string[],
    caseIds: [] as string[],
    linkedGroupIds: [] as string[],
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
  };
  await saveGroup(group);
  await logActivity({
    action: "create",
    targetType: "group",
    targetId: group.id,
    summary: `Created group "${group.title}"`,
  });
  revalidatePath("/groups");
  return group;
}

export async function updateGroup(
  group: NonNullable<Awaited<ReturnType<typeof getGroup>>>,
) {
  group.updatedAt = new Date().toISOString();
  await saveGroup(group);
  await logActivity({
    action: "update",
    targetType: "group",
    targetId: group.id,
    summary: `Updated group "${group.title}"`,
  });
  revalidatePath("/groups");
  revalidatePath(`/groups/${group.id}`);
}

export async function deleteGroup(id: string) {
  const g = await getGroup(id);
  if (!g) return;
  await moveGroupToTrash(id, g.title);
  await logActivity({
    action: "delete",
    targetType: "group",
    targetId: id,
    summary: `Moved group "${g.title}" to trash`,
  });
  revalidatePath("/groups");
  revalidatePath("/trash");
}

export async function linkEntityToGroup(groupId: string, entityId: string) {
  const [group, entity] = await Promise.all([
    getGroup(groupId),
    getEntity(entityId),
  ]);
  if (!group || !entity) return;
  if (!group.entityIds.includes(entityId)) {
    group.entityIds.push(entityId);
    group.updatedAt = new Date().toISOString();
    await saveGroup(group);
  }
  if (!entity.groupIds?.includes(groupId)) {
    entity.groupIds = [...(entity.groupIds ?? []), groupId];
    entity.updatedAt = new Date().toISOString();
    await saveEntity(entity);
  }
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/entities/${entityId}`);
}

export async function linkGroupToGroup(groupId: string, otherGroupId: string) {
  if (groupId === otherGroupId) return;
  const [a, b] = await Promise.all([
    getGroup(groupId),
    getGroup(otherGroupId),
  ]);
  if (!a || !b) return;
  const now = new Date().toISOString();
  if (!(a.linkedGroupIds ?? []).includes(otherGroupId)) {
    a.linkedGroupIds = [...(a.linkedGroupIds ?? []), otherGroupId];
    a.updatedAt = now;
    await saveGroup(a);
  }
  if (!(b.linkedGroupIds ?? []).includes(groupId)) {
    b.linkedGroupIds = [...(b.linkedGroupIds ?? []), groupId];
    b.updatedAt = now;
    await saveGroup(b);
  }
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${otherGroupId}`);
}

export async function unlinkGroupFromGroup(
  groupId: string,
  otherGroupId: string,
) {
  const [a, b] = await Promise.all([
    getGroup(groupId),
    getGroup(otherGroupId),
  ]);
  if (!a || !b) return;
  const now = new Date().toISOString();
  a.linkedGroupIds = (a.linkedGroupIds ?? []).filter(
    (id) => id !== otherGroupId,
  );
  a.updatedAt = now;
  await saveGroup(a);
  b.linkedGroupIds = (b.linkedGroupIds ?? []).filter((id) => id !== groupId);
  b.updatedAt = now;
  await saveGroup(b);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${otherGroupId}`);
}

export async function unlinkEntityFromGroup(groupId: string, entityId: string) {
  const [group, entity] = await Promise.all([
    getGroup(groupId),
    getEntity(entityId),
  ]);
  if (!group || !entity) return;
  group.entityIds = group.entityIds.filter((id) => id !== entityId);
  group.updatedAt = new Date().toISOString();
  await saveGroup(group);
  entity.groupIds = (entity.groupIds ?? []).filter((id) => id !== groupId);
  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/entities/${entityId}`);
}
