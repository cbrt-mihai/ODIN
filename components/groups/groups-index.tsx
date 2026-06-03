"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { SavedViewsPanel } from "@/components/list/saved-views-panel";
import { useListFilters } from "@/components/list/use-list-filters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GROUP_SORT_OPTIONS,
  groupFilterDefaults,
  filterAndSortGroups,
} from "@/lib/list-filter/groups";
import { ARCHIVE_FILTER_OPTIONS, isGroupArchived } from "@/lib/archive/status";
import { ArchivedBadge } from "@/components/archive/archived-badge";
import type { Group } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function GroupsIndex({ groups }: { groups: Group[] }) {
  const defaults = useMemo(() => groupFilterDefaults(), []);
  const { state, setState, clearFilters } = useListFilters(defaults);

  const filtered = useMemo(
    () => filterAndSortGroups(groups, state),
    [groups, state],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        subtitle="Collections of entities across cases. Search, sort, and filter by tags."
      />

      <ListFilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onClear={clearFilters}
        searchPlaceholder="Search title, description, tags…"
        sortOptions={[...GROUP_SORT_OPTIONS]}
        filterSelects={[
          {
            id: "archived",
            label: "Archive",
            options: ARCHIVE_FILTER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
        tagFilter={{ placeholder: "team, suspects" }}
        resultCount={filtered.length}
        totalCount={groups.length}
        advanced={
          <div className="max-w-xs">
            <Label className="text-xs text-zinc-500">Minimum entities</Label>
            <Input
              type="number"
              min={0}
              className="mt-1 h-8 text-sm"
              value={state.minEntities ?? ""}
              onChange={(e) =>
                setState({
                  minEntities: e.target.value || undefined,
                })
              }
              placeholder="e.g. 2"
            />
          </div>
        }
        savedViews={
          <SavedViewsPanel
            page="groups"
            pathname="/groups"
            currentState={state}
            defaultName="Custom group view"
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New group</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>

      {groups.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No groups yet"
          description="Create a group to organize related entities."
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
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800/90 overflow-hidden">
          {filtered.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="interactive-card flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/80"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    profileImage={g.profileImage}
                    kind="group"
                    groupColor={g.color}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-100">{g.title}</span>
                      {isGroupArchived(g) && <ArchivedBadge />}
                    </div>
                    {g.description && (
                      <p className="truncate text-xs text-zinc-500">
                        {g.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {g.entityIds.length} entities
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatDate(g.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
