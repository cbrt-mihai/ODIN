"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { SavedViewsPanel } from "@/components/list/saved-views-panel";
import { useListFilters } from "@/components/list/use-list-filters";
import { CreateEntityForm } from "@/components/entities/create-entity-form";
import { EntityRefLabelFromIdentity } from "@/components/entities/entity-ref-label";
import { EntityTypeBadge } from "@/components/entities/entity-type-badge";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { buildEntityIdentityMap } from "@/lib/entities/identity";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ENTITY_SORT_OPTIONS,
  entityFilterDefaults,
  entityTypeOptionsForSettings,
  filterAndSortEntities,
} from "@/lib/list-filter/entities";
import type { ListFilterState } from "@/lib/list-filter/url-state";
import type { Entity, Settings } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export function EntitiesIndex({
  entities,
  initialFilters,
  settings,
}: {
  entities: Entity[];
  initialFilters?: ListFilterState;
  settings: Settings;
}) {
  const typeOptions = entityTypeOptionsForSettings(settings, entities);
  const defaults = useMemo(
    () => entityFilterDefaults(initialFilters),
    [initialFilters],
  );
  const { state, setState, clearFilters, activeFilterCount } =
    useListFilters(defaults);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      document
        .getElementById("new-entity-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const filtered = useMemo(
    () => filterAndSortEntities(entities, state),
    [entities, state],
  );

  const identityMap = useMemo(
    () => buildEntityIdentityMap(entities),
    [entities],
  );

  const defaultViewName =
    state.type && state.type !== "all"
      ? `${typeOptions.find((t) => t.value === state.type)?.label ?? state.type} entities`
      : state.q?.trim()
        ? `Search: ${state.q.slice(0, 24)}`
        : "Custom entity view";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entities"
        subtitle="People, organizations, domains, and general subjects. Search names, tags, and field content."
      />

      <ListFilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onClear={clearFilters}
        searchPlaceholder="Search name, slug, tags, field content…"
        sortOptions={[...ENTITY_SORT_OPTIONS]}
        filterSelects={[
          {
            id: "type",
            label: "Type",
            options: typeOptions.map((t) => ({
              value: t.value,
              label: t.label,
            })),
          },
        ]}
        tagFilter={{ placeholder: "investigation, lead" }}
        resultCount={filtered.length}
        totalCount={entities.length}
        savedViews={
          <SavedViewsPanel
            page="entities"
            pathname="/entities"
            currentState={state}
            defaultName={defaultViewName}
          />
        }
      />

      <Card id="new-entity-form">
        <CardHeader>
          <CardTitle className="text-base">New entity</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEntityForm entityTypes={settings.entityTypes} />
        </CardContent>
      </Card>

      {entities.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No entities yet"
          description="Create your first entity to start building your investigation graph."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description={
            activeFilterCount > 0
              ? "Try clearing filters or broadening your search."
              : "No entities match."
          }
          action={
            activeFilterCount > 0 ? (
              <button
                type="button"
                className="text-sm text-blue-400 hover:underline"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800/90 overflow-hidden">
          {filtered.map((e) => {
            const identity = identityMap.get(e.id)!;
            return (
            <li key={e.id}>
              <Link
                href={`/entities/${e.id}`}
                className="interactive-card flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/80"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    profileImage={e.profileImage}
                    entityType={e.type}
                    size="sm"
                  />
                  <EntityTypeBadge type={e.type} />
                  <EntityRefLabelFromIdentity
                    identity={identity}
                    monoPath={identity.isHomonym}
                  />
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatDate(e.updatedAt)}
                </span>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
