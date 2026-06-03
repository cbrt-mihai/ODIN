"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  deleteSavedView,
  listSavedViews,
  saveView,
} from "@/lib/actions/saved-views";
import type { SavedView } from "@/lib/types";

export function SavedViewsBar({
  currentType,
}: {
  currentType?: string;
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSavedViews().then((all) =>
      setViews(all.filter((v) => v.page === "entities")),
    );
  }, []);

  async function saveCurrent() {
    const label =
      name.trim() ||
      (currentType && currentType !== "all"
        ? `${currentType} entities`
        : "All entities");
    setSaving(true);
    try {
      await saveView({
        name: label,
        page: "entities",
        filters: { type: currentType ?? "all" },
      });
      setName("");
      const all = await listSavedViews();
      setViews(all.filter((v) => v.page === "entities"));
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function viewHref(v: SavedView) {
    const type = v.filters.type as string | undefined;
    if (!type || type === "all") return "/entities";
    return `/entities?type=${type}`;
  }

  return (
    <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
      <p className="text-sm font-medium text-zinc-300">Saved views</p>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="View name (optional)"
          className="max-w-xs h-8 text-sm"
        />
        <Button size="sm" variant="secondary" onClick={saveCurrent} disabled={saving}>
          <Bookmark className="h-3.5 w-3.5 mr-1" />
          {saving ? "Saving…" : "Save current filter"}
        </Button>
      </div>
      {views.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {views.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            >
              <Link href={viewHref(v)} className="hover:text-blue-400">
                {v.name}
              </Link>
              <button
                type="button"
                className="text-zinc-600 hover:text-red-400 p-0.5"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: "Delete saved view",
                    description: `Delete saved view "${v.name}"?`,
                    confirmLabel: "Delete",
                    destructive: true,
                  });
                  if (!ok) return;
                  await deleteSavedView(v.id);
                  setViews((prev) => prev.filter((x) => x.id !== v.id));
                }}
                aria-label={`Delete view ${v.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
