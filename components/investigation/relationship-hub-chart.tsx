import { BarChart } from "@/components/investigation/bar-chart";
import { relationshipDegrees } from "@/lib/investigation/stats";
import type { Entity, Relationship } from "@/lib/types";

export function RelationshipHubChart({
  entities,
  relationships,
  scopeIds,
  limit = 8,
}: {
  entities: Entity[];
  relationships: Relationship[];
  scopeIds: string[];
  limit?: number;
}) {
  const byId = Object.fromEntries(entities.map((e) => [e.id, e]));
  const degrees = relationshipDegrees(scopeIds, relationships).slice(0, limit);

  const items = degrees.map((d) => ({
    label: byId[d.entityId]?.displayName ?? d.entityId,
    value: d.degree,
    color: "#6366f1",
    href: `/entities/${d.entityId}`,
  }));

  return (
    <BarChart
      items={items}
      emptyMessage="No relationships between scoped entities."
    />
  );
}
