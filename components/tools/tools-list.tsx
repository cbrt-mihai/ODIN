"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToolForm } from "@/components/tools/tool-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteTool } from "@/lib/actions/tools";
import type { Tool } from "@/lib/types";

const KINDS = ["all", "external", "internal_page"] as const;

export function ToolsList({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] =
    useState<(typeof KINDS)[number]>("all");

  const filtered =
    kindFilter === "all"
      ? tools
      : tools.filter((t) => t.kind === kindFilter);

  if (tools.length === 0) {
    return (
      <li className="px-4 py-6 text-sm text-zinc-500">No tools yet.</li>
    );
  }

  return (
    <>
      <li className="flex flex-wrap gap-2 px-4 py-2 border-b border-zinc-800">
        {KINDS.map((k) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={kindFilter === k ? "secondary" : "ghost"}
            className="capitalize"
            onClick={() => setKindFilter(k)}
          >
            {k === "all" ? "All" : k.replace("_", " ")}
          </Button>
        ))}
      </li>
      {filtered.length === 0 ? (
        <li className="px-4 py-6 text-sm text-zinc-500">
          No tools match this filter.
        </li>
      ) : null}
      {filtered.map((t) => (
        <li key={t.id} className="px-4 py-3">
          {editingId === t.id ? (
            <ToolForm
              tool={t}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {t.kind === "external" && t.url ? (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-400 hover:underline"
                  >
                    {t.name}
                  </a>
                ) : (
                  <Link
                    href={`/tools/${t.id}`}
                    className="font-medium hover:text-blue-400"
                  >
                    {t.name}
                  </Link>
                )}
                {t.description && (
                  <p className="text-xs text-zinc-500">{t.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {t.kind.replace("_", " ")}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(t.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === t.id}
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Delete tool",
                      description: `Move tool "${t.name}" to trash?`,
                      confirmLabel: "Move to trash",
                      destructive: true,
                    });
                    if (!ok) return;
                    setDeletingId(t.id);
                    try {
                      await deleteTool(t.id);
                      router.refresh();
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </li>
      ))}
    </>
  );
}
