"use server";

import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import { getEntities, getRelationships, saveRelationships } from "@/lib/storage";
import { isEmptyDateRange } from "@/lib/date-range/format";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import type {
  ConfidenceTypeId,
  DateRangesValue,
  EntityType,
  Relationship,
} from "@/lib/types";

export async function listRelationships() {
  const { relationships } = await getRelationships();
  return relationships;
}

function stripEmptyValidity(
  validity: DateRangesValue | undefined,
): DateRangesValue | undefined {
  if (!validity) return undefined;
  const migrated = migrateDateRangesValue(validity);
  const entries = migrated.entries.filter((e) => !isEmptyDateRange(e));
  if (!entries.length) return undefined;
  return { entries };
}

export async function createRelationship(input: {
  fromEntityId: string;
  toEntityId: string;
  fromType: EntityType;
  toType: EntityType;
  type: string;
  label?: string;
  inverseLabel?: string;
  bidirectional?: boolean;
  validity?: DateRangesValue;
  confidence?: ConfidenceTypeId;
  caseId?: string;
}) {
  const { relationships } = await getRelationships();
  const now = new Date().toISOString();
  const rel: Relationship = {
    id: uuidv4(),
    ...input,
    validity: stripEmptyValidity(input.validity),
    createdAt: now,
    updatedAt: now,
  };
  relationships.push(rel);
  await saveRelationships({ relationships });
  await logActivity({
    action: "create",
    targetType: "relationship",
    targetId: rel.id,
    summary: `Linked entities (${input.type})`,
  });
  return rel;
}

export async function updateRelationship(
  id: string,
  patch: {
    validity?: DateRangesValue | null;
    confidence?: ConfidenceTypeId;
    label?: string;
    inverseLabel?: string;
  },
) {
  const { relationships } = await getRelationships();
  const idx = relationships.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Relationship not found");

  const prev = relationships[idx];
  const next: Relationship = {
    ...prev,
    updatedAt: new Date().toISOString(),
  };

  if (patch.label !== undefined) {
    next.label = patch.label.trim() || undefined;
  }
  if (patch.inverseLabel !== undefined) {
    next.inverseLabel = patch.inverseLabel.trim() || undefined;
  }
  if (patch.confidence !== undefined) {
    next.confidence = patch.confidence;
  }
  if (patch.validity === null) {
    next.validity = undefined;
  } else if (patch.validity !== undefined) {
    next.validity = stripEmptyValidity(patch.validity);
  }

  relationships[idx] = next;
  await saveRelationships({ relationships });
  await logActivity({
    action: "update",
    targetType: "relationship",
    targetId: id,
    summary: "Updated relationship",
  });
  return next;
}

export async function deleteRelationship(id: string) {
  const { relationships } = await getRelationships();
  await saveRelationships({
    relationships: relationships.filter((r) => r.id !== id),
  });
}

export async function getEntityRelationships(entityId: string) {
  const [{ relationships }, entities] = await Promise.all([
    getRelationships(),
    getEntities(),
  ]);
  const outgoing = relationships.filter((r) => r.fromEntityId === entityId);
  const incoming = relationships.filter((r) => r.toEntityId === entityId);
  const resolve = (id: string) => entities.find((e) => e.id === id);
  return { outgoing, incoming, resolve };
}
