import AdmZip from "adm-zip";
import type { ImportManifest } from "./types";

export interface ParsedZipEntry {
  zipPath: string;
  dataPath: string;
  data: Buffer;
}

export interface ParsedImportZip {
  manifest: ImportManifest;
  entries: ParsedZipEntry[];
}

export function parseImportZip(buffer: Buffer): ParsedImportZip {
  const zip = new AdmZip(buffer);
  const entries: ParsedZipEntry[] = [];
  let manifest: ImportManifest = {
    version: 1,
    scope: "platform",
  };

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const zipPath = entry.entryName.replace(/\\/g, "/");

    if (zipPath === "manifest.json") {
      try {
        manifest = JSON.parse(entry.getData().toString("utf-8")) as ImportManifest;
      } catch {
        /* keep default */
      }
      continue;
    }

    let dataPath = zipPath;
    if (dataPath.startsWith("data/")) {
      dataPath = dataPath.slice("data/".length);
    } else if (!dataPath.includes("/")) {
      continue;
    }

    entries.push({
      zipPath,
      dataPath,
      data: entry.getData(),
    });
  }

  const scope = manifest.scope === "case" ? "case" : "platform";
  return { manifest: { ...manifest, scope }, entries };
}
