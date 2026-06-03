import { InvestigationPanel } from "@/components/investigation/investigation-panel";
import { listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { mergeScopeTimelineEvents } from "@/lib/investigation/stats";
import { getSettings } from "@/lib/storage";

export async function GroupInvestigationSection({
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

  const scoped = entities.filter((e) => linkedIds.includes(e.id));
  const timelineEvents = mergeScopeTimelineEvents([], scoped);

  return (
    <InvestigationPanel
      entities={entities}
      relationships={relationships}
      confidenceTypes={settings.confidenceTypes}
      entityTypes={settings.entityTypes}
      scopeIds={linkedIds}
      timelineEvents={timelineEvents}
      title="Group investigation insights"
    />
  );
}
