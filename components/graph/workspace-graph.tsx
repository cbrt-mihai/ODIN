"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EntityGraph } from "@/components/relationships/entity-graph";
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
import { applyGraphFilters } from "@/lib/relationships/graph-filter";
import { buildGraphLegend } from "@/lib/relationships/graph-colors";
import { relationshipDegrees } from "@/lib/investigation/stats";
import {
  DEFAULT_GRAPH_VIEW_STATE,
  graphViewStateFromSearchParams,
  graphViewStateToSearchParams,
  type GraphClusterBy,
  type GraphColorBy,
  type GraphHops,
  type GraphViewState,
} from "@/lib/relationships/graph-view-state";
import { GRAPH_MAX_NODES } from "@/lib/relationships/graph-neighborhood";
import { entityTypesForGraphFilters } from "@/lib/entities/entity-types";
import type { RelationshipTypeOption } from "@/lib/relationships/helpers";
import type {
  Case,
  ConfidenceTypeDefinition,
  Entity,
  EntityTypeDefinition,
  Group,
  Relationship,
} from "@/lib/types";

function toggleList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

export function WorkspaceGraph({
  entities: allEntities,
  relationships: allRelationships,
  cases,
  groups,
  relationshipTypes,
  confidenceTypes,
  entityTypes: entityTypeDefinitions,
  initialFocusId,
}: {
  entities: Entity[];
  relationships: Relationship[];
  cases: Case[];
  groups: Group[];
  relationshipTypes: RelationshipTypeOption[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entityTypes: EntityTypeDefinition[];
  initialFocusId?: string;
}) {
  const filterEntityTypes = entityTypesForGraphFilters(
    entityTypeDefinitions,
    allEntities,
  );
  const knownEntityTypeIds = filterEntityTypes.map((d) => d.id);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<GraphViewState>(() => {
    const fromUrl = graphViewStateFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      knownEntityTypeIds,
    );
    if (initialFocusId && !fromUrl.focusId) {
      fromUrl.focusId = initialFocusId;
    }
    return fromUrl;
  });

  const pushState = useCallback(
    (next: GraphViewState) => {
      setState(next);
      const params = graphViewStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/graph?${qs}` : "/graph", { scroll: false });
    },
    [router],
  );

  const confidenceOrder = useMemo(
    () =>
      [...confidenceTypes]
        .sort((a, b) => a.order - b.order)
        .map((c) => c.id),
    [confidenceTypes],
  );

  const filtered = useMemo(
    () =>
      applyGraphFilters(
        allEntities,
        allRelationships,
        cases,
        groups,
        state,
        confidenceOrder,
      ),
    [
      allEntities,
      allRelationships,
      cases,
      groups,
      state,
      confidenceOrder,
    ],
  );

  const center = useMemo(() => {
    if (!filtered.focusId) return null;
    return (
      filtered.entities.find((e) => e.id === filtered.focusId) ??
      filtered.entities[0] ??
      null
    );
  }, [filtered.entities, filtered.focusId]);

  const legend = useMemo(
    () =>
      buildGraphLegend(
        filtered.entities,
        state.colorBy,
        cases,
        groups,
        { entityTypes: entityTypeDefinitions },
      ),
    [
      filtered.entities,
      state.colorBy,
      cases,
      groups,
      entityTypeDefinitions,
    ],
  );

  const hubs = useMemo(() => {
    const ids = filtered.entities.map((e) => e.id);
    return relationshipDegrees(ids, filtered.relationships).slice(0, 6);
  }, [filtered.entities, filtered.relationships]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const e of allEntities) {
      for (const t of e.tags ?? []) tags.add(t);
    }
    return [...tags].sort();
  }, [allEntities]);

  const gravityBlocked =
    filtered.entities.length > GRAPH_MAX_NODES && !state.gravity;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1">
            <Label className="text-xs text-zinc-500">Search</Label>
            <Input
              value={state.search}
              onChange={(e) => pushState({ ...state, search: e.target.value })}
              placeholder="Name, slug, alias…"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Focus entity</Label>
            <Select
              value={state.focusId ?? "_none"}
              onValueChange={(v) =>
                pushState({
                  ...state,
                  focusId: v === "_none" ? null : v,
                })
              }
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Auto</SelectItem>
                {filtered.entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Hops from focus</Label>
            <Select
              value={String(state.hops)}
              onValueChange={(v) =>
                pushState({
                  ...state,
                  hops: (v === "all" ? "all" : Number(v)) as GraphHops,
                })
              }
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Case</Label>
            <Select
              value={state.caseId ?? "_all"}
              onValueChange={(v) =>
                pushState({
                  ...state,
                  caseId: v === "_all" ? null : v,
                })
              }
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All cases</SelectItem>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Group</Label>
            <Select
              value={state.groupId ?? "_all"}
              onValueChange={(v) =>
                pushState({
                  ...state,
                  groupId: v === "_all" ? null : v,
                })
              }
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="rounded border-zinc-600"
              checked={state.gravity}
              disabled={filtered.entities.length > GRAPH_MAX_NODES}
              onChange={(e) =>
                pushState({ ...state, gravity: e.target.checked })
              }
            />
            Gravity
          </label>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Color by</Label>
            <Select
              value={state.colorBy}
              onValueChange={(v) =>
                pushState({ ...state, colorBy: v as GraphColorBy })
              }
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entityType">Entity type</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Cluster by</Label>
            <Select
              value={state.clusterBy}
              disabled={!state.gravity}
              onValueChange={(v) =>
                pushState({ ...state, clusterBy: v as GraphClusterBy })
              }
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Min confidence</Label>
            <Select
              value={state.minConfidence ?? "_any"}
              onValueChange={(v) =>
                pushState({
                  ...state,
                  minConfidence: v === "_any" ? null : v,
                })
              }
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_any">Any</SelectItem>
                {[...confidenceTypes]
                  .sort((a, b) => a.order - b.order)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              className="rounded border-zinc-600"
              checked={state.showIsolates}
              onChange={(e) =>
                pushState({ ...state, showIsolates: e.target.checked })
              }
            />
            Show isolates
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => pushState({ ...DEFAULT_GRAPH_VIEW_STATE, focusId: state.focusId })}
          >
            Clear filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="w-full text-xs text-zinc-500">Entity types</span>
          {filterEntityTypes.map((def) => (
            <button
              key={def.id}
              type="button"
              className={`rounded-md border px-2 py-0.5 text-xs ${
                state.entityTypes.length === 0 ||
                state.entityTypes.includes(def.id)
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 text-zinc-600"
              }`}
              onClick={() =>
                pushState({
                  ...state,
                  entityTypes:
                    state.entityTypes.length === 0
                      ? knownEntityTypeIds.filter((t) => t !== def.id)
                      : toggleList(state.entityTypes, def.id),
                })
              }
            >
              {def.label}
            </button>
          ))}
        </div>

        {relationshipTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-xs text-zinc-500">
              Relationship types
            </span>
            {relationshipTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                className={`rounded-md border px-2 py-0.5 text-xs ${
                  state.relationshipTypes.length === 0 ||
                  state.relationshipTypes.includes(rt.id)
                    ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                    : "border-zinc-800 text-zinc-600"
                }`}
                onClick={() =>
                  pushState({
                    ...state,
                    relationshipTypes:
                      state.relationshipTypes.length === 0
                        ? relationshipTypes
                            .map((x) => x.id)
                            .filter((id) => id !== rt.id)
                        : toggleList(state.relationshipTypes, rt.id),
                  })
                }
              >
                {rt.label}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500">Tags</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`rounded-md border px-2 py-0.5 text-xs ${
                  state.tags.includes(tag)
                    ? "border-blue-700 bg-blue-950/50 text-blue-200"
                    : "border-zinc-800 text-zinc-600"
                }`}
                onClick={() =>
                  pushState({
                    ...state,
                    tags: toggleList(state.tags, tag),
                  })
                }
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {(filtered.trimmedCount > 0 || gravityBlocked) && (
          <p className="text-xs text-amber-200/90">
            {filtered.trimmedCount > 0 &&
              `${filtered.trimmedCount} entities hidden (max ${GRAPH_MAX_NODES}). Narrow filters or reduce hops. `}
            {gravityBlocked &&
              "Gravity is disabled above the node cap — turn off filters first."}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          {center ? (
            <EntityGraph
              center={center}
              entities={filtered.entities}
              relationships={filtered.relationships}
              relationshipTypes={relationshipTypes}
              height={560}
              variant="workspace"
              layoutMode={state.gravity ? "force" : "static"}
              colorBy={state.colorBy}
              clusterBy={state.gravity ? state.clusterBy : "none"}
              cases={cases}
              groups={groups}
              entityTypes={entityTypeDefinitions}
              activeCaseId={state.caseId}
              activeGroupId={state.groupId}
              onFocusEntity={(id) =>
                pushState({ ...state, focusId: id })
              }
            />
          ) : (
            <p className="text-sm text-zinc-500">
              No entities match the current filters.
            </p>
          )}
        </div>

        <aside className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Legend
            </h3>
            <ul className="mt-2 space-y-1.5">
              {legend.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left text-xs text-zinc-300 hover:text-zinc-100"
                    onClick={() => {
                      if (state.colorBy === "case") {
                        pushState({ ...state, caseId: item.id });
                      } else if (state.colorBy === "group") {
                        pushState({ ...state, groupId: item.id });
                      }
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {hubs.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Top hubs
              </h3>
              <ul className="mt-2 space-y-1">
                {hubs.map((h) => {
                  const ent = filtered.entities.find(
                    (e) => e.id === h.entityId,
                  );
                  if (!ent) return null;
                  return (
                    <li key={h.entityId}>
                      <button
                        type="button"
                        className="text-xs text-blue-400 hover:underline"
                        onClick={() =>
                          pushState({ ...state, focusId: h.entityId })
                        }
                      >
                        {ent.displayName} ({h.degree})
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-zinc-600">
            Shift+click a node to set focus without leaving the page.
          </p>
        </aside>
      </div>
    </div>
  );
}
