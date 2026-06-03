import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ActivitySparkline } from "@/components/investigation/activity-sparkline";
import { ConfidenceChart } from "@/components/investigation/confidence-chart";
import { EntityTypeChart } from "@/components/investigation/entity-type-chart";
import { IndicatorsPanel } from "@/components/investigation/indicators-panel";
import { RelationshipHubChart } from "@/components/investigation/relationship-hub-chart";
import { TimelineVisual } from "@/components/investigation/timeline-visual";
import { extractIndicatorsFromEntities } from "@/lib/osint/extract-indicators";
import type { ScopedTimelineEvent } from "@/lib/investigation/stats";
import type {
  ConfidenceTypeDefinition,
  Entity,
  EntityTypeDefinition,
  Relationship,
} from "@/lib/types";

export function InvestigationPanel({
  entities,
  relationships,
  confidenceTypes,
  entityTypes,
  scopeIds,
  timelineEvents,
  title = "Investigation insights",
  defaultOpen = true,
}: {
  entities: Entity[];
  relationships: Relationship[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entityTypes: EntityTypeDefinition[];
  scopeIds: string[];
  timelineEvents?: ScopedTimelineEvent[];
  title?: string;
  defaultOpen?: boolean;
}) {
  const scoped = entities.filter((e) => scopeIds.includes(e.id));
  const indicators = extractIndicatorsFromEntities(scoped);
  const hasTimeline = timelineEvents && timelineEvents.length > 0;

  if (scoped.length === 0) {
    return null;
  }

  return (
    <CollapsibleCard
      id="investigation-insights"
      title={title}
      defaultOpen={defaultOpen}
      contentClassName="space-y-8"
    >
      {hasTimeline && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Timeline map</h3>
          <TimelineVisual events={timelineEvents} />
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">
          Extracted indicators
        </h3>
        <p className="text-xs text-zinc-500">
          Emails, domains, URLs, and phones from entity fields and notes. Click
          to copy; use the source control to see which entity each value came
          from.
        </p>
        <IndicatorsPanel indicators={indicators} />
      </section>

      <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
        <section className="max-w-full space-y-2">
          <h3 className="text-sm font-medium text-zinc-300">Entity types</h3>
          <EntityTypeChart entities={scoped} entityTypes={entityTypes} />
        </section>

        <section className="max-w-full space-y-2">
          <h3 className="text-sm font-medium text-zinc-300">
            Confidence breakdown
          </h3>
          <ConfidenceChart
            entities={scoped}
            confidenceTypes={confidenceTypes}
          />
        </section>

        <section className="max-w-full space-y-2">
          <h3 className="text-sm font-medium text-zinc-300">
            Relationship hubs
          </h3>
          <p className="text-xs text-zinc-500">
            Most connected entities within scope.
          </p>
          <RelationshipHubChart
            entities={entities}
            relationships={relationships}
            scopeIds={scopeIds}
          />
        </section>
      </div>
    </CollapsibleCard>
  );
}

export function EntityInvestigationPanel({
  entity,
  confidenceTypes,
}: {
  entity: Entity;
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const indicators = extractIndicatorsFromEntities([entity]);
  const timelineEvents = entity.events.map((e) => ({
    ...e,
    source: "entity" as const,
    sourceLabel: entity.displayName,
  }));

  return (
    <CollapsibleCard
      id="entity-investigation-insights"
      title="Investigation insights"
      defaultOpen={false}
      contentClassName="space-y-8"
    >
      {timelineEvents.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Timeline map</h3>
          <TimelineVisual events={timelineEvents} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 @2xl/panel:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">
            Extracted indicators
          </h3>
          <IndicatorsPanel indicators={indicators} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">
            Confidence breakdown
          </h3>
          <ConfidenceChart
            entities={[entity]}
            confidenceTypes={confidenceTypes}
          />
        </section>
      </div>
    </CollapsibleCard>
  );
}

export { ActivitySparkline };
