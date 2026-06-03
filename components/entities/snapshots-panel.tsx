"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  createSnapshot,
  restoreSnapshot,
} from "@/lib/actions/snapshots";

export function SnapshotsPanel({
  entityId,
  snapshots,
}: {
  entityId: string;
  snapshots: string[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await createSnapshot(entityId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function restore(ts: string) {
    const ok = await confirmDialog({
      title: "Restore snapshot",
      description:
        "Restore this snapshot? Current state will be saved first.",
      confirmLabel: "Restore",
    });
    if (!ok) return;
    setLoading(true);
    try {
      await restoreSnapshot(entityId, ts);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollapsibleCard
      id="entity-snapshots"
      title="Snapshots"
      actions={
        <Button size="sm" onClick={save} disabled={loading}>
          Save snapshot
        </Button>
      }
    >
        {snapshots.length === 0 ? (
          <p className="text-sm text-zinc-500">No snapshots yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {snapshots.map((ts) => (
              <li
                key={ts}
                className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2"
              >
                <span className="font-mono text-xs text-zinc-400" title={ts}>
                  {ts.slice(0, 19).replace("T", " ")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => restore(ts)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
    </CollapsibleCard>
  );
}
