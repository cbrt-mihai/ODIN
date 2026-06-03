import { EntityGraph } from "@/components/relationships/entity-graph";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { scopeMembershipGraph } from "@/lib/relationships/graph-scope";
import { getSettings } from "@/lib/storage";

export async function GroupGraphSection({
  linkedIds,
}: {
  linkedIds: string[];
}) {
  if (linkedIds.length === 0) return null;

  const [entities, relationships, settings] = await Promise.all([
    listEntities(),
    listRelationships(),
    getSettings(),
  ]);

  const linked = entities.filter((e) => linkedIds.includes(e.id));
  const graphScope = scopeMembershipGraph(linkedIds, relationships);
  const center = linked[0]!;

  return (
    <CollapsibleCard id="group-relationship-graph" title="Group graph">
      <p className="mb-3 text-xs text-zinc-500">
        Entities in this group and relationships between them only.
      </p>
      <EntityGraph
        center={center}
        entities={linked}
        relationships={graphScope.relationships}
        relationshipTypes={settings.relationshipTypes}
        scopeIds={linkedIds}
        workspaceGraphHref={`/graph?focus=${center.id}`}
      />
    </CollapsibleCard>
  );
}
