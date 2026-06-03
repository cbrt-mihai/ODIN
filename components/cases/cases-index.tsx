"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { SavedViewsPanel } from "@/components/list/saved-views-panel";
import { useListFilters } from "@/components/list/use-list-filters";
import { CreateCaseForm } from "@/components/cases/create-case-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CASE_SORT_OPTIONS,
  CASE_STATUS_OPTIONS,
  caseFilterDefaults,
  filterAndSortCases,
} from "@/lib/list-filter/cases";
import { ARCHIVE_FILTER_OPTIONS } from "@/lib/archive/status";
import type { ListFilterState } from "@/lib/list-filter/url-state";
import type { Case } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function CasesIndex({
  cases,
  initialFilters,
}: {
  cases: Case[];
  initialFilters?: ListFilterState;
}) {
  const defaults = useMemo(
    () => caseFilterDefaults(initialFilters),
    [initialFilters],
  );
  const { state, setState, clearFilters, activeFilterCount } =
    useListFilters(defaults);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      document
        .getElementById("new-case-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const filtered = useMemo(
    () => filterAndSortCases(cases, state),
    [cases, state],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        subtitle="Investigation workspaces. Filter by status, tags, or search titles and descriptions."
      />

      <ListFilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onClear={clearFilters}
        searchPlaceholder="Search title, description, tags…"
        sortOptions={[...CASE_SORT_OPTIONS]}
        filterSelects={[
          {
            id: "archived",
            label: "Archive",
            options: ARCHIVE_FILTER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
          {
            id: "status",
            label: "Status",
            options: CASE_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          },
        ]}
        tagFilter={{ placeholder: "active, legal" }}
        resultCount={filtered.length}
        totalCount={cases.length}
        savedViews={
          <SavedViewsPanel
            page="cases"
            pathname="/cases"
            currentState={state}
            defaultName={
              state.status && state.status !== "all"
                ? `${state.status} cases`
                : "Custom case view"
            }
          />
        }
      />

      <Card id="new-case-form">
        <CardHeader>
          <CardTitle className="text-base">New case</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CreateCaseForm />
        </CardContent>
      </Card>

      {cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases yet"
          description="Create a case to group entities and timelines."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Adjust filters or clear your search."
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
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.id}`}
                className="interactive-card flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/80"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    profileImage={c.profileImage}
                    kind="case"
                    size="sm"
                  />
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-100">{c.title}</span>
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {c.entityIds.length} entities
                    {(c.tags ?? []).length > 0 &&
                      ` · ${c.tags!.slice(0, 3).join(", ")}`}
                  </p>
                </div>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatDate(c.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
