"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Plus,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { SavedViewsPanel } from "@/components/list/saved-views-panel";
import { useListFilters } from "@/components/list/use-list-filters";
import { ToolForm } from "@/components/tools/tool-form";
import { ResourceForm } from "@/components/resources/resource-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  REFERENCE_KIND_OPTIONS,
  REFERENCE_SORT_OPTIONS,
  filterAndSortReference,
  referenceFilterDefaults,
} from "@/lib/list-filter/reference";
import type { ListFilterState } from "@/lib/list-filter/url-state";
import type { Resource, Tool } from "@/lib/types";

type Item = Tool | Resource;

export function ReferenceIndex({
  items,
  variant,
  title,
  subtitle,
  initialFilters,
}: {
  items: Item[];
  variant: "tool" | "resource";
  title: string;
  subtitle: string;
  initialFilters?: ListFilterState;
}) {
  const pathname = variant === "tool" ? "/tools" : "/resources";
  const defaults = useMemo(
    () => referenceFilterDefaults(initialFilters),
    [initialFilters],
  );
  const { state, setState, clearFilters } = useListFilters(defaults);
  const [showAdd, setShowAdd] = useState(false);

  const Icon = variant === "tool" ? Wrench : BookOpen;
  const hrefPrefix = pathname;
  const savedPage = variant === "tool" ? "tools" : "resources";

  const filtered = useMemo(
    () => filterAndSortReference(items, state),
    [items, state],
  );

  const categories = useMemo(
    () =>
      [...new Set(items.map((i) => i.category).filter(Boolean))].sort() as string[],
    [items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showAdd ? "Close" : `New ${variant}`}
          </Button>
        }
      />

      <ListFilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onClear={clearFilters}
        searchPlaceholder="Search name, description, category, tags…"
        sortOptions={[...REFERENCE_SORT_OPTIONS]}
        filterSelects={[
          {
            id: "kind",
            label: "Kind",
            options: REFERENCE_KIND_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
        tagFilter={{ placeholder: "reference, osint" }}
        resultCount={filtered.length}
        totalCount={items.length}
        advanced={
          categories.length > 0 ? (
            <div className="max-w-xs">
              <Label className="text-xs text-zinc-500">Category contains</Label>
              <Input
                className="mt-1 h-8 text-sm"
                list={`${variant}-categories`}
                value={state.category ?? ""}
                onChange={(e) =>
                  setState({ category: e.target.value || undefined })
                }
                placeholder="Filter by category"
              />
              <datalist id={`${variant}-categories`}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          ) : undefined
        }
        savedViews={
          <SavedViewsPanel
            page={savedPage}
            pathname={pathname}
            currentState={state}
            defaultName={`Custom ${variant} view`}
          />
        }
      />

      {showAdd && (
        <div className="interactive-card rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="mb-4 text-sm font-medium text-zinc-300">
            Add {variant}
          </p>
          {variant === "tool" ? (
            <ToolForm onSaved={() => setShowAdd(false)} />
          ) : (
            <ResourceForm onSaved={() => setShowAdd(false)} />
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${title.toLowerCase()} yet`}
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />
              Add {variant}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          action={
            <button
              type="button"
              className="text-sm text-blue-400 hover:underline"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`${hrefPrefix}/${item.id}`}
                className={cn(
                  "interactive-card group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5",
                  "hover:border-zinc-600 hover:bg-zinc-900/70 hover:shadow-md hover:shadow-black/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                      item.kind === "external"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-emerald-500/10 text-emerald-400",
                    )}
                  >
                    {item.kind === "external" ? (
                      <ExternalLink className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {item.kind.replace("_", " ")}
                  </Badge>
                </div>
                <h2 className="mt-3 font-semibold text-zinc-100 group-hover:text-white">
                  {item.name}
                </h2>
                {item.category && (
                  <p className="text-xs text-zinc-600">{item.category}</p>
                )}
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                    {item.description.replace(/[#*_`[\]]/g, "").slice(0, 120)}
                  </p>
                )}
                {(item.tags ?? []).length > 0 && (
                  <p className="mt-2 text-xs text-zinc-600">
                    {item.tags!.slice(0, 3).join(" · ")}
                  </p>
                )}
                <p className="mt-auto pt-4 text-xs text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
