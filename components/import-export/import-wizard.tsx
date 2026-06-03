"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConflictAction,
  ConflictItem,
  ConflictResolution,
  ImportAnalysisReport,
} from "@/lib/import/types";

type Step = "upload" | "resolve" | "done";

const ACTION_LABELS: Record<ConflictAction, string> = {
  skip: "Skip (keep local)",
  overwrite: "Overwrite",
  import_as_copy: "Import as copy (new ID)",
  keep_local: "Keep local entity",
};

async function fileToBase64(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function ImportWizard({
  onComplete,
  caseOnly = false,
}: {
  onComplete?: () => void;
  caseOnly?: boolean;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [bufferB64, setBufferB64] = useState<string | null>(null);
  const [report, setReport] = useState<ImportAnalysisReport | null>(null);
  const [resolutions, setResolutions] = useState<
    Record<string, ConflictAction>
  >({});
  const [createBackup, setCreateBackup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const analyze = useCallback(
    async (f: File) => {
      setLoading(true);
      setError("");
      try {
        const form = new FormData();
        form.append("file", f);
        const res = await fetch("/api/import/analyze", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Analysis failed");
        if (caseOnly && data.scope !== "case") {
          throw new Error("This import expects a case-scoped ZIP");
        }
        setReport(data as ImportAnalysisReport);
        const defaults: Record<string, ConflictAction> = {};
        for (const c of (data as ImportAnalysisReport).conflicts) {
          if (!c.requiresChoice) {
            defaults[c.id] = c.defaultAction;
          }
        }
        setResolutions(defaults);
        setStep("resolve");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [caseOnly],
  );

  async function handleFileSelect(f: File | null) {
    if (!f) return;
    setBufferB64(await fileToBase64(f));
    await analyze(f);
  }

  function setResolution(conflictId: string, action: ConflictAction) {
    setResolutions((prev) => ({ ...prev, [conflictId]: action }));
  }

  function bulkAction(action: ConflictAction) {
    if (!report) return;
    const next = { ...resolutions };
    for (const c of report.conflicts) {
      if (c.allowedActions.includes(action)) {
        next[c.id] = action;
      }
    }
    setResolutions(next);
  }

  async function applyImport() {
    if (!bufferB64 || !report) return;

    const unresolved = report.conflicts.filter(
      (c) => c.requiresChoice && !resolutions[c.id],
    );
    if (unresolved.length > 0) {
      setError(
        `Choose an action for ${unresolved.length} required conflict(s) before importing.`,
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      const resolutionList: ConflictResolution[] = Object.entries(
        resolutions,
      ).map(([conflictId, action]) => ({ conflictId, action }));

      for (const c of report.conflicts) {
        if (!resolutions[c.id] && !c.requiresChoice) {
          resolutionList.push({
            conflictId: c.id,
            action: c.defaultAction,
          });
        }
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buffer: bufferB64,
          resolutions: resolutionList,
          createBackup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(
        `Import complete: ${data.filesWritten} files, ${data.entitiesImported} entities, ${data.casesImported} cases.`,
      );
      setStep("done");
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              {caseOnly ? "Import case ZIP" : "Import ZIP"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-zinc-400">
              {caseOnly
                ? "Upload a case-scoped export. Conflicts are resolved before anything is written."
                : "Upload a backup ZIP. Existing files are skipped by default — you choose what to overwrite."}
            </p>
            <input
              type="file"
              accept=".zip"
              disabled={loading}
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              className="text-sm text-zinc-400"
            />
          </CardContent>
        </Card>
      )}

      {loading && step !== "upload" && (
        <p className="text-sm text-zinc-400">Working…</p>
      )}

      {report && step === "resolve" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Scope:{" "}
                <span className="font-medium text-zinc-200">
                  {report.scope === "case" ? "Case" : "Full workspace"}
                </span>
              </p>
              <p className="text-zinc-400">
                {report.stats.newCount} new · {report.stats.conflictCount}{" "}
                conflicts · {report.stats.totalEntries} files in archive
              </p>
              {report.warnings.map((w) => (
                <p
                  key={w}
                  className="flex items-start gap-2 text-amber-400/90"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {w}
                </p>
              ))}
            </CardContent>
          </Card>

          {report.newItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">
                  New items ({report.newItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-zinc-400">
                  {report.newItems.map((item) => (
                    <li key={item.path}>{item.label}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {report.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conflicts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkAction("skip")}
                  >
                    Skip all conflicts
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkAction("overwrite")}
                  >
                    Overwrite all
                  </Button>
                </div>
                <ConflictTable
                  conflicts={report.conflicts}
                  resolutions={resolutions}
                  onResolve={setResolution}
                />
              </CardContent>
            </Card>
          )}

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={createBackup}
              onChange={(e) => setCreateBackup(e.target.checked)}
            />
            Create full backup before import
          </label>

          <div className="flex gap-2">
            <Button onClick={applyImport} disabled={loading}>
              Apply import
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setReport(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {step === "done" && (
        <Card className="border-emerald-900/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm text-zinc-200">{result}</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function ConflictTable({
  conflicts,
  resolutions,
  onResolve,
}: {
  conflicts: ConflictItem[];
  resolutions: Record<string, ConflictAction>;
  onResolve: (id: string, action: ConflictAction) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-zinc-500">
            <th className="pb-2 pr-4 font-medium">Item</th>
            <th className="pb-2 pr-4 font-medium">Local</th>
            <th className="pb-2 pr-4 font-medium">Incoming</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {conflicts.map((c) => (
            <tr key={c.id} className="border-b border-zinc-800/60">
              <td className="py-2 pr-4 text-zinc-300">
                {c.label}
                {c.requiresChoice && (
                  <span className="ml-1 text-xs text-amber-400">*</span>
                )}
              </td>
              <td className="py-2 pr-4 text-xs text-zinc-500">
                {c.localSummary ?? "—"}
              </td>
              <td className="py-2 pr-4 text-xs text-zinc-500">
                {c.incomingSummary ?? "—"}
              </td>
              <td className="py-2">
                <Select
                  value={resolutions[c.id] ?? ""}
                  onValueChange={(v) =>
                    onResolve(c.id, v as ConflictAction)
                  }
                >
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue
                      placeholder={
                        c.requiresChoice
                          ? "Choose…"
                          : ACTION_LABELS[c.defaultAction]
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {c.allowedActions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {ACTION_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
