import { collectFieldValues } from "@/lib/entities/contact-fields";
import { homonymCount } from "@/lib/entities/disambiguate";
import { extractIndicatorsFromEntities } from "@/lib/osint/extract-indicators";
import type {
  ActivityEntry,
  Case,
  Entity,
  InboxItem,
  Relationship,
} from "@/lib/types";

export interface WorkspaceStats {
  entities: number;
  entitiesByType: Record<string, number>;
  cases: number;
  casesByStatus: Record<string, number>;
  relationships: number;
  inboxPending: number;
  duplicateNameClusters: number;
  entitiesWithProofs: number;
  totalTimelineEvents: number;
  indicators: {
    emails: number;
    urls: number;
    phones: number;
    domains: number;
  };
  activityLast7Days: number;
  activityLast30Days: number;
}

export function computeWorkspaceStats(input: {
  entities: Entity[];
  cases: Case[];
  relationships: Relationship[];
  inbox: InboxItem[];
  activity: ActivityEntry[];
}): WorkspaceStats {
  const { entities, cases, relationships, inbox, activity } = input;

  const entitiesByType: Record<string, number> = {};
  let entitiesWithProofs = 0;
  let totalTimelineEvents = 0;

  const nameBuckets = new Map<string, number>();

  for (const e of entities) {
    entitiesByType[e.type] = (entitiesByType[e.type] ?? 0) + 1;
    if (e.provenance?.proofs?.length) entitiesWithProofs += 1;
    totalTimelineEvents += e.events.length;

    const key = e.displayName.trim().toLowerCase();
    if (key.length >= 2) {
      nameBuckets.set(key, (nameBuckets.get(key) ?? 0) + 1);
    }
  }

  let duplicateNameClusters = 0;
  for (const count of nameBuckets.values()) {
    if (count > 1) duplicateNameClusters += 1;
  }

  const casesByStatus: Record<string, number> = {};
  for (const c of cases) {
    casesByStatus[c.status] = (casesByStatus[c.status] ?? 0) + 1;
  }

  const now = Date.now();
  const day = 86400000;
  let activityLast7Days = 0;
  let activityLast30Days = 0;
  for (const entry of activity) {
    const age = now - new Date(entry.at).getTime();
    if (age <= 7 * day) activityLast7Days += 1;
    if (age <= 30 * day) activityLast30Days += 1;
  }

  const indicators = extractIndicatorsFromEntities(entities);

  return {
    entities: entities.length,
    entitiesByType,
    cases: cases.length,
    casesByStatus,
    relationships: relationships.length,
    inboxPending: inbox.filter((i) => i.status === "pending").length,
    duplicateNameClusters,
    entitiesWithProofs,
    totalTimelineEvents,
    indicators: {
      emails: indicators.emails.length,
      urls: indicators.urls.length,
      phones: indicators.phones.length,
      domains: indicators.domains.length,
    },
    activityLast7Days,
    activityLast30Days,
  };
}

export function entityHasContact(entity: Entity): boolean {
  return (
    collectFieldValues(entity, "email").length > 0 ||
    collectFieldValues(entity, "phone").length > 0
  );
}
