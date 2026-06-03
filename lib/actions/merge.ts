"use server";

import { applyMergeSelections } from "@/lib/entities/merge-apply";
import {
  analyzeEntityMerge,
  type MergeSelections,
} from "@/lib/entities/merge-analysis";
import { rewireEntitiesAfterMerge } from "@/lib/entities/rewire";
import { logActivity } from "@/lib/storage/activity";
import {
  getEntities,
  getEntity,
  getRelationships,
  saveEntity,
  saveRelationships,
} from "@/lib/storage";
import { saveEntitySnapshot } from "@/lib/storage/snapshots";
import { moveEntityToTrash } from "@/lib/storage/trash";

export type { MergeSelections } from "@/lib/entities/merge-analysis";

export async function mergeEntities(
  primaryId: string,
  secondaryId: string,
  selections: MergeSelections,
) {
  const [primary, secondary] = await Promise.all([
    getEntity(primaryId),
    getEntity(secondaryId),
  ]);
  if (!primary || !secondary) throw new Error("Entity not found");

  await saveEntitySnapshot(primary, "before-merge");
  await saveEntitySnapshot(secondary, "before-merge-secondary");

  const analysis = analyzeEntityMerge(primary, secondary);
  const merged = applyMergeSelections(
    primary,
    secondary,
    analysis,
    selections,
  );

  merged.updatedAt = new Date().toISOString();
  await saveEntity(merged);

  const { relationships } = await getRelationships();
  for (const rel of relationships) {
    if (rel.fromEntityId === secondaryId) rel.fromEntityId = primaryId;
    if (rel.toEntityId === secondaryId) rel.toEntityId = primaryId;
  }
  await saveRelationships({ relationships });

  const allEntities = await getEntities();
  const rewired = rewireEntitiesAfterMerge(
    allEntities,
    secondaryId,
    merged,
    secondary,
  );
  for (const ent of rewired) {
    if (ent.id === primaryId) continue;
    if (ent.id === secondaryId) continue;
    const before = allEntities.find((e) => e.id === ent.id);
    if (before && JSON.stringify(before) !== JSON.stringify(ent)) {
      await saveEntity(ent);
    }
  }

  await moveEntityToTrash(secondaryId, secondary.displayName);

  await logActivity({
    action: "merge",
    targetType: "entity",
    targetId: primaryId,
    summary: `Merged "${secondary.displayName}" into "${primary.displayName}"`,
  });

  return merged;
}
