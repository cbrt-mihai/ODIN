import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { Case, Entity, Group } from "@/lib/types";
import type { GraphClusterBy } from "@/lib/relationships/graph-view-state";

type SimNode = {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

type SimLink = {
  source: string;
  target: string;
};

function clusterTargets(
  entities: Entity[],
  clusterBy: GraphClusterBy,
  cases: Case[],
  groups: Group[],
): Map<string, { x: number; y: number }> {
  const targets = new Map<string, { x: number; y: number }>();

  if (clusterBy === "case") {
    const caseIds = new Set<string>();
    for (const e of entities) {
      for (const cid of e.caseIds ?? []) caseIds.add(cid);
    }
    const list = [...caseIds];
    list.forEach((cid, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, list.length);
      const cx = Math.cos(angle) * 280;
      const cy = Math.sin(angle) * 200;
      for (const e of entities) {
        if (e.caseIds?.includes(cid)) {
          targets.set(e.id, { x: cx, y: cy });
        }
      }
    });
    return targets;
  }

  if (clusterBy === "group") {
    const groupIds = new Set<string>();
    for (const e of entities) {
      for (const gid of e.groupIds ?? []) groupIds.add(gid);
    }
    const list = [...groupIds];
    list.forEach((gid, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, list.length);
      const cx = Math.cos(angle) * 280;
      const cy = Math.sin(angle) * 200;
      for (const e of entities) {
        if (e.groupIds?.includes(gid)) {
          targets.set(e.id, { x: cx, y: cy });
        }
      }
    });
  }

  return targets;
}

export function runForceGraphLayout(
  seedPositions: Map<string, { x: number; y: number }>,
  links: SimLink[],
  entities: Entity[],
  options: {
    clusterBy: GraphClusterBy;
    cases: Case[];
    groups: Group[];
    tickCount?: number;
  },
): Map<string, { x: number; y: number }> {
  const nodes: SimNode[] = [...seedPositions.entries()].map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y,
  }));

  if (nodes.length === 0) return new Map();

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const simLinks = links
    .filter((l) => nodeById.has(l.source) && nodeById.has(l.target))
    .map((l) => ({ source: l.source, target: l.target }));

  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d) => (d as SimNode).id)
        .distance(140)
        .strength(0.6),
    )
    .force("charge", forceManyBody().strength(-320))
    .force("center", forceCenter(0, 0).strength(0.05));

  const targets = clusterTargets(
    entities,
    options.clusterBy,
    options.cases,
    options.groups,
  );

  if (options.clusterBy !== "none" && targets.size > 0) {
    const strength = 0.12;
    sim.force(
      "clusterX",
      forceX<SimNode>((n) => targets.get(n.id)?.x ?? 0).strength(strength),
    );
    sim.force(
      "clusterY",
      forceY<SimNode>((n) => targets.get(n.id)?.y ?? 0).strength(strength),
    );
  }

  sim.stop();
  const ticks = options.tickCount ?? 280;
  for (let i = 0; i < ticks; i++) sim.tick();

  return new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}
