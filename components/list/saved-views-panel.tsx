"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  buildListQuery,
  type ListFilterState,
} from "@/lib/list-filter/url-state";
import {
  deleteSavedView,
  listSavedViews,
  saveView,
} from "@/lib/actions/saved-views";
import type { SavedView } from "@/lib/types";

export function SavedViewsPanel({
  page,
  pathname,
  currentState,
  defaultName,
}: {
  page: SavedView["page"];
  pathname: string;
  currentState: ListFilterState;
  defaultName?: string;
}) {
  const confirmDialog = useConfirm();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSavedViews().then((all) => setViews(all.filter((v) => v.page === page)));
  }, [page]);

  async function saveCurrent() {
    const label = name.trim() || defaultName || `View ${views.length + 1}`;
    setSaving(true);
    try {
      await saveView({
        name: label,
        page,
        filters: { ...currentState },
        sort: currentState.sort,
      });
      setName("");
      const all = await listSavedViews();
      setViews(all.filter((v) => v.page === page));
    } finally {
      setSaving(false);
    }
  }

  function viewHref(v: SavedView) {
    const filters = v.filters as ListFilterState;
    return `${pathname}${buildListQuery(filters)}`;
  }

  const isActive = (v: SavedView) => {
    const f = v.filters as ListFilterState;
    return Object.entries(f).every(([k, val]) => {
      if (!val) return !currentState[k];
      return currentState[k] === val;
    });
  };

  return (
    <div className="border-t border-zinc-800/80 pt-3 space-y-2">
      <p className="text-xs font-medium text-zinc-500">Saved views</p>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this view…"
          className="max-w-[200px] h-8 text-sm"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={saveCurrent}
          disabled={saving}
        >
          <Bookmark className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save view"}
        </Button>
      </div>
      {views.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {views.map((v) => (
            <li
              key={v.id}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-sm transition-colors ${
                isActive(v)
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
              }`}
            >
              <Link href={viewHref(v)} className="hover:text-blue-300">
                {v.name}
              </Link>
              <button
                type="button"
                className="text-zinc-600 hover:text-red-400 p-0.5"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: "Delete saved view",
                    description: `Delete "${v.name}"?`,
                    confirmLabel: "Delete",
                    destructive: true,
                  });
                  if (!ok) return;
                  await deleteSavedView(v.id);
                  setViews((prev) => prev.filter((x) => x.id !== v.id));
                }}
                aria-label={`Delete ${v.name}`}
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
