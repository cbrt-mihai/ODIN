"use server";

import fs from "fs/promises";
import path from "path";
import {
  DATA_PATHS,
  dataPath,
  ensureDataDir,
  writeJsonFile,
} from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/defaults/settings";

async function emptyDir(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map((e) =>
        fs.rm(path.join(dir, e.name), { recursive: true, force: true }),
      ),
    );
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}

export async function eraseAllData(): Promise<{ ok: true }> {
  await ensureDataDir();

  const dirsToWipe = [
    DATA_PATHS.entitiesDir,
    DATA_PATHS.casesDir,
    DATA_PATHS.groupsDir,
    DATA_PATHS.uploadsDir,
    DATA_PATHS.snapshotsDir,
    DATA_PATHS.trashDir,
    DATA_PATHS.runsDir,
  ];

  for (const rel of dirsToWipe) {
    await emptyDir(dataPath(rel));
  }

  await writeJsonFile(dataPath(DATA_PATHS.tools), { tools: [] });
  await writeJsonFile(dataPath(DATA_PATHS.resources), { resources: [] });
  await writeJsonFile(dataPath(DATA_PATHS.relationships), {
    relationships: [],
  });
  await writeJsonFile(dataPath(DATA_PATHS.inbox), { items: [] });
  await writeJsonFile(dataPath(DATA_PATHS.playbooks), { playbooks: [] });
  await writeJsonFile(dataPath(DATA_PATHS.activity), { entries: [] });
  await writeJsonFile(dataPath(DATA_PATHS.savedViews), { views: [] });
  await writeJsonFile(dataPath(DATA_PATHS.settings), DEFAULT_SETTINGS);

  return { ok: true };
}
