"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResourceForm } from "@/components/resources/resource-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/lib/actions/resources";
import type { Resource } from "@/lib/types";

export function ResourcesList({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (resources.length === 0) {
    return (
      <li className="px-4 py-6 text-sm text-zinc-500">No resources yet.</li>
    );
  }

  return (
    <>
      {resources.map((r) => (
        <li key={r.id} className="px-4 py-3">
          {editingId === r.id ? (
            <ResourceForm
              resource={r}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {r.kind === "external" && r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-400 hover:underline"
                  >
                    {r.name}
                  </a>
                ) : (
                  <Link
                    href={`/resources/${r.id}`}
                    className="font-medium hover:text-blue-400"
                  >
                    {r.name}
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{r.kind}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(r.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === r.id}
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Delete resource",
                      description: `Move resource "${r.name}" to trash?`,
                      confirmLabel: "Move to trash",
                      destructive: true,
                    });
                    if (!ok) return;
                    setDeletingId(r.id);
                    try {
                      await deleteResource(r.id);
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
