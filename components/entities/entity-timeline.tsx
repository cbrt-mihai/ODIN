"use client";

import { TimelinePanel } from "@/components/timeline/timeline-panel";
import {
  addEntityEvent,
  deleteEntityEvent,
  updateEntityEvent,
} from "@/lib/actions/timeline";
import type { TimelineEvent } from "@/lib/types";

export function EntityTimeline({
  entityId,
  events,
  eventTypes,
}: {
  entityId: string;
  events: TimelineEvent[];
  eventTypes: string[];
}) {
  return (
    <TimelinePanel
      storageKey="entity-timeline"
      events={events}
      eventTypes={eventTypes}
      onAdd={async (input) => {
        await addEntityEvent(entityId, input);
      }}
      onUpdate={async (eventId, input) => {
        await updateEntityEvent(entityId, eventId, input);
      }}
      onDelete={async (eventId) => {
        await deleteEntityEvent(entityId, eventId);
      }}
    />
  );
}
