import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GroupEditor } from "@/components/groups/group-editor";
import { ReferenceProvider } from "@/components/references/reference-context";
import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { GroupEntitySections } from "@/components/groups/group-entity-sections";
import { GroupGraphSection } from "@/components/groups/group-graph-section";
import { GroupInvestigationSection } from "@/components/groups/group-investigation-section";
import { getGroupById, listGroups } from "@/lib/actions/groups";
import { GroupCaseLinker } from "@/components/groups/group-case-linker";
import { GroupGroupLinker } from "@/components/groups/group-group-linker";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

function EntitySectionsFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/50" />
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/50" />
    </div>
  );
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, entities, cases, allGroups] = await Promise.all([
    getGroupById(id),
    listEntities(),
    listCases(),
    listGroups(),
  ]);

  if (!group) notFound();

  return (
    <ReferenceProvider entities={entities} cases={cases}>
    <div className="space-y-8">
      <GroupEditor group={group} entities={entities} cases={cases} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CollapsibleCard
          id="group-linked-cases"
          title="Linked cases"
          defaultOpen={false}
        >
          <GroupCaseLinker
            groupId={group.id}
            cases={cases}
            linkedCaseIds={group.caseIds ?? []}
          />
        </CollapsibleCard>
        <CollapsibleCard
          id="group-linked-groups"
          title="Linked groups"
          defaultOpen={false}
        >
          <GroupGroupLinker
            groupId={group.id}
            groups={allGroups}
            linkedGroupIds={group.linkedGroupIds ?? []}
          />
        </CollapsibleCard>
      </div>

      {group.entityIds.length > 0 && (
        <>
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50" />
            }
          >
            <GroupInvestigationSection linkedIds={group.entityIds} />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50" />
            }
          >
            <GroupGraphSection linkedIds={group.entityIds} />
          </Suspense>
        </>
      )}

      <Suspense fallback={<EntitySectionsFallback />}>
        <GroupEntitySections groupId={group.id} linkedIds={group.entityIds} />
      </Suspense>
    </div>
    </ReferenceProvider>
  );
}
