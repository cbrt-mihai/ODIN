import { timelineBounds } from "@/lib/timeline/layout";
import type { ActivityEntry, Entity, Relationship, TimelineEvent } from "@/lib/types";

export type ScopedTimelineEvent = TimelineEvent & {
  source?: "case" | "entity";
  sourceLabel?: string;
};

export function relationshipDegrees(
  scopeIds: string[],
  relationships: Relationship[],
): { entityId: string; degree: number }[] {
  const scope = new Set(scopeIds);
  const degrees = new Map<string, number>();

  for (const id of scopeIds) {
    degrees.set(id, 0);
  }

  for (const r of relationships) {
    const inScope =
      scope.has(r.fromEntityId) && scope.has(r.toEntityId);
    if (!inScope) continue;
    degrees.set(r.fromEntityId, (degrees.get(r.fromEntityId) ?? 0) + 1);
    degrees.set(r.toEntityId, (degrees.get(r.toEntityId) ?? 0) + 1);
  }

  return [...degrees.entries()]
    .map(([entityId, degree]) => ({ entityId, degree }))
    .filter((d) => d.degree > 0)
    .sort((a, b) => b.degree - a.degree);
}

export function mergeScopeTimelineEvents(
  caseEvents: TimelineEvent[],
  entities: Entity[],
): ScopedTimelineEvent[] {
  const merged: ScopedTimelineEvent[] = [
    ...caseEvents.map((e) => ({
      ...e,
      source: "case" as const,
      sourceLabel: "Case",
    })),
  ];

  for (const entity of entities) {
    for (const ev of entity.events) {
      merged.push({
        ...ev,
        source: "entity",
        sourceLabel: entity.displayName,
      });
    }
  }

  return merged.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

export function activityByDay(
  entries: ActivityEntry[],
  days = 30,
): { date: string; count: number }[] {
  const now = new Date();
  const buckets: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: key, count: 0 });
  }

  const index = new Map(buckets.map((b, i) => [b.date, i]));

  for (const entry of entries) {
    const key = entry.at.slice(0, 10);
    const idx = index.get(key);
    if (idx !== undefined) {
      buckets[idx].count += 1;
    }
  }

  return buckets;
}

export function timelineRange(events: ScopedTimelineEvent[]) {
  return timelineBounds(events);
}
