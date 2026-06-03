import type { PanelScope } from "@/lib/ui/panel-order";

export type PanelColumnCount = 1 | 2 | 3 | 4;

const COLUMNS_PREFIX = "theblacklist:panel-columns";
/** @deprecated Legacy stack/grid toggle — migrated to column count. */
const LAYOUT_PREFIX = "theblacklist:panel-layout";

export function readPanelColumnCount(scope: PanelScope): PanelColumnCount {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(`${COLUMNS_PREFIX}:${scope}`);
    if (raw) {
      const n = Number(raw);
      if (n >= 1 && n <= 4) return n as PanelColumnCount;
    }
    const legacy = localStorage.getItem(`${LAYOUT_PREFIX}:${scope}`);
    if (legacy === "grid") return 2;
  } catch {
    // ignore
  }
  return 1;
}

export function writePanelColumnCount(
  scope: PanelScope,
  count: PanelColumnCount,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${COLUMNS_PREFIX}:${scope}`, String(count));
  } catch {
    // ignore
  }
}

/** Distributes panel ids into columns top-to-bottom, left-to-right. */
export function distributePanelsToColumns(
  ids: string[],
  columnCount: PanelColumnCount,
): string[][] {
  const cols = Math.max(1, Math.min(4, columnCount));
  const buckets: string[][] = Array.from({ length: cols }, () => []);
  if (!ids.length) return buckets;

  const base = Math.floor(ids.length / cols);
  const extra = ids.length % cols;
  let idx = 0;
  for (let c = 0; c < cols; c++) {
    const count = base + (c < extra ? 1 : 0);
    buckets[c] = ids.slice(idx, idx + count);
    idx += count;
  }
  return buckets;
}
