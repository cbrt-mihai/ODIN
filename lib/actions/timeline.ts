"use server";

import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import { getCase, getEntity, saveCase, saveEntity } from "@/lib/storage";
import type { TimelineEvent } from "@/lib/types";

export async function addCaseEvent(
  caseId: string,
  input: Omit<TimelineEvent, "id" | "order">,
) {
  const c = await getCase(caseId);
  if (!c) throw new Error("Case not found");
  const event: TimelineEvent = {
    ...input,
    id: uuidv4(),
    order: c.events.length,
  };
  c.events.push(event);
  c.updatedAt = new Date().toISOString();
  await saveCase(c);
  await logActivity({
    action: "update",
    targetType: "case",
    targetId: caseId,
    summary: `Added timeline event "${event.title}"`,
  });
  return event;
}

export async function deleteCaseEvent(caseId: string, eventId: string) {
  const c = await getCase(caseId);
  if (!c) return;
  c.events = c.events.filter((e) => e.id !== eventId);
  c.updatedAt = new Date().toISOString();
  await saveCase(c);
}

export async function updateCaseEvent(
  caseId: string,
  eventId: string,
  patch: Partial<Omit<TimelineEvent, "id" | "order">>,
) {
  const c = await getCase(caseId);
  if (!c) throw new Error("Case not found");
  const idx = c.events.findIndex((e) => e.id === eventId);
  if (idx === -1) throw new Error("Event not found");
  c.events[idx] = { ...c.events[idx], ...patch };
  c.updatedAt = new Date().toISOString();
  await saveCase(c);
  await logActivity({
    action: "update",
    targetType: "case",
    targetId: caseId,
    summary: `Updated timeline event "${c.events[idx].title}"`,
  });
}

export async function addEntityEvent(
  entityId: string,
  input: Omit<TimelineEvent, "id" | "order">,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const event: TimelineEvent = {
    ...input,
    id: uuidv4(),
    order: entity.events.length,
  };
  entity.events.push(event);
  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entityId,
    summary: `Added timeline event "${event.title}"`,
  });
  return event;
}

export async function deleteEntityEvent(entityId: string, eventId: string) {
  const entity = await getEntity(entityId);
  if (!entity) return;
  entity.events = entity.events.filter((e) => e.id !== eventId);
  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
}

export async function updateEntityEvent(
  entityId: string,
  eventId: string,
  patch: Partial<Omit<TimelineEvent, "id" | "order">>,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const idx = entity.events.findIndex((e) => e.id === eventId);
  if (idx === -1) throw new Error("Event not found");
  entity.events[idx] = { ...entity.events[idx], ...patch };
  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entityId,
    summary: `Updated timeline event "${entity.events[idx].title}"`,
  });
}
