import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { dataPath, DATA_PATHS } from "@/lib/storage/paths";
import type { Case, Entity } from "@/lib/types";
import { parseImportZip } from "./parse-zip";
import type {
  ConflictAction,
  ConflictItem,
  ImportAnalysisReport,
} from "./types";
import { AGGREGATE_FILES } from "./types";

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function tryParseJson<T>(buf: Buffer): T | null {
  try {
    return JSON.parse(buf.toString("utf-8")) as T;
  } catch {
    return null;
  }
}

function recordLabel(obj: { id?: string; title?: string; displayName?: string; name?: string }) {
  return obj.displayName ?? obj.title ?? obj.name ?? obj.id ?? "Unknown";
}

function entityActions(isCaseScope: boolean): ConflictAction[] {
  return isCaseScope
    ? ["keep_local", "overwrite", "import_as_copy"]
    : ["skip", "overwrite"];
}

export async function analyzeImportZip(buffer: Buffer): Promise<ImportAnalysisReport> {
  const parsed = parseImportZip(buffer);
  const { manifest, entries } = parsed;
  const isCaseScope = manifest.scope === "case";
  const conflicts: ConflictItem[] = [];
  const newItems: { path: string; label: string }[] = [];
  const warnings: string[] = [];

  if (isCaseScope && entries.some((e) => e.dataPath === "relationships.json")) {
    warnings.push(
      "Case ZIP contains relationships.json — will be merged record-by-record, not replaced.",
    );
  }

  for (const entry of entries) {
    const fullPath = dataPath(entry.dataPath);
    const exists = await fileExists(fullPath);

    if (entry.dataPath.startsWith("entities/") && entry.dataPath.endsWith(".json")) {
      const id = path.basename(entry.dataPath, ".json");
      const incoming = tryParseJson<Entity>(entry.data);
      const label = incoming ? recordLabel(incoming) : id;

      if (exists) {
        const localRaw = await fs.readFile(fullPath, "utf-8");
        const local = tryParseJson<Entity>(Buffer.from(localRaw));
        conflicts.push({
          id: uuidv4(),
          kind: "entity",
          path: entry.dataPath,
          label: `Entity: ${label}`,
          localSummary: local ? `${local.displayName} (${local.updatedAt ?? "?"})` : id,
          incomingSummary: incoming
            ? `${incoming.displayName} (${incoming.updatedAt ?? "?"})`
            : id,
          requiresChoice: isCaseScope,
          defaultAction: isCaseScope ? "keep_local" : "skip",
          allowedActions: entityActions(isCaseScope),
          recordId: id,
        });
      } else {
        newItems.push({ path: entry.dataPath, label: `Entity: ${label}` });
      }
      continue;
    }

    if (entry.dataPath.startsWith("cases/") && entry.dataPath.endsWith(".json")) {
      const id = path.basename(entry.dataPath, ".json");
      const incoming = tryParseJson<Case>(entry.data);
      const label = incoming ? recordLabel(incoming) : id;

      if (exists) {
        const localRaw = await fs.readFile(fullPath, "utf-8");
        const local = tryParseJson<Case>(Buffer.from(localRaw));
        conflicts.push({
          id: uuidv4(),
          kind: "case",
          path: entry.dataPath,
          label: `Case: ${label}`,
          localSummary: local ? `${local.title} (${local.updatedAt ?? "?"})` : id,
          incomingSummary: incoming
            ? `${incoming.title} (${incoming.updatedAt ?? "?"})`
            : id,
          requiresChoice: true,
          defaultAction: "skip",
          allowedActions: ["skip", "overwrite", "import_as_copy"],
          recordId: id,
        });
      } else {
        newItems.push({ path: entry.dataPath, label: `Case: ${label}` });
      }
      continue;
    }

    if (AGGREGATE_FILES.includes(entry.dataPath as (typeof AGGREGATE_FILES)[number])) {
      if (isCaseScope && entry.dataPath === "relationships.json") {
        continue;
      }
      if (exists) {
        conflicts.push({
          id: uuidv4(),
          kind: "aggregate",
          path: entry.dataPath,
          label: `Aggregate: ${entry.dataPath}`,
          localSummary: "File exists locally",
          incomingSummary: "Incoming backup file",
          requiresChoice: entry.dataPath === "settings.json",
          defaultAction: "skip",
          allowedActions: ["skip", "overwrite"],
          aggregateFile: entry.dataPath,
        });
      } else {
        newItems.push({ path: entry.dataPath, label: entry.dataPath });
      }
      continue;
    }

    if (exists) {
      conflicts.push({
        id: uuidv4(),
        kind: entry.dataPath.startsWith("uploads/") ? "upload" : "file",
        path: entry.dataPath,
        label: entry.dataPath,
        requiresChoice: false,
        defaultAction: "skip",
        allowedActions: ["skip", "overwrite"],
      });
    } else {
      newItems.push({ path: entry.dataPath, label: entry.dataPath });
    }
  }

  return {
    manifest,
    scope: manifest.scope ?? "platform",
    conflicts,
    newItems,
    warnings,
    stats: {
      totalEntries: entries.length,
      conflictCount: conflicts.length,
      newCount: newItems.length,
    },
  };
}
