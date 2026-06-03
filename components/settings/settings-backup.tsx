"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  buildSettingsExport,
  parseSettingsImport,
  settingsExportFilename,
} from "@/lib/settings/backup";
import type { Settings } from "@/lib/types";

export function SettingsBackup({
  settings,
  onImport,
}: {
  settings: Settings;
  onImport: (next: Settings) => void;
}) {
  const confirmDialog = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function exportSettings() {
    const payload = buildSettingsExport(settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = settingsExportFilename();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFileSelected(file: File | undefined) {
    setImportError(null);
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = parseSettingsImport(parsed);
      const ok = await confirmDialog({
        title: "Import settings",
        description:
          "Replace the current settings form with this file? Save settings afterward to write to disk. Theme, entity types, field types, templates, and relationship presets will all be replaced.",
        confirmLabel: "Import",
        destructive: true,
      });
      if (!ok) return;
      onImport(imported);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Could not import settings file.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Export / import settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-zinc-500">
          Download or upload <code className="text-[10px]">settings.json</code>{" "}
          (theme, entity types, field types, confidence types, templates, and
          relationship presets). This does not include entities, cases, or other
          workspace data — use Import / Export for a full backup.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={exportSettings}>
            Export settings JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            Import settings JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onFileSelected(e.target.files?.[0])}
          />
        </div>
        {importError && (
          <p className="text-sm text-red-400" role="alert">
            {importError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
