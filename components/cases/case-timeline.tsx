"use client";

import { TimelinePanel } from "@/components/timeline/timeline-panel";
import {
  addCaseEvent,
  deleteCaseEvent,
  updateCaseEvent,
} from "@/lib/actions/timeline";
import type { TimelineEvent } from "@/lib/types";

export function CaseTimeline({
  caseId,
  events,
  eventTypes,
}: {
  caseId: string;
  events: TimelineEvent[];
  eventTypes: string[];
}) {
  return (
    <TimelinePanel
      storageKey="case-timeline"
      events={events}
      eventTypes={eventTypes}
      onAdd={async (input) => {
        await addCaseEvent(caseId, input);
      }}
      onUpdate={async (eventId, input) => {
        await updateCaseEvent(caseId, eventId, input);
      }}
      onDelete={async (eventId) => {
        await deleteCaseEvent(caseId, eventId);
      }}
    />
  );
}
