import fs from "fs/promises";
import path from "path";
import type { Entity } from "@/lib/types";
import { dataPath, getDataDir } from "./paths";
import { readJsonFile, writeJsonFile } from "./index";

function snapshotDir(entityId: string) {
  return dataPath("snapshots", entityId);
}

export async function listEntitySnapshots(entityId: string) {
  const dir = snapshotDir(entityId);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function saveEntitySnapshot(entity: Entity, label?: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(snapshotDir(entity.id), `${ts}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await writeJsonFile(file, { ...entity, snapshotAt: ts, snapshotLabel: label });
  return ts;
}

type EntitySnapshot = Entity & {
  snapshotAt?: string;
  snapshotLabel?: string;
};

export async function getEntitySnapshot(entityId: string, timestamp: string) {
  return readJsonFile<EntitySnapshot>(
    path.join(snapshotDir(entityId), `${timestamp}.json`),
  );
}

export async function restoreEntitySnapshot(
  entityId: string,
  timestamp: string,
) {
  const snap = await getEntitySnapshot(entityId, timestamp);
  if (!snap) throw new Error("Snapshot not found");
  const { snapshotAt: _a, snapshotLabel: _b, ...entity } = snap;
  return entity as Entity;
}
