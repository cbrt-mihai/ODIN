import fs from "fs/promises";
import path from "path";
import { normalizeCase } from "@/lib/cases/normalize";
import { normalizeEntity } from "@/lib/entities/normalize";
import {
  ensureDataDir,
  getRelationships,
  readJsonFile,
  saveCase,
  saveEntity,
  saveRelationships,
} from "@/lib/storage";
import { dataPath, DATA_PATHS } from "@/lib/storage/paths";
import { logActivity } from "@/lib/storage/activity";
import type { Case, Entity, RelationshipsFile } from "@/lib/types";
import { mergeRelationshipsFile } from "./aggregate-merge";
import { parseImportZip } from "./parse-zip";
import {
  applyIdMapToCase,
  applyIdMapToEntity,
  newIdFor,
  type IdMap,
} from "./remap";
import type {
  ConflictAction,
  ConflictResolution,
  ImportAnalysisReport,
  ImportResult,
} from "./types";

function resolutionFor(
  report: ImportAnalysisReport,
  resolutions: ConflictResolution[],
  conflictId: string,
): ConflictAction {
  const found = resolutions.find((r) => r.conflictId === conflictId);
  if (found) return found.action;
  const conflict = report.conflicts.find((c) => c.id === conflictId);
  return conflict?.defaultAction ?? "skip";
}

function actionForPath(
  report: ImportAnalysisReport,
  resolutions: ConflictResolution[],
  dataPathStr: string,
  recordId?: string,
): ConflictAction {
  const conflict = report.conflicts.find(
    (c) =>
      c.path === dataPathStr ||
      (recordId && c.recordId === recordId && c.path === dataPathStr),
  );
  if (!conflict) return "overwrite";
  return resolutionFor(report, resolutions, conflict.id);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function getEntityByIdSafe(id: string): Promise<Entity | null> {
  const e = await readJsonFile<Entity>(
    dataPath(DATA_PATHS.entitiesDir, `${id}.json`),
  );
  return e ? normalizeEntity(e) : null;
}

export async function applyImportZip(
  buffer: Buffer,
  report: ImportAnalysisReport,
  resolutions: ConflictResolution[],
): Promise<ImportResult> {
  await ensureDataDir();
  const parsed = parseImportZip(buffer);
  const idMap: IdMap = {};
  let filesWritten = 0;
  let entitiesImported = 0;
  let casesImported = 0;
  const warnings: string[] = [];
  const isCaseScope = report.scope === "case";

  const incomingEntities = new Map<string, Entity>();
  const incomingCases = new Map<string, Case>();
  let incomingRelationships: RelationshipsFile | null = null;

  for (const entry of parsed.entries) {
    if (entry.dataPath.startsWith("entities/") && entry.dataPath.endsWith(".json")) {
      const id = path.basename(entry.dataPath, ".json");
      incomingEntities.set(
        id,
        JSON.parse(entry.data.toString("utf-8")) as Entity,
      );
    }
    if (entry.dataPath.startsWith("cases/") && entry.dataPath.endsWith(".json")) {
      const id = path.basename(entry.dataPath, ".json");
      incomingCases.set(id, JSON.parse(entry.data.toString("utf-8")) as Case);
    }
    if (entry.dataPath === "relationships.json") {
      incomingRelationships = JSON.parse(
        entry.data.toString("utf-8"),
      ) as RelationshipsFile;
    }
  }

  for (const [oldId, ent] of incomingEntities) {
    const relPath = `entities/${oldId}.json`;
    const exists = await pathExists(dataPath(relPath));
    const action = exists
      ? actionForPath(report, resolutions, relPath, oldId)
      : "overwrite";

    if (action === "skip" || action === "keep_local") continue;

    let entity = normalizeEntity(ent);
    if (action === "import_as_copy") {
      const newId = newIdFor(oldId, idMap);
      entity = normalizeEntity({ ...ent, id: newId });
    }

    await saveEntity(entity);
    entitiesImported++;
    filesWritten++;

    const uploadFrom = `uploads/${oldId}`;
    const uploadTo = `uploads/${entity.id}`;
    for (const e of parsed.entries.filter((x) =>
      x.dataPath.startsWith(`${uploadFrom}/`),
    )) {
      const targetPath =
        action === "import_as_copy"
          ? e.dataPath.replace(uploadFrom, uploadTo)
          : e.dataPath;
      const uploadAction = actionForPath(report, resolutions, e.dataPath);
      if (uploadAction === "skip") continue;
      await fs.mkdir(path.dirname(dataPath(targetPath)), { recursive: true });
      await fs.writeFile(dataPath(targetPath), e.data);
      filesWritten++;
    }
  }

  for (const [oldId, caseData] of incomingCases) {
    const relPath = `cases/${oldId}.json`;
    const exists = await pathExists(dataPath(relPath));
    const action = exists
      ? actionForPath(report, resolutions, relPath, oldId)
      : "overwrite";

    if (action === "skip") continue;

    let c = normalizeCase(caseData);
    if (action === "import_as_copy") {
      const newId = newIdFor(oldId, idMap);
      c = normalizeCase({ ...caseData, id: newId });
    }

    c = applyIdMapToCase(c, idMap);
    await saveCase(c);
    casesImported++;
    filesWritten++;

    for (const eid of caseData.entityIds) {
      if (!incomingEntities.has(eid)) continue;
      const entAction = actionForPath(
        report,
        resolutions,
        `entities/${eid}.json`,
        eid,
      );
      if (entAction === "keep_local") {
        const local = await getEntityByIdSafe(eid);
        if (local && !local.caseIds?.includes(c.id)) {
          await saveEntity({
            ...local,
            caseIds: [...(local.caseIds ?? []), c.id],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  if (incomingRelationships) {
    const local = await getRelationships();
    const merged = mergeRelationshipsFile(
      local,
      incomingRelationships,
      () => (isCaseScope ? "keep_local" : "keep_local"),
    );
    for (const rel of incomingRelationships.relationships) {
      const from = idMap[rel.fromEntityId] ?? rel.fromEntityId;
      const to = idMap[rel.toEntityId] ?? rel.toEntityId;
      const caseId = rel.caseId
        ? (idMap[rel.caseId] ?? rel.caseId)
        : rel.caseId;
      const existing = merged.relationships.find((r) => r.id === rel.id);
      if (existing) {
        Object.assign(existing, { fromEntityId: from, toEntityId: to, caseId });
      } else {
        merged.relationships.push({
          ...rel,
          fromEntityId: from,
          toEntityId: to,
          caseId,
        });
      }
    }
    await saveRelationships(merged);
    filesWritten++;
  }

  for (const entry of parsed.entries) {
    if (
      entry.dataPath.startsWith("entities/") ||
      entry.dataPath.startsWith("cases/") ||
      entry.dataPath === "relationships.json" ||
      entry.dataPath.startsWith("uploads/")
    ) {
      continue;
    }

    const dest = dataPath(entry.dataPath);
    const exists = await pathExists(dest);
    const action = exists
      ? actionForPath(report, resolutions, entry.dataPath)
      : "overwrite";

    if (action === "skip" || action === "import_as_copy") continue;

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, entry.data);
    filesWritten++;
  }

  if (Object.keys(idMap).length > 0) {
    const { getEntities } = await import("@/lib/storage");
    const entities = await getEntities();
    for (const e of entities) {
      const patched = applyIdMapToEntity(e, idMap);
      if (JSON.stringify(patched) !== JSON.stringify(e)) {
        await saveEntity(patched);
      }
    }
  }

  await logActivity({
    action: "import",
    targetType: "platform",
    targetId: "import",
    summary: `Imported ${filesWritten} files (${entitiesImported} entities, ${casesImported} cases)`,
  });

  return { filesWritten, entitiesImported, casesImported, idMap, warnings };
}
