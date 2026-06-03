import type { RelationshipsFile } from "@/lib/types";

type RecordWithId = { id: string };

export function mergeRecordArrays<T extends RecordWithId>(
  local: T[],
  incoming: T[],
  options: {
    onConflict: (local: T, incoming: T) => "keep_local" | "use_incoming" | "both";
    idMap?: Record<string, string>;
  },
): T[] {
  const byId = new Map(local.map((r) => [r.id, r]));
  const result = [...local];

  for (const item of incoming) {
    const mappedId = options.idMap?.[item.id] ?? item.id;
    const toAdd = mappedId !== item.id ? { ...item, id: mappedId } : item;
    const existing = byId.get(mappedId);

    if (!existing) {
      result.push(toAdd);
      byId.set(mappedId, toAdd);
      continue;
    }

    const decision = options.onConflict(existing, toAdd);
    if (decision === "use_incoming") {
      const idx = result.findIndex((r) => r.id === mappedId);
      if (idx >= 0) result[idx] = toAdd;
      byId.set(mappedId, toAdd);
    } else if (decision === "both") {
      const newId = `${mappedId}-imported`;
      const copy = { ...toAdd, id: newId };
      result.push(copy);
      byId.set(newId, copy);
    }
  }

  return result;
}

export function mergeRelationshipsFile(
  local: RelationshipsFile,
  incoming: RelationshipsFile,
  onConflict: (id: string) => "keep_local" | "use_incoming" | "skip",
): RelationshipsFile {
  const byId = new Map(local.relationships.map((r) => [r.id, r]));
  const merged = [...local.relationships];

  for (const rel of incoming.relationships) {
    const existing = byId.get(rel.id);
    if (!existing) {
      merged.push(rel);
      byId.set(rel.id, rel);
      continue;
    }
    const decision = onConflict(rel.id);
    if (decision === "use_incoming") {
      const idx = merged.findIndex((r) => r.id === rel.id);
      if (idx >= 0) merged[idx] = rel;
    }
  }

  return { relationships: merged };
}

export function mergeToolsFile(
  local: { tools: RecordWithId[] },
  incoming: { tools: RecordWithId[] },
): { tools: RecordWithId[] } {
  return {
    tools: mergeRecordArrays(local.tools, incoming.tools, {
      onConflict: () => "keep_local",
    }),
  };
}

export function mergeResourcesFile(
  local: { resources: RecordWithId[] },
  incoming: { resources: RecordWithId[] },
): { resources: RecordWithId[] } {
  return {
    resources: mergeRecordArrays(local.resources, incoming.resources, {
      onConflict: () => "keep_local",
    }),
  };
}

export function mergePlaybooksFile(
  local: { playbooks: RecordWithId[] },
  incoming: { playbooks: RecordWithId[] },
): { playbooks: RecordWithId[] } {
  return {
    playbooks: mergeRecordArrays(local.playbooks, incoming.playbooks, {
      onConflict: () => "keep_local",
    }),
  };
}

export function mergeInboxFile(
  local: { items: RecordWithId[] },
  incoming: { items: RecordWithId[] },
): { items: RecordWithId[] } {
  return {
    items: mergeRecordArrays(local.items, incoming.items, {
      onConflict: () => "keep_local",
    }),
  };
}
