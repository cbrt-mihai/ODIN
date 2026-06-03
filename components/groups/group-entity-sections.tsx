import { GroupEntityLinker } from "@/components/groups/group-entity-linker";
import { GroupLinkedEntities } from "@/components/groups/group-linked-entities";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { listEntities, listEntitySummaries } from "@/lib/actions/entities";

export async function GroupEntitySections({
  groupId,
  linkedIds,
}: {
  groupId: string;
  linkedIds: string[];
}) {
  const [summaries, allEntities] = await Promise.all([
    listEntitySummaries(),
    listEntities(),
  ]);
  const linked = summaries.filter((e) => linkedIds.includes(e.id));

  return (
    <>
      <CollapsibleCard id="group-link-entity" title="Link entity">
        <GroupEntityLinker
          groupId={groupId}
          entities={allEntities}
          linkedIds={linkedIds}
        />
      </CollapsibleCard>

      <CollapsibleCard
        id="group-linked-entities"
        title={`Linked entities (${linked.length})`}
      >
        <GroupLinkedEntities groupId={groupId} entities={linked} />
      </CollapsibleCard>
    </>
  );
}
