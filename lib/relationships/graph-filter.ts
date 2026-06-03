import type {
  Case,
  ConfidenceTypeId,
  Entity,
  EntityType,
  Group,
  Relationship,
} from "@/lib/types";
import type { GraphViewState } from "@/lib/relationships/graph-view-state";
import {
  expandGraphByHops,
  GRAPH_MAX_NODES,
  trimGraphToMaxNodes,
} from "@/lib/relationships/graph-neighborhood";

export type FilteredGraph = {
  entities: Entity[];
  relationships: Relationship[];
  focusId: string | null;
  trimmedCount: number;
};

function entityMatchesSearch(entity: Entity, q: string): boolean {
  const needle = q.toLowerCase();
  if (entity.displayName.toLowerCase().includes(needle)) return true;
  if ((entity.slug ?? "").toLowerCase().includes(needle)) return true;
  if ((entity.disambiguator ?? "").toLowerCase().includes(needle)) return true;
  if ((entity.aliases ?? []).some((a) => a.toLowerCase().includes(needle)))
    return true;
  return false;
}

function entityMatchesTags(
  entity: Entity,
  tags: string[],
  mode: "any" | "all",
): boolean {
  if (tags.length === 0) return true;
  const et = new Set(entity.tags ?? []);
  if (mode === "all") return tags.every((t) => et.has(t));
  return tags.some((t) => et.has(t));
}

function confidenceRank(
  confidence: ConfidenceTypeId | undefined,
  order: Map<string, number>,
): number {
  if (!confidence) return -1;
  return order.get(confidence) ?? 0;
}

export function applyGraphFilters(
  allEntities: Entity[],
  allRelationships: Relationship[],
  cases: Case[],
  groups: Group[],
  filters: GraphViewState,
  confidenceOrder: ConfidenceTypeId[],
): FilteredGraph {
  const confOrder = new Map(confidenceOrder.map((c, i) => [c, i]));
  const minRank = filters.minConfidence
    ? confidenceRank(filters.minConfidence as ConfidenceTypeId, confOrder)
    : null;

  let memberIds: Set<string> | null = null;
  if (filters.caseId) {
    const c = cases.find((x) => x.id === filters.caseId);
    memberIds = new Set(c?.entityIds ?? []);
  }
  if (filters.groupId) {
    const g = groups.find((x) => x.id === filters.groupId);
    const gSet = new Set(g?.entityIds ?? []);
    memberIds = memberIds
      ? new Set([...memberIds].filter((id) => gSet.has(id)))
      : gSet;
  }

  let entities = allEntities.filter((e) => {
    if (memberIds && !memberIds.has(e.id)) return false;
    if (
      filters.entityTypes.length > 0 &&
      !filters.entityTypes.includes(e.type as EntityType)
    ) {
      return false;
    }
    if (filters.search.trim() && !entityMatchesSearch(e, filters.search.trim())) {
      return false;
    }
    if (!entityMatchesTags(e, filters.tags, filters.tagMode)) return false;
    return true;
  });

  const entityIdSet = () => new Set(entities.map((e) => e.id));

  let relationships = allRelationships.filter((r) => {
    const ids = entityIdSet();
    if (!ids.has(r.fromEntityId) || !ids.has(r.toEntityId)) return false;
    if (
      filters.relationshipTypes.length > 0 &&
      !filters.relationshipTypes.includes(r.type)
    ) {
      return false;
    }
    if (filters.caseId && r.caseId && r.caseId !== filters.caseId) return false;
    if (minRank !== null) {
      const rank = confidenceRank(r.confidence, confOrder);
      if (rank < minRank) return false;
    }
    return true;
  });

  if (!filters.showIsolates) {
    const linked = new Set<string>();
    for (const r of relationships) {
      linked.add(r.fromEntityId);
      linked.add(r.toEntityId);
    }
    entities = entities.filter((e) => linked.has(e.id));
  }

  let focusId = filters.focusId;
  if (focusId && !entities.some((e) => e.id === focusId)) {
    focusId = null;
  }
  if (!focusId && entities.length > 0) {
    focusId = entities[0]!.id;
  }

  if (focusId && filters.hops !== "all") {
    const hopSet = expandGraphByHops(
      focusId,
      new Set(entities.map((e) => e.id)),
      relationships,
      filters.hops,
    );
    entities = entities.filter((e) => hopSet.has(e.id));
    const ids = new Set(entities.map((e) => e.id));
    relationships = relationships.filter(
      (r) => ids.has(r.fromEntityId) && ids.has(r.toEntityId),
    );
  }

  const beforeTrim = entities.length;
  const trimmedIds = trimGraphToMaxNodes(
    entities.map((e) => e.id),
    relationships,
    GRAPH_MAX_NODES,
    focusId,
  );
  const trimmedSet = new Set(trimmedIds);
  entities = entities.filter((e) => trimmedSet.has(e.id));
  relationships = relationships.filter(
    (r) => trimmedSet.has(r.fromEntityId) && trimmedSet.has(r.toEntityId),
  );

  if (focusId && !trimmedSet.has(focusId) && entities.length > 0) {
    focusId = entities[0]!.id;
  }

  return {
    entities,
    relationships,
    focusId,
    trimmedCount: Math.max(0, beforeTrim - entities.length),
  };
}
