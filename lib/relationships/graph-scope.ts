import type { Relationship } from "@/lib/types";

export type ScopedRelationshipGraph = {
  entityIds: string[];
  relationships: Relationship[];
};

/** Entity page: center + neighbors and links between them only. */
export function scopeEntityEgoGraph(
  centerEntityId: string,
  relationships: Relationship[],
): ScopedRelationshipGraph {
  const entityIdSet = new Set<string>([centerEntityId]);

  for (const r of relationships) {
    if (r.fromEntityId === centerEntityId || r.toEntityId === centerEntityId) {
      entityIdSet.add(r.fromEntityId);
      entityIdSet.add(r.toEntityId);
    }
  }

  const scopedRelationships = relationships.filter(
    (r) =>
      entityIdSet.has(r.fromEntityId) && entityIdSet.has(r.toEntityId),
  );

  return {
    entityIds: [...entityIdSet],
    relationships: scopedRelationships,
  };
}

/** Case / group page: members and links with both ends in the set. */
export function scopeMembershipGraph(
  memberEntityIds: string[],
  relationships: Relationship[],
): ScopedRelationshipGraph {
  const memberSet = new Set(memberEntityIds);
  const scopedRelationships = relationships.filter(
    (r) => memberSet.has(r.fromEntityId) && memberSet.has(r.toEntityId),
  );

  return {
    entityIds: memberEntityIds,
    relationships: scopedRelationships,
  };
}

/** Workspace graph at /graph — all entities and all relationships. */
export function scopeWorkspaceGraph(
  entityIds: string[],
  relationships: Relationship[] | undefined,
): ScopedRelationshipGraph {
  const idSet = new Set(entityIds);
  const rels = relationships ?? [];
  return {
    entityIds,
    relationships: rels.filter(
      (r) => idSet.has(r.fromEntityId) && idSet.has(r.toEntityId),
    ),
  };
}
