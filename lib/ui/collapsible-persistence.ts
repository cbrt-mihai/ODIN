const STORAGE_KEY = "theblacklist:collapsible-sections";

export type CollapsibleSectionsState = Record<string, boolean>;

function loadAll(): CollapsibleSectionsState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CollapsibleSectionsState;
  } catch {
    return {};
  }
}

export function readCollapsibleOpen(key: string): boolean | undefined {
  const value = loadAll()[key];
  return typeof value === "boolean" ? value : undefined;
}

export function writeCollapsibleOpen(key: string, open: boolean) {
  if (typeof window === "undefined") return;
  try {
    const all = loadAll();
    all[key] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / private browsing
  }
}
