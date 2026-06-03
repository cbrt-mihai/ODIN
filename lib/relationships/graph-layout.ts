const NODE_WIDTH = 160;
const NODE_HEIGHT = 72;
const RING_RADIUS = 220;
const ORPHAN_GAP_X = 200;
const ORPHAN_GAP_Y = 110;

export function layoutEntityGraphPositions(
  centerId: string,
  nodeIds: string[],
  edges: { source: string; target: string; bidirectional?: boolean }[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodeIds.length === 0) return positions;

  const idSet = new Set(nodeIds);
  const adj = new Map<string, Set<string>>();

  function link(a: string, b: string) {
    if (!idSet.has(a) || !idSet.has(b) || a === b) return;
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  }

  for (const e of edges) {
    link(e.source, e.target);
    if (e.bidirectional) link(e.target, e.source);
  }

  if (nodeIds.length === 1) {
    positions.set(nodeIds[0], { x: 0, y: 0 });
    return positions;
  }

  positions.set(centerId, { x: 0, y: 0 });

  const visited = new Set<string>([centerId]);
  const levels: string[][] = [];
  let frontier = [centerId];

  while (frontier.length > 0) {
    const next: string[] = [];
    const level: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adj.get(id) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        next.push(neighbor);
        level.push(neighbor);
      }
    }
    if (level.length > 0) levels.push(level);
    frontier = next;
  }

  levels.forEach((level, ring) => {
    const radius = (ring + 1) * RING_RADIUS;
    const step = (2 * Math.PI) / level.length;
    level.forEach((id, i) => {
      const angle = step * i - Math.PI / 2;
      positions.set(id, {
        x: Math.cos(angle) * radius - NODE_WIDTH / 2,
        y: Math.sin(angle) * radius - NODE_HEIGHT / 2,
      });
    });
  });

  const orphans = nodeIds.filter((id) => !visited.has(id));
  const cols = Math.max(1, Math.ceil(Math.sqrt(orphans.length)));
  const baseX = (levels.length + 1) * RING_RADIUS + NODE_WIDTH;

  orphans.forEach((id, i) => {
    positions.set(id, {
      x: baseX + (i % cols) * ORPHAN_GAP_X,
      y:
        Math.floor(i / cols) * ORPHAN_GAP_Y -
        ((cols - 1) * ORPHAN_GAP_Y) / 2,
    });
  });

  return positions;
}
