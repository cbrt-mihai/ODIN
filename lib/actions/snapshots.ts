"use server";

import { logActivity } from "@/lib/storage/activity";
import { getEntity, saveEntity } from "@/lib/storage";
import {
  listEntitySnapshots,
  restoreEntitySnapshot,
  saveEntitySnapshot,
} from "@/lib/storage/snapshots";

export async function getSnapshotsForEntity(entityId: string) {
  return listEntitySnapshots(entityId);
}

export async function createSnapshot(entityId: string) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const ts = await saveEntitySnapshot(entity);
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entityId,
    summary: `Saved snapshot of "${entity.displayName}"`,
  });
  return ts;
}

export async function restoreSnapshot(entityId: string, timestamp: string) {
  const current = await getEntity(entityId);
  if (current) await saveEntitySnapshot(current, "before-restore");
  const restored = await restoreEntitySnapshot(entityId, timestamp);
  restored.updatedAt = new Date().toISOString();
  await saveEntity(restored);
  await logActivity({
    action: "restore",
    targetType: "entity",
    targetId: entityId,
    summary: `Restored snapshot from ${timestamp}`,
  });
}
