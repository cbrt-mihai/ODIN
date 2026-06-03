import { Suspense } from "react";
import { EntityLinksPanel } from "@/components/entities/entity-links-panel";
import { SnapshotsPanel } from "@/components/entities/snapshots-panel";
import { EntityGraphLazy } from "@/components/relationships/entity-graph-lazy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { listRelationships } from "@/lib/actions/relationships";
import { getSnapshotsForEntity } from "@/lib/actions/snapshots";
import { scopeEntityEgoGraph } from "@/lib/relationships/graph-scope";
import { getSettings } from "@/lib/storage";
import type { Entity } from "@/lib/types";

function SectionFallback({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-16 animate-pulse rounded-md bg-zinc-900" />
      </CardContent>
    </Card>
  );
}

async function RelationshipGraphSection({
  center,
  allEntities,
}: {
  center: Entity;
  allEntities: Entity[];
}) {
  const [relationships, settings] = await Promise.all([
    listRelationships(),
    getSettings(),
  ]);
  const scoped = scopeEntityEgoGraph(center.id, relationships);
  const scopedEntities = allEntities.filter((e) =>
    scoped.entityIds.includes(e.id),
  );

  return (
    <CollapsibleCard id="entity-relationship-graph" title="Relationship graph">
      <p className="mb-3 text-xs text-zinc-500">
        This entity and its direct relationship neighborhood only. For the full
        workspace, use{" "}
        <a href="/graph" className="text-blue-400 hover:underline">
          Graph
        </a>{" "}
        in the sidebar.
      </p>
      <EntityGraphLazy
        center={center}
        entities={scopedEntities}
        relationships={scoped.relationships}
        relationshipTypes={settings.relationshipTypes}
        scopeIds={scoped.entityIds}
        workspaceGraphHref={`/graph?focus=${center.id}`}
      />
    </CollapsibleCard>
  );
}

async function SnapshotsSection({ entityId }: { entityId: string }) {
  const snapshots = await getSnapshotsForEntity(entityId);
  return <SnapshotsPanel entityId={entityId} snapshots={snapshots} />;
}

export function EntityGraphSuspense({
  center,
  allEntities,
}: {
  center: Entity;
  allEntities: Entity[];
}) {
  return (
    <Suspense fallback={<SectionFallback title="Relationship graph" />}>
      <RelationshipGraphSection center={center} allEntities={allEntities} />
    </Suspense>
  );
}

export function EntityLinksSuspense({
  entityId,
  allEntities,
}: {
  entityId: string;
  allEntities: Entity[];
}) {
  return (
    <Suspense fallback={<SectionFallback title="Linked entities" />}>
      <EntityLinksPanel entityId={entityId} entities={allEntities} />
    </Suspense>
  );
}

export function EntitySnapshotsSuspense({ entityId }: { entityId: string }) {
  return (
    <Suspense fallback={<SectionFallback title="Snapshots" />}>
      <SnapshotsSection entityId={entityId} />
    </Suspense>
  );
}
