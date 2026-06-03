"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ImportWizard } from "@/components/import-export/import-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";

const ERASE_PHRASE = "ERASE ALL DATA";

export function ExportImportPanel() {
  const confirm = useConfirm();
  const [erasing, setErasing] = useState(false);
  const [message, setMessage] = useState("");
  const [erasePhrase, setErasePhrase] = useState("");

  async function handleEraseAll() {
    const ok = await confirm({
      title: "Erase all data",
      description:
        "This permanently deletes all entities, cases, uploads, inbox, tools, and settings data on this machine. Export a backup first if you need one.",
      confirmLabel: "Continue",
      destructive: true,
    });
    if (!ok) return;
    if (erasePhrase !== ERASE_PHRASE) {
      setMessage(`Type exactly "${ERASE_PHRASE}" to confirm.`);
      return;
    }
    setErasing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/erase-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: ERASE_PHRASE }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erase failed");
      setMessage("All data erased. Reloading…");
      window.location.href = "/";
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erase failed");
    } finally {
      setErasing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export full workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-zinc-400">
            Download all data from the <code className="text-xs">data/</code>{" "}
            folder as ZIP — entities, cases, uploads, settings, and more.
          </p>
          <Button asChild>
            <a href="/api/export">Download full ZIP</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import workspace or case</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-zinc-400">
            Upload a previously exported ZIP. You will review conflicts before
            anything is written — existing files are not overwritten unless you
            choose to.
          </p>
          <ImportWizard />
        </CardContent>
      </Card>

      <Card className="border-red-900/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Erase all data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-400">
            Removes every investigation record, upload, snapshot, and trash item
            from local storage. Settings are reset to defaults. This cannot be
            undone.
          </p>
          <div>
            <Label className="text-xs text-zinc-500">
              Type <span className="font-mono text-red-300">{ERASE_PHRASE}</span>{" "}
              to confirm
            </Label>
            <Input
              value={erasePhrase}
              onChange={(e) => setErasePhrase(e.target.value)}
              className="mt-1 font-mono text-sm"
              placeholder={ERASE_PHRASE}
            />
          </div>
          <Button
            variant="destructive"
            disabled={erasing || erasePhrase !== ERASE_PHRASE}
            onClick={handleEraseAll}
          >
            {erasing ? "Erasing…" : "Erase all data"}
          </Button>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-zinc-300">{message}</p>}
    </div>
  );
}
