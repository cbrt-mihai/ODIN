import type { MergeListItem } from "@/lib/entities/merge-analysis";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export interface MergeListPairRow {
  key: string;
  label: string;
  summary: string;
  primary?: MergeListItem;
  secondary?: MergeListItem;
}

export function pairMergeListItems(items: MergeListItem[]): MergeListPairRow[] {
  const byKey = new Map<string, MergeListPairRow>();

  for (const item of items) {
    const key = `${norm(item.label)}::${norm(item.summary)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        key,
        label: item.label,
        summary: item.summary,
        ...(item.source === "primary"
          ? { primary: item }
          : { secondary: item }),
      });
      continue;
    }
    if (item.source === "primary") existing.primary = item;
    else existing.secondary = item;
  }

  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function mergeEntryPreview(body: string | undefined, max = 320): string {
  const text = body?.trim();
  if (!text) return "(No body text)";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
