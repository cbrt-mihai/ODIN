import fs from "fs/promises";
import path from "path";
import { DEFAULT_SETTINGS } from "@/lib/defaults/settings";
import { mergeEntityTypeDefinitions } from "@/lib/entities/entity-types";
import type {
  ActivityFile,
  Case,
  Entity,
  Group,
  InboxFile,
  PlaybooksFile,
  RelationshipsFile,
  ResourcesFile,
  SavedViewsFile,
  Settings,
  ToolsFile,
} from "@/lib/types";
import { normalizeEntity } from "@/lib/entities/normalize";
import { DATA_PATHS, dataPath, getDataDir } from "./paths";

export { getDataDir, dataPath, DATA_PATHS } from "./paths";

export async function ensureDataDir() {
  const dirs = [
    getDataDir(),
    dataPath(DATA_PATHS.entitiesDir),
    dataPath(DATA_PATHS.casesDir),
    dataPath(DATA_PATHS.groupsDir),
    dataPath(DATA_PATHS.uploadsDir),
    dataPath(DATA_PATHS.snapshotsDir),
    dataPath(DATA_PATHS.trashDir),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export async function listJsonDir<T extends { id: string }>(
  dir: string,
): Promise<T[]> {
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const items = await Promise.all(
      jsonFiles.map((file) => readJsonFile<T>(path.join(dir, file))),
    );
    return items.filter((item) => item != null) as T[];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

export async function getSettings(): Promise<Settings> {
  await ensureDataDir();
  const existing = await readJsonFile<
    Settings & {
      scriptExecutables?: Record<string, string>;
      allowedScriptKeys?: string[];
    }
  >(dataPath(DATA_PATHS.settings));
  if (existing) {
    const { scriptExecutables: _s, allowedScriptKeys: _a, ...settings } =
      existing;
    const knownFieldIds = new Set(settings.fieldTypes.map((f) => f.id));
    const missingFieldTypes = DEFAULT_SETTINGS.fieldTypes.filter(
      (f) => !knownFieldIds.has(f.id),
    );
    const entityTypes = mergeEntityTypeDefinitions(settings.entityTypes);
    if (missingFieldTypes.length > 0) {
      return {
        ...settings,
        entityTypes,
        fieldTypes: [...settings.fieldTypes, ...missingFieldTypes],
      };
    }
    return { ...settings, entityTypes };
  }
  await writeJsonFile(dataPath(DATA_PATHS.settings), DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings) {
  await writeJsonFile(dataPath(DATA_PATHS.settings), settings);
}

export async function getTools(): Promise<ToolsFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<ToolsFile>(dataPath(DATA_PATHS.tools))) ?? {
      tools: [],
    }
  );
}

export async function saveTools(data: ToolsFile) {
  await writeJsonFile(dataPath(DATA_PATHS.tools), data);
}

export async function getResources(): Promise<ResourcesFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<ResourcesFile>(dataPath(DATA_PATHS.resources))) ?? {
      resources: [],
    }
  );
}

export async function saveResources(data: ResourcesFile) {
  await writeJsonFile(dataPath(DATA_PATHS.resources), data);
}

export async function getRelationships(): Promise<RelationshipsFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<RelationshipsFile>(
      dataPath(DATA_PATHS.relationships),
    )) ?? { relationships: [] }
  );
}

export async function saveRelationships(data: RelationshipsFile) {
  await writeJsonFile(dataPath(DATA_PATHS.relationships), data);
}

export async function getInbox(): Promise<InboxFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<InboxFile>(dataPath(DATA_PATHS.inbox))) ?? {
      items: [],
    }
  );
}

export async function saveInbox(data: InboxFile) {
  await writeJsonFile(dataPath(DATA_PATHS.inbox), data);
}

export async function getPlaybooks(): Promise<PlaybooksFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<PlaybooksFile>(dataPath(DATA_PATHS.playbooks))) ?? {
      playbooks: [],
    }
  );
}

export async function savePlaybooks(data: PlaybooksFile) {
  await writeJsonFile(dataPath(DATA_PATHS.playbooks), data);
}

export async function getActivity(): Promise<ActivityFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<ActivityFile>(dataPath(DATA_PATHS.activity))) ?? {
      entries: [],
    }
  );
}

export async function getSavedViews(): Promise<SavedViewsFile> {
  await ensureDataDir();
  return (
    (await readJsonFile<SavedViewsFile>(dataPath(DATA_PATHS.savedViews))) ?? {
      views: [],
    }
  );
}

export async function getEntities(): Promise<Entity[]> {
  await ensureDataDir();
  const raw = await listJsonDir<Entity>(dataPath(DATA_PATHS.entitiesDir));
  return raw.map(normalizeEntity);
}

export async function getEntity(id: string): Promise<Entity | null> {
  const raw = await readJsonFile<Entity>(
    dataPath(DATA_PATHS.entitiesDir, `${id}.json`),
  );
  return raw ? normalizeEntity(raw) : null;
}

export async function saveEntity(entity: Entity) {
  const normalized = normalizeEntity(entity);
  await writeJsonFile(
    dataPath(DATA_PATHS.entitiesDir, `${normalized.id}.json`),
    normalized,
  );
}

export async function deleteEntityFile(id: string) {
  await fs.unlink(dataPath(DATA_PATHS.entitiesDir, `${id}.json`));
}

export async function getCases(): Promise<Case[]> {
  await ensureDataDir();
  const { normalizeCase } = await import("@/lib/cases/normalize");
  const cases = await listJsonDir<Case>(dataPath(DATA_PATHS.casesDir));
  return cases.map(normalizeCase);
}

export async function getCase(id: string): Promise<Case | null> {
  const { normalizeCase } = await import("@/lib/cases/normalize");
  const c = await readJsonFile<Case>(dataPath(DATA_PATHS.casesDir, `${id}.json`));
  return c ? normalizeCase(c) : null;
}

export async function saveCase(caseData: Case) {
  await writeJsonFile(
    dataPath(DATA_PATHS.casesDir, `${caseData.id}.json`),
    caseData,
  );
}

export async function deleteCaseFile(id: string) {
  await fs.unlink(dataPath(DATA_PATHS.casesDir, `${id}.json`));
}

export async function getGroups(): Promise<Group[]> {
  await ensureDataDir();
  const { normalizeGroup } = await import("@/lib/groups/normalize");
  const groups = await listJsonDir<Group>(dataPath(DATA_PATHS.groupsDir));
  return groups.map(normalizeGroup);
}

export async function getGroup(id: string): Promise<Group | null> {
  const { normalizeGroup } = await import("@/lib/groups/normalize");
  const group = await readJsonFile<Group>(
    dataPath(DATA_PATHS.groupsDir, `${id}.json`),
  );
  return group ? normalizeGroup(group) : null;
}

export async function saveGroup(group: Group) {
  await writeJsonFile(
    dataPath(DATA_PATHS.groupsDir, `${group.id}.json`),
    group,
  );
}

export async function deleteGroupFile(id: string) {
  await fs.unlink(dataPath(DATA_PATHS.groupsDir, `${id}.json`));
}
