import { WorkspaceGraph } from "@/components/graph/workspace-graph";
import { PageHeader } from "@/components/layout/page-header";
import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listGroups } from "@/lib/actions/groups";
import { listRelationships } from "@/lib/actions/relationships";
import { getSettings } from "@/lib/storage";

export async function GraphPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const focusRaw = query.focus;
  const focusId =
    typeof focusRaw === "string"
      ? focusRaw
      : Array.isArray(focusRaw)
        ? focusRaw[0]
        : undefined;

  const [entities, relationships, cases, groups, settings] =
    await Promise.all([
      listEntities(),
      listRelationships(),
      listCases(),
      listGroups(),
      getSettings(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationship graph"
        subtitle="Full workspace graph with filters, gravity layout, and case or group coloring. Entity, case, and group pages show smaller scoped graphs only."
      />
      {entities.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No entities in the workspace yet. Create entities and relationships to
          use the graph.
        </p>
      ) : (
        <WorkspaceGraph
          entities={entities}
          relationships={relationships}
          cases={cases}
          groups={groups}
          relationshipTypes={settings.relationshipTypes}
          confidenceTypes={settings.confidenceTypes}
          entityTypes={settings.entityTypes}
          initialFocusId={focusId}
        />
      )}
    </div>
  );
}
