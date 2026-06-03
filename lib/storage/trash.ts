import fs from "fs/promises";
import type {
  Case,
  Group,
  Playbook,
  Resource,
  Tool,
  TrashItemType,
} from "@/lib/types";
import {
  getCase,
  getCases,
  getEntities,
  getEntity,
  getGroup,
  getGroups,
  getPlaybooks,
  getRelationships,
  getResources,
  getTools,
  readJsonFile,
  saveCase,
  saveEntity,
  saveGroup,
  savePlaybooks,
  saveRelationships,
  saveResources,
  saveTools,
  writeJsonFile,
} from "./index";
import { DATA_PATHS, dataPath } from "./paths";

export type { TrashItemType };

export interface TrashEntry {
  id: string;
  itemType: TrashItemType;
  deletedAt: string;
  displayName: string;
  filePath: string;
}

function trashPayloadPath(itemType: TrashItemType, id: string) {
  return dataPath(DATA_PATHS.trashDir, `${itemType}-${id}.json`);
}

async function ensureTrashDir() {
  await fs.mkdir(dataPath(DATA_PATHS.trashDir), { recursive: true });
}

async function moveFileToTrash(src: string, itemType: TrashItemType, id: string) {
  await ensureTrashDir();
  const dest = trashPayloadPath(itemType, id);
  try {
    await fs.rename(src, dest);
  } catch {
    await fs.copyFile(src, dest);
    await fs.unlink(src);
  }
  return dest;
}

async function saveTrashIndex(entries: TrashEntry[]) {
  await ensureTrashDir();
  await writeJsonFile(dataPath(DATA_PATHS.trashDir, "index.json"), { entries });
}

export async function listTrash(): Promise<TrashEntry[]> {
  const index = await readJsonFile<{ entries: TrashEntry[] }>(
    dataPath(DATA_PATHS.trashDir, "index.json"),
  );
  return index?.entries ?? [];
}

async function pushTrashEntry(entry: Omit<TrashEntry, "deletedAt">) {
  const entries = await listTrash();
  entries.unshift({
    ...entry,
    deletedAt: new Date().toISOString(),
  });
  await saveTrashIndex(entries);
}

function findEntry(
  entries: TrashEntry[],
  id: string,
  itemType: TrashItemType,
) {
  return entries.find((e) => e.id === id && e.itemType === itemType);
}

async function detachCaseFromWorkspace(caseId: string) {
  const [entities, groups] = await Promise.all([getEntities(), getGroups()]);
  const now = new Date().toISOString();
  for (const entity of entities) {
    if (!(entity.caseIds ?? []).includes(caseId)) continue;
    entity.caseIds = entity.caseIds!.filter((cid) => cid !== caseId);
    entity.updatedAt = now;
    await saveEntity(entity);
  }
  for (const group of groups) {
    if (!(group.caseIds ?? []).includes(caseId)) continue;
    group.caseIds = group.caseIds!.filter((id) => id !== caseId);
    group.updatedAt = now;
    await saveGroup(group);
  }
}

async function restoreCaseLinks(caseData: Case) {
  const now = new Date().toISOString();
  for (const entityId of caseData.entityIds) {
    const entity = await getEntity(entityId);
    if (!entity) continue;
    if (!entity.caseIds?.includes(caseData.id)) {
      entity.caseIds = [...(entity.caseIds ?? []), caseData.id];
      entity.updatedAt = now;
      await saveEntity(entity);
    }
  }
  for (const groupId of caseData.groupIds ?? []) {
    const group = await getGroup(groupId);
    if (!group) continue;
    if (!group.caseIds?.includes(caseData.id)) {
      group.caseIds = [...(group.caseIds ?? []), caseData.id];
      group.updatedAt = now;
      await saveGroup(group);
    }
  }
}

async function detachGroupFromWorkspace(groupId: string) {
  const [entities, cases, groups] = await Promise.all([
    getEntities(),
    getCases(),
    getGroups(),
  ]);
  const now = new Date().toISOString();
  for (const entity of entities) {
    if (!(entity.groupIds ?? []).includes(groupId)) continue;
    entity.groupIds = entity.groupIds!.filter((gid) => gid !== groupId);
    entity.updatedAt = now;
    await saveEntity(entity);
  }
  for (const c of cases) {
    if (!(c.groupIds ?? []).includes(groupId)) continue;
    c.groupIds = c.groupIds!.filter((id) => id !== groupId);
    c.updatedAt = now;
    await saveCase(c);
  }
  for (const g of groups) {
    if (g.id === groupId) continue;
    if (!(g.linkedGroupIds ?? []).includes(groupId)) continue;
    g.linkedGroupIds = g.linkedGroupIds!.filter((id) => id !== groupId);
    g.updatedAt = now;
    await saveGroup(g);
  }
}

async function restoreGroupLinks(group: Group) {
  const now = new Date().toISOString();
  for (const entityId of group.entityIds) {
    const entity = await getEntity(entityId);
    if (!entity) continue;
    if (!entity.groupIds?.includes(group.id)) {
      entity.groupIds = [...(entity.groupIds ?? []), group.id];
      entity.updatedAt = now;
      await saveEntity(entity);
    }
  }
  for (const caseId of group.caseIds ?? []) {
    const c = await getCase(caseId);
    if (!c) continue;
    if (!(c.groupIds ?? []).includes(group.id)) {
      c.groupIds = [...(c.groupIds ?? []), group.id];
      c.updatedAt = now;
      await saveCase(c);
    }
  }
  for (const otherId of group.linkedGroupIds ?? []) {
    const other = await getGroup(otherId);
    if (!other) continue;
    if (!(other.linkedGroupIds ?? []).includes(group.id)) {
      other.linkedGroupIds = [...(other.linkedGroupIds ?? []), group.id];
      other.updatedAt = now;
      await saveGroup(other);
    }
  }
}

async function detachPlaybookFromCases(playbookId: string) {
  const cases = await getCases();
  const now = new Date().toISOString();
  for (const c of cases) {
    const hadPlaybook = (c.playbookIds ?? []).includes(playbookId);
    const hadProgress = c.playbookProgress.some(
      (p) => p.playbookId === playbookId,
    );
    if (!hadPlaybook && !hadProgress) continue;
    c.playbookIds = (c.playbookIds ?? []).filter((id) => id !== playbookId);
    c.playbookProgress = c.playbookProgress.filter(
      (p) => p.playbookId !== playbookId,
    );
    c.updatedAt = now;
    await saveCase(c);
  }
}

async function purgeCaseRelationships(caseId: string) {
  const { relationships } = await getRelationships();
  const filtered = relationships.filter((r) => r.caseId !== caseId);
  if (filtered.length !== relationships.length) {
    await saveRelationships({ relationships: filtered });
  }
}

async function purgeToolReferences(toolId: string) {
  const cases = await getCases();
  const now = new Date().toISOString();
  for (const c of cases) {
    if (!(c.toolIds ?? []).includes(toolId)) continue;
    c.toolIds = c.toolIds!.filter((id) => id !== toolId);
    c.updatedAt = now;
    await saveCase(c);
  }
  const { playbooks } = await getPlaybooks();
  let playbooksChanged = false;
  for (const pb of playbooks) {
    for (const step of pb.steps) {
      if (step.toolId === toolId) {
        delete step.toolId;
        playbooksChanged = true;
      }
    }
  }
  if (playbooksChanged) await savePlaybooks({ playbooks });
}

async function purgeResourceReferences(resourceId: string) {
  const cases = await getCases();
  const now = new Date().toISOString();
  for (const c of cases) {
    if (!(c.resourceIds ?? []).includes(resourceId)) continue;
    c.resourceIds = c.resourceIds!.filter((id) => id !== resourceId);
    c.updatedAt = now;
    await saveCase(c);
  }
  const { playbooks } = await getPlaybooks();
  let playbooksChanged = false;
  for (const pb of playbooks) {
    for (const step of pb.steps) {
      if (step.resourceId === resourceId) {
        delete step.resourceId;
        playbooksChanged = true;
      }
    }
  }
  if (playbooksChanged) await savePlaybooks({ playbooks });
}

export async function moveEntityToTrash(
  entityId: string,
  displayName: string,
) {
  const src = dataPath(DATA_PATHS.entitiesDir, `${entityId}.json`);
  const filePath = await moveFileToTrash(src, "entity", entityId);
  await pushTrashEntry({
    id: entityId,
    itemType: "entity",
    displayName,
    filePath,
  });
}

export async function moveCaseToTrash(caseId: string, displayName: string) {
  await detachCaseFromWorkspace(caseId);
  const src = dataPath(DATA_PATHS.casesDir, `${caseId}.json`);
  const filePath = await moveFileToTrash(src, "case", caseId);
  await pushTrashEntry({
    id: caseId,
    itemType: "case",
    displayName,
    filePath,
  });
}

export async function moveGroupToTrash(groupId: string, displayName: string) {
  await detachGroupFromWorkspace(groupId);
  const src = dataPath(DATA_PATHS.groupsDir, `${groupId}.json`);
  const filePath = await moveFileToTrash(src, "group", groupId);
  await pushTrashEntry({
    id: groupId,
    itemType: "group",
    displayName,
    filePath,
  });
}

export async function moveToolToTrash(tool: Tool) {
  const { tools } = await getTools();
  await saveTools({ tools: tools.filter((t) => t.id !== tool.id) });
  await ensureTrashDir();
  const filePath = trashPayloadPath("tool", tool.id);
  await writeJsonFile(filePath, tool);
  await pushTrashEntry({
    id: tool.id,
    itemType: "tool",
    displayName: tool.name,
    filePath,
  });
}

export async function moveResourceToTrash(resource: Resource) {
  const { resources } = await getResources();
  await saveResources({
    resources: resources.filter((r) => r.id !== resource.id),
  });
  await ensureTrashDir();
  const filePath = trashPayloadPath("resource", resource.id);
  await writeJsonFile(filePath, resource);
  await pushTrashEntry({
    id: resource.id,
    itemType: "resource",
    displayName: resource.name,
    filePath,
  });
}

export async function movePlaybookToTrash(playbook: Playbook) {
  await detachPlaybookFromCases(playbook.id);
  const { playbooks } = await getPlaybooks();
  await savePlaybooks({
    playbooks: playbooks.filter((p) => p.id !== playbook.id),
  });
  await ensureTrashDir();
  const filePath = trashPayloadPath("playbook", playbook.id);
  await writeJsonFile(filePath, playbook);
  await pushTrashEntry({
    id: playbook.id,
    itemType: "playbook",
    displayName: playbook.title,
    filePath,
  });
}

export async function restoreFromTrash(id: string, itemType: TrashItemType) {
  const entries = await listTrash();
  const entry = findEntry(entries, id, itemType);
  if (!entry) throw new Error("Not in trash");

  switch (itemType) {
    case "entity": {
      const dest = dataPath(DATA_PATHS.entitiesDir, `${id}.json`);
      await fs.mkdir(dataPath(DATA_PATHS.entitiesDir), { recursive: true });
      await fs.rename(entry.filePath, dest);
      break;
    }
    case "case": {
      const caseData = await readJsonFile<Case>(entry.filePath);
      if (!caseData) throw new Error("Trash payload missing");
      const dest = dataPath(DATA_PATHS.casesDir, `${id}.json`);
      await fs.mkdir(dataPath(DATA_PATHS.casesDir), { recursive: true });
      await fs.rename(entry.filePath, dest);
      await restoreCaseLinks(caseData);
      break;
    }
    case "group": {
      const group = await readJsonFile<Group>(entry.filePath);
      if (!group) throw new Error("Trash payload missing");
      const dest = dataPath(DATA_PATHS.groupsDir, `${id}.json`);
      await fs.mkdir(dataPath(DATA_PATHS.groupsDir), { recursive: true });
      await fs.rename(entry.filePath, dest);
      await restoreGroupLinks(group);
      break;
    }
    case "tool": {
      const tool = await readJsonFile<Tool>(entry.filePath);
      if (!tool) throw new Error("Trash payload missing");
      const { tools } = await getTools();
      if (!tools.some((t) => t.id === id)) {
        await saveTools({ tools: [...tools, tool] });
      }
      await fs.unlink(entry.filePath).catch(() => {});
      break;
    }
    case "resource": {
      const resource = await readJsonFile<Resource>(entry.filePath);
      if (!resource) throw new Error("Trash payload missing");
      const { resources } = await getResources();
      if (!resources.some((r) => r.id === id)) {
        await saveResources({ resources: [...resources, resource] });
      }
      await fs.unlink(entry.filePath).catch(() => {});
      break;
    }
    case "playbook": {
      const playbook = await readJsonFile<Playbook>(entry.filePath);
      if (!playbook) throw new Error("Trash payload missing");
      const { playbooks } = await getPlaybooks();
      if (!playbooks.some((p) => p.id === id)) {
        await savePlaybooks({ playbooks: [...playbooks, playbook] });
      }
      await fs.unlink(entry.filePath).catch(() => {});
      break;
    }
  }

  await saveTrashIndex(
    entries.filter((e) => !(e.id === id && e.itemType === itemType)),
  );
}

export async function permanentlyDeleteFromTrash(
  id: string,
  itemType: TrashItemType,
) {
  const entries = await listTrash();
  const entry = findEntry(entries, id, itemType);
  if (!entry) return;

  await fs.unlink(entry.filePath).catch(() => {});

  if (itemType === "case") await purgeCaseRelationships(id);
  if (itemType === "tool") await purgeToolReferences(id);
  if (itemType === "resource") await purgeResourceReferences(id);

  await saveTrashIndex(
    entries.filter((e) => !(e.id === id && e.itemType === itemType)),
  );
}

export async function restoreEntityFromTrash(entityId: string) {
  return restoreFromTrash(entityId, "entity");
}
