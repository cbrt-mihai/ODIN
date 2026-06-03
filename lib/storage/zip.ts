import AdmZip from "adm-zip";
import fs from "fs/promises";
import path from "path";
import { getCase, getEntities, getRelationships } from "./index";
import { getDataDir } from "./paths";

async function addDirToZip(
  zip: AdmZip,
  dir: string,
  zipPrefix: string,
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const zipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await addDirToZip(zip, full, zipPath);
    } else {
      const data = await fs.readFile(full);
      zip.addFile(zipPath, data);
    }
  }
}

export async function exportCaseZip(caseId: string): Promise<Buffer> {
  const caseData = await getCase(caseId);
  if (!caseData) throw new Error("Case not found");

  const [entities, { relationships }] = await Promise.all([
    getEntities(),
    getRelationships(),
  ]);
  const entitySet = new Set(caseData.entityIds);
  const linked = entities.filter((e) => entitySet.has(e.id));
  const rels = relationships.filter(
    (r) =>
      entitySet.has(r.fromEntityId) ||
      entitySet.has(r.toEntityId) ||
      r.caseId === caseId,
  );

  const zip = new AdmZip();
  const dataDir = getDataDir();

  zip.addFile(
    `data/cases/${caseId}.json`,
    Buffer.from(JSON.stringify(caseData, null, 2)),
  );
  zip.addFile(
    "data/relationships.json",
    Buffer.from(JSON.stringify({ relationships: rels }, null, 2)),
  );
  for (const ent of linked) {
    zip.addFile(
      `data/entities/${ent.id}.json`,
      Buffer.from(JSON.stringify(ent, null, 2)),
    );
    const uploadsDir = path.join(dataDir, "uploads", ent.id);
    try {
      await addDirToZip(zip, uploadsDir, `data/uploads/${ent.id}`);
    } catch {
      /* no uploads */
    }
  }

  zip.addFile(
    "manifest.json",
    Buffer.from(
      JSON.stringify(
        {
          version: 2,
          scope: "case",
          caseId,
          entityIds: linked.map((e) => e.id),
          relationshipIds: rels.map((r) => r.id),
          exportedAt: new Date().toISOString(),
          app: "the-blacklist",
        },
        null,
        2,
      ),
    ),
  );

  return zip.toBuffer();
}

export async function exportDataZip(): Promise<Buffer> {
  const dataDir = getDataDir();
  const zip = new AdmZip();

  try {
    await addDirToZip(zip, dataDir, "data");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }

  zip.addFile(
    "manifest.json",
    Buffer.from(
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          app: "the-blacklist",
        },
        null,
        2,
      ),
    ),
  );

  return zip.toBuffer();
}

export async function importDataZip(buffer: Buffer): Promise<number> {
  const dataDir = getDataDir();
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  let filesExtracted = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    let destPath = entry.entryName;
    if (destPath.startsWith("data/")) {
      destPath = destPath.slice("data/".length);
    } else if (destPath === "manifest.json" || !destPath.includes("/")) {
      continue;
    }

    const fullDest = path.join(dataDir, destPath);
    await fs.mkdir(path.dirname(fullDest), { recursive: true });
    await fs.writeFile(fullDest, entry.getData());
    filesExtracted++;
  }

  return filesExtracted;
}
