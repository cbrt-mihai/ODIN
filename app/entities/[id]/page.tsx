import { notFound } from "next/navigation";
import { AddRelationshipForm } from "@/components/entities/add-relationship-form";
import { EntityDuplicatesPanel } from "@/components/entities/entity-duplicates-panel";
import {
  EntityGraphSuspense,
  EntityLinksSuspense,
  EntitySnapshotsSuspense,
} from "@/components/entities/entity-detail-sections";
import { EntityInvestigationPanel } from "@/components/investigation/investigation-panel";
import { EntityEditor } from "@/components/entities/entity-editor";
import { ReferenceProvider } from "@/components/references/reference-context";
import { EntityReportExportButtons } from "@/components/reports/report-export-buttons";
import { EntityTimeline } from "@/components/entities/entity-timeline";
import { ReorderablePanels } from "@/components/layout/reorderable-panels";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { listCases } from "@/lib/actions/cases";
import { getEntityById, listEntities } from "@/lib/actions/entities";
import { listGroups } from "@/lib/actions/groups";
import { isEntityPinned } from "@/lib/actions/saved-views";
import { getSettings } from "@/lib/storage";
import { parseEditFocusFromSearchParams } from "@/lib/entities/edit-focus";

export default async function EntityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const initialFocus = parseEditFocusFromSearchParams(query);
  const [entity, allEntities, settings, cases, groups, pinnedToDashboard] =
    await Promise.all([
      getEntityById(id),
      listEntities(),
      getSettings(),
      listCases(),
      listGroups(),
      isEntityPinned(id),
    ]);

  if (!entity) notFound();

  const others = allEntities.filter((e) => e.id !== entity.id);

  return (
    <ReferenceProvider entities={allEntities} cases={cases}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
        <p className="text-sm text-zinc-400">Export entity report</p>
        <EntityReportExportButtons entityId={entity.id} />
      </div>
      <EntityEditor
        entity={entity}
        allEntities={allEntities}
        cases={cases}
        groups={groups}
        confidenceTypes={settings.confidenceTypes}
        fieldTypes={settings.fieldTypes}
        initialFocus={initialFocus}
        pinnedToDashboard={pinnedToDashboard}
      />

      <ReorderablePanels
        scope="entity"
        panels={[
          {
            id: "duplicates",
            defaultOpen: false,
            node: (
              <CollapsibleCard
                id="entity-duplicates"
                title="Possible duplicates"
                defaultOpen={false}
              >
                <EntityDuplicatesPanel
                  entity={entity}
                  allEntities={allEntities}
                />
              </CollapsibleCard>
            ),
          },
          {
            id: "investigation",
            defaultOpen: false,
            node: (
              <EntityInvestigationPanel
                entity={entity}
                confidenceTypes={settings.confidenceTypes}
              />
            ),
          },
          {
            id: "add-relationship",
            defaultOpen: false,
            node: (
              <CollapsibleCard
                id="entity-add-relationship"
                title="Add relationship"
                defaultOpen={false}
              >
                <AddRelationshipForm
                  entity={entity}
                  otherEntities={others}
                  relationshipTypes={settings.relationshipTypes}
                  confidenceTypes={settings.confidenceTypes}
                />
              </CollapsibleCard>
            ),
          },
          {
            id: "timeline",
            defaultOpen: true,
            node: (
              <EntityTimeline
                entityId={entity.id}
                events={entity.events}
                eventTypes={settings.eventTypes}
              />
            ),
          },
          {
            id: "graph",
            defaultOpen: true,
            node: (
              <EntityGraphSuspense center={entity} allEntities={allEntities} />
            ),
          },
          {
            id: "links",
            defaultOpen: false,
            node: (
              <EntityLinksSuspense
                entityId={entity.id}
                allEntities={allEntities}
              />
            ),
          },
          {
            id: "snapshots",
            defaultOpen: false,
            node: <EntitySnapshotsSuspense entityId={entity.id} />,
          },
        ]}
      />
    </div>
    </ReferenceProvider>
  );
}
