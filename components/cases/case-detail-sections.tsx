import Link from "next/link";
import { Suspense } from "react";
import { CaseEntityLinker } from "@/components/cases/case-entity-linker";
import { InvestigationPanel } from "@/components/investigation/investigation-panel";
import { EntityTypeBadge } from "@/components/entities/entity-type-badge";
import { EntityGraph } from "@/components/relationships/entity-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeScopeTimelineEvents } from "@/lib/investigation/stats";
import { listRelationships } from "@/lib/actions/relationships";
import { listEntities } from "@/lib/actions/entities";
import { scopeMembershipGraph } from "@/lib/relationships/graph-scope";
import { getSettings } from "@/lib/storage";
import type { Case } from "@/lib/types";

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

async function CaseLinkedSections({
  caseData,
}: {
  caseData: Case;
}) {
  const [entities, settings, relationships] = await Promise.all([
    listEntities(),
    getSettings(),
    listRelationships(),
  ]);

  const linked = entities.filter((e) => caseData.entityIds.includes(e.id));
  const graphScope = scopeMembershipGraph(caseData.entityIds, relationships);
  const timelineEvents = mergeScopeTimelineEvents(caseData.events, linked);

  if (linked.length === 0) return null;

  const graphCenter =
    linked.find((e) => e.id === caseData.entityIds[0]) ?? linked[0]!;

  return (
    <>
      <InvestigationPanel
        entities={entities}
        relationships={relationships}
        confidenceTypes={settings.confidenceTypes}
        entityTypes={settings.entityTypes}
        scopeIds={caseData.entityIds}
        timelineEvents={timelineEvents}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Case graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-500">
            Entities linked to this case and relationships between them only.
          </p>
          <EntityGraph
            center={graphCenter}
            entities={linked}
            relationships={graphScope.relationships}
            relationshipTypes={settings.relationshipTypes}
            scopeIds={caseData.entityIds}
            workspaceGraphHref={`/graph?focus=${graphCenter.id}`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Linked entities ({linked.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {linked.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/entities/${e.id}`}
                  className="flex items-center gap-2 text-sm hover:text-blue-400"
                >
                  <EntityTypeBadge type={e.type} />
                  {e.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

async function CaseEntityLinkerSection({
  caseId,
  entityIds,
}: {
  caseId: string;
  entityIds: string[];
}) {
  const entities = await listEntities();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Link entity</CardTitle>
      </CardHeader>
      <CardContent>
        <CaseEntityLinker
          caseId={caseId}
          entities={entities}
          linkedIds={entityIds}
        />
      </CardContent>
    </Card>
  );
}

export function CaseLinkedSectionsSuspense({ caseData }: { caseData: Case }) {
  if (caseData.entityIds.length === 0) return null;
  return (
    <Suspense fallback={<SectionFallback title="Investigation" />}>
      <CaseLinkedSections caseData={caseData} />
    </Suspense>
  );
}

export function CaseEntityLinkerSuspense({
  caseId,
  entityIds,
}: {
  caseId: string;
  entityIds: string[];
}) {
  return (
    <Suspense fallback={<SectionFallback title="Link entity" />}>
      <CaseEntityLinkerSection caseId={caseId} entityIds={entityIds} />
    </Suspense>
  );
}
