import { ensureDataDir } from "@/lib/storage";
import { exportDataZip } from "@/lib/storage/zip";
import { analyzeImportZip } from "@/lib/import/analyze";
import { applyImportZip } from "@/lib/import/apply";
import type { ConflictResolution } from "@/lib/import/types";
import fs from "fs/promises";
import path from "path";
import { getDataDir } from "@/lib/storage/paths";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureDataDir();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        buffer?: string;
        resolutions?: ConflictResolution[];
        createBackup?: boolean;
      };

      if (!body.buffer) {
        return Response.json({ error: "No import data" }, { status: 400 });
      }

      const buffer = Buffer.from(body.buffer, "base64");
      const report = await analyzeImportZip(buffer);

      if (report.scope === "case") {
        const unresolved = report.conflicts.filter(
          (c) =>
            c.requiresChoice &&
            !body.resolutions?.some((r) => r.conflictId === c.id),
        );
        if (unresolved.length > 0) {
          return Response.json(
            {
              error: "Unresolved conflicts require explicit choices",
              unresolved: unresolved.map((c) => c.id),
            },
            { status: 400 },
          );
        }
      }

      if (body.createBackup) {
        const backupDir = path.join(getDataDir(), "backups");
        await fs.mkdir(backupDir, { recursive: true });
        const backup = await exportDataZip();
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        await fs.writeFile(path.join(backupDir, `backup-${ts}.zip`), backup);
      }

      const result = await applyImportZip(
        buffer,
        report,
        body.resolutions ?? [],
      );
      return Response.json({ ok: true, ...result });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const report = await analyzeImportZip(buffer);
    return Response.json({
      error: "Analysis only — use JSON body with resolutions to apply",
      report,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    );
  }
}
