export type PanelScope = "entity" | "case";

const STORAGE_PREFIX = "theblacklist:panel-order";

export const DEFAULT_ENTITY_PANEL_ORDER = [
  "duplicates",
  "investigation",
  "add-relationship",
  "timeline",
  "graph",
  "links",
  "snapshots",
] as const;

export const DEFAULT_CASE_PANEL_ORDER = [
  "playbooks",
  "timeline",
  "linked-cases",
  "investigation",
  "entity-linker",
] as const;

function storageKey(scope: PanelScope) {
  return `${STORAGE_PREFIX}:${scope}`;
}

export function readPanelOrder(scope: PanelScope): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

export function writePanelOrder(scope: PanelScope, order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(order));
  } catch {
    // ignore quota / private browsing
  }
}

export function mergePanelOrder(
  scope: PanelScope,
  saved: string[] | null,
): string[] {
  const defaults: string[] =
    scope === "entity"
      ? [...DEFAULT_ENTITY_PANEL_ORDER]
      : [...DEFAULT_CASE_PANEL_ORDER];
  if (!saved?.length) return defaults;
  const known = new Set<string>(defaults);
  const ordered = saved.filter((id) => known.has(id));
  for (const id of defaults) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}
