"use client";

import { ArrowDownAZ, ArrowUpAZ, Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ListFilterState, SortDirection } from "@/lib/list-filter/url-state";

export type FilterSelectConfig = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export function ListFilterBar({
  state,
  onChange,
  onClear,
  searchPlaceholder = "Search…",
  sortOptions,
  filterSelects = [],
  tagFilter,
  resultCount,
  totalCount,
  savedViews,
  advanced,
  className,
}: {
  state: ListFilterState;
  onChange: (patch: Partial<ListFilterState>) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  sortOptions: { id: string; label: string }[];
  filterSelects?: FilterSelectConfig[];
  tagFilter?: {
    placeholder?: string;
    /** Comma-separated tags in state.tags */
  };
  resultCount: number;
  totalCount: number;
  savedViews?: React.ReactNode;
  advanced?: React.ReactNode;
  className?: string;
}) {
  const dir = (state.dir as SortDirection) ?? "desc";
  const hasActive =
    Boolean(state.q?.trim()) ||
    Boolean(state.tags?.trim()) ||
    filterSelects.some((f) => {
      const v = state[f.id];
      return v && v !== "all";
    });

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={state.q ?? ""}
            onChange={(e) => onChange({ q: e.target.value || undefined })}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={state.sort ?? sortOptions[0]?.id}
            onValueChange={(sort) => onChange({ sort })}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            title={dir === "asc" ? "Ascending" : "Descending"}
            onClick={() =>
              onChange({ dir: dir === "asc" ? "desc" : "asc" })
            }
          >
            {dir === "asc" ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4" />
            )}
          </Button>
          {hasActive && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {filterSelects.map((f) => (
          <div key={f.id} className="w-[min(100%,180px)]">
            <Label className="text-xs text-zinc-500">{f.label}</Label>
            <Select
              value={state[f.id] ?? "all"}
              onValueChange={(v) =>
                onChange({ [f.id]: v === "all" ? undefined : v })
              }
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {tagFilter && (
          <div className="min-w-[160px] flex-1">
            <Label className="text-xs text-zinc-500">Tags (any match)</Label>
            <Input
              className="mt-1 h-8 text-sm"
              value={state.tags ?? ""}
              onChange={(e) =>
                onChange({ tags: e.target.value || undefined })
              }
              placeholder={tagFilter.placeholder ?? "osint, priority"}
            />
          </div>
        )}
      </div>

      {advanced && (
        <details className="group rounded-lg border border-zinc-800/80 bg-zinc-950/40">
          <summary className="flex w-full min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-500 [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced filters
          </summary>
          <div className="border-t border-zinc-800/80 px-3 py-3">{advanced}</div>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Showing <strong className="text-zinc-300">{resultCount}</strong>
          {totalCount !== resultCount ? ` of ${totalCount}` : ""}
        </span>
      </div>

      {savedViews}
    </div>
  );
}
