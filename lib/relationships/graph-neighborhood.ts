import type { Relationship } from "@/lib/types";
import type { GraphHops } from "@/lib/relationships/graph-view-state";

export const GRAPH_MAX_NODES = 120;

function adjacency(relationships: Relationship[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  function link(a: string, b: string) {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  }
  for (const r of relationships) {
    link(r.fromEntityId, r.toEntityId);
    link(r.toEntityId, r.fromEntityId);
  }
  return adj;
}

/** BFS hop limit from focus; returns entity ids to keep. */
export function expandGraphByHops(
  focusId: string,
  entityIds: Set<string>,
  relationships: Relationship[],
  hops: GraphHops,
): Set<string> {
  if (hops === "all") return new Set(entityIds);

  const adj = adjacency(
    relationships.filter(
      (r) =>
        entityIds.has(r.fromEntityId) && entityIds.has(r.toEntityId),
    ),
  );

  const keep = new Set<string>([focusId]);
  let frontier = [focusId];

  for (let depth = 0; depth < hops; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adj.get(id) ?? []) {
        if (!entityIds.has(neighbor) || keep.has(neighbor)) continue;
        keep.add(neighbor);
        next.push(neighbor);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  return keep;
}

/** Trim lowest-degree nodes when over cap; always keeps focus and high-degree nodes. */
export function trimGraphToMaxNodes(
  entityIds: string[],
  relationships: Relationship[],
  maxNodes: number,
  focusId?: string | null,
): string[] {
  if (entityIds.length <= maxNodes) return entityIds;

  const idSet = new Set(entityIds);
  const degree = new Map<string, number>();
  for (const id of entityIds) degree.set(id, 0);

  for (const r of relationships) {
    if (!idSet.has(r.fromEntityId) || !idSet.has(r.toEntityId)) continue;
    degree.set(r.fromEntityId, (degree.get(r.fromEntityId) ?? 0) + 1);
    degree.set(r.toEntityId, (degree.get(r.toEntityId) ?? 0) + 1);
  }

  const sorted = [...entityIds].sort(
    (a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0),
  );

  const keep = new Set<string>();
  if (focusId && idSet.has(focusId)) keep.add(focusId);

  for (const id of sorted) {
    if (keep.size >= maxNodes) break;
    keep.add(id);
  }

  return [...keep];
}
