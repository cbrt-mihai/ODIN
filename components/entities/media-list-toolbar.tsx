"use client";

import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { MediaListControls, MediaSortKey } from "@/lib/media-list/utils";

export function MediaListToolbar({
  controls,
  onChange,
  mode,
  mimeOptions = [],
}: {
  controls: MediaListControls;
  onChange: (patch: Partial<MediaListControls>) => void;
  mode: "gallery" | "files";
  mimeOptions?: string[];
}) {
  const sortOptions: { id: MediaSortKey; label: string }[] =
    mode === "gallery"
      ? [
          { id: "order", label: "Manual order" },
          { id: "name", label: "Caption / URL" },
          { id: "date", label: "Added (order index)" },
        ]
      : [
          { id: "order", label: "Manual order" },
          { id: "name", label: "Filename" },
          { id: "size", label: "Size" },
          { id: "date", label: "Upload date" },
        ];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="min-w-[160px] flex-1">
        <Label className="text-xs text-zinc-500">Search</Label>
        <Input
          value={controls.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder={mode === "gallery" ? "Caption, hash, URL…" : "Filename, caption, hash…"}
          className="h-8 text-sm"
        />
      </div>
      <div className="w-[140px]">
        <Label className="text-xs text-zinc-500">Sort by</Label>
        <Select
          value={controls.sort}
          onValueChange={(sort) => onChange({ sort: sort as MediaSortKey })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        title={controls.sortDir === "asc" ? "Ascending" : "Descending"}
        onClick={() =>
          onChange({
            sortDir: controls.sortDir === "asc" ? "desc" : "asc",
          })
        }
      >
        {controls.sortDir === "asc" ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : (
          <ArrowUpAZ className="h-4 w-4" />
        )}
      </Button>
      {mode === "gallery" ? (
        <div className="w-[120px]">
          <Label className="text-xs text-zinc-500">Source</Label>
          <Select
            value={controls.sourceFilter}
            onValueChange={(sourceFilter) =>
              onChange({
                sourceFilter: sourceFilter as MediaListControls["sourceFilter"],
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="w-[140px]">
          <Label className="text-xs text-zinc-500">Type</Label>
          <Select
            value={controls.mimeFilter}
            onValueChange={(mimeFilter) => onChange({ mimeFilter })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {mimeOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
