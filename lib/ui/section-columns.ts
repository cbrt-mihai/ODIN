import {
  distributePanelsToColumns,
  type PanelColumnCount,
} from "@/lib/ui/panel-columns";

export type SectionColumnCount = PanelColumnCount;

const COLUMNS_PREFIX = "theblacklist:section-columns";

export function readEntitySectionColumnCount(
  entityId: string,
): SectionColumnCount {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(`${COLUMNS_PREFIX}:${entityId}`);
    if (raw) {
      const n = Number(raw);
      if (n >= 1 && n <= 4) return n as SectionColumnCount;
    }
  } catch {
    // ignore
  }
  return 1;
}

export function writeEntitySectionColumnCount(
  entityId: string,
  count: SectionColumnCount,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${COLUMNS_PREFIX}:${entityId}`, String(count));
  } catch {
    // ignore
  }
}

export { distributePanelsToColumns as distributeSectionsToColumns };
