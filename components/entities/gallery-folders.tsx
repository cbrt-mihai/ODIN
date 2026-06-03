"use client";

import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronRight, Folder, FolderPlus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GalleryFolder } from "@/lib/types";

export function buildFolderPath(
  folders: GalleryFolder[],
  folderId: string | undefined,
): GalleryFolder[] {
  if (!folderId) return [];
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: GalleryFolder[] = [];
  let cur = byId.get(folderId);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

export function GalleryFolderNav({
  folders,
  currentFolderId,
  onSelectFolder,
  onChangeFolders,
  readOnly,
}: {
  folders: GalleryFolder[];
  currentFolderId?: string;
  onSelectFolder: (id: string | undefined) => void;
  onChangeFolders: (folders: GalleryFolder[]) => void;
  readOnly?: boolean;
}) {
  const sorted = useMemo(
    () => [...folders].sort((a, b) => a.order - b.order),
    [folders],
  );

  const children = sorted.filter(
    (f) => (f.parentId ?? undefined) === (currentFolderId ?? undefined),
  );

  const breadcrumb = buildFolderPath(sorted, currentFolderId);

  function addFolder() {
    const name = "New folder";
    const next: GalleryFolder = {
      id: uuidv4(),
      name,
      parentId: currentFolderId,
      order: children.length,
    };
    onChangeFolders([...folders, next]);
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-800",
            !currentFolderId && "bg-zinc-800 text-zinc-100",
          )}
          onClick={() => onSelectFolder(undefined)}
        >
          <Home className="h-3.5 w-3.5" />
          All images
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1 text-zinc-500">
            <ChevronRight className="h-3 w-3" />
            <button
              type="button"
              className={cn(
                "rounded px-2 py-1 hover:bg-zinc-800",
                currentFolderId === f.id && "bg-zinc-800 text-zinc-100",
              )}
              onClick={() => onSelectFolder(f.id)}
            >
              {f.name}
            </button>
          </span>
        ))}
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7"
            onClick={addFolder}
          >
            <FolderPlus className="h-3 w-3" />
            New folder
          </Button>
        )}
      </div>

      {children.length > 0 && (
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border border-zinc-800 px-3 py-2 text-left text-sm hover:bg-zinc-800/80",
                  currentFolderId === f.id && "border-zinc-600 bg-zinc-800",
                )}
                onClick={() => onSelectFolder(f.id)}
              >
                <Folder className="h-4 w-4 shrink-0 text-amber-500/80" />
                {readOnly ? (
                  <span className="truncate">{f.name}</span>
                ) : (
                  <Input
                    value={f.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      onChangeFolders(
                        folders.map((x) =>
                          x.id === f.id
                            ? { ...x, name: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="h-7 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
