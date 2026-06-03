import { entityTypeColor } from "@/lib/entities/entity-types";
import type { Case, Entity, EntityType, Group, Settings } from "@/lib/types";
import type { GraphColorBy } from "@/lib/relationships/graph-view-state";

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: "#3b82f6",
  organization: "#a855f7",
  domain: "#10b981",
  general: "#71717a",
  email: "#f472b6",
  phone: "#38bdf8",
};

const CASE_PALETTE = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

function hashIndex(id: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

export function caseColor(caseId: string): string {
  return CASE_PALETTE[hashIndex(caseId, CASE_PALETTE.length)]!;
}

export function groupColor(group: Group): string {
  return group.color?.trim() || caseColor(group.id);
}

export function resolveEntityNodeColor(
  entity: Entity,
  colorBy: GraphColorBy,
  cases: Case[],
  groups: Group[],
  options?: {
    activeCaseId?: string | null;
    activeGroupId?: string | null;
    settings?: Pick<Settings, "entityTypes">;
  },
): string {
  if (colorBy === "entityType") {
    return (
      entityTypeColor(entity.type, options?.settings) ??
      ENTITY_TYPE_COLORS[entity.type]
    );
  }

  if (colorBy === "case") {
    const active = options?.activeCaseId;
    if (active && entity.caseIds?.includes(active)) return caseColor(active);
    const first = entity.caseIds?.[0];
    if (first) return caseColor(first);
    return "#52525b";
  }

  if (colorBy === "group") {
    const active = options?.activeGroupId;
    if (active && entity.groupIds?.includes(active)) {
      const g = groups.find((x) => x.id === active);
      return g ? groupColor(g) : caseColor(active);
    }
    const firstGroupId = entity.groupIds?.[0];
    if (firstGroupId) {
      const g = groups.find((x) => x.id === firstGroupId);
      return g ? groupColor(g) : caseColor(firstGroupId);
    }
    return "#52525b";
  }

  return (
    entityTypeColor(entity.type, options?.settings) ??
    ENTITY_TYPE_COLORS[entity.type]
  );
}

export type GraphLegendItem = {
  id: string;
  label: string;
  color: string;
};

export function buildGraphLegend(
  entities: Entity[],
  colorBy: GraphColorBy,
  cases: Case[],
  groups: Group[],
  settings?: Pick<Settings, "entityTypes">,
): GraphLegendItem[] {
  if (colorBy === "entityType") {
    const types = new Set(entities.map((e) => e.type));
    return [...types].map((type) => ({
      id: type,
      label:
        settings?.entityTypes.find((d) => d.id === type)?.label ?? type,
      color: entityTypeColor(type, settings),
    }));
  }

  if (colorBy === "case") {
    const ids = new Set<string>();
    for (const e of entities) {
      for (const cid of e.caseIds ?? []) ids.add(cid);
    }
    return [...ids].map((id) => {
      const c = cases.find((x) => x.id === id);
      return { id, label: c?.title ?? id, color: caseColor(id) };
    });
  }

  const ids = new Set<string>();
  for (const e of entities) {
    for (const gid of e.groupIds ?? []) ids.add(gid);
  }
  return [...ids].map((id) => {
    const g = groups.find((x) => x.id === id);
    return { id, label: g?.title ?? id, color: g ? groupColor(g) : caseColor(id) };
  });
}
