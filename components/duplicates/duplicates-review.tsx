"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { MergePanel } from "@/components/entities/merge-panel";
import {
  EntityComparePanel,
  EntityCompareSummary,
} from "@/components/entities/entity-compare-panel";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DuplicateCluster,
  DuplicateMatchReason,
} from "@/lib/actions/duplicates";
import {
  buildEntityIdentityMap,
  entityPickerLabel,
} from "@/lib/entities/identity";
import type { Entity, EntityType } from "@/lib/types";

const REASON_LABELS: Record<DuplicateMatchReason, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
};

function ClusterPreview({
  entities,
  allEntities,
}: {
  entities: Entity[];
  allEntities: Entity[];
}) {
  if (entities.length === 2) {
    return (
      <EntityComparePanel
        primary={entities[0]!}
        secondary={entities[1]!}
        title=""
        allEntities={allEntities}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entities.map((entity, i) => (
        <EntityCompareSummary
          key={entity.id}
          entity={entity}
          role={i === 0 ? "primary" : "candidate"}
          allEntities={allEntities}
        />
      ))}
    </div>
  );
}

export function DuplicatesReview({
  clusters,
  entityTypeOptions,
}: {
  clusters: DuplicateCluster[];
  entityTypeOptions: { value: EntityType | "all"; label: string }[];
}) {
  const allEntities = useMemo(() => {
    const byId = new Map<string, Entity>();
    for (const cluster of clusters) {
      for (const e of cluster.entities) byId.set(e.id, e);
    }
    return [...byId.values()];
  }, [clusters]);

  const identityMap = useMemo(
    () => buildEntityIdentityMap(allEntities),
    [allEntities],
  );
  const [reasonFilter, setReasonFilter] = useState<DuplicateMatchReason | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [minSize, setMinSize] = useState(2);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [primaryByCluster, setPrimaryByCluster] = useState<
    Record<string, string>
  >({});

  const filtered = useMemo(() => {
    return clusters.filter((cluster) => {
      if (cluster.entities.length < minSize) return false;
      if (
        reasonFilter !== "all" &&
        !cluster.reasons.includes(reasonFilter)
      ) {
        return false;
      }
      if (
        typeFilter !== "all" &&
        !cluster.entities.some((e) => e.type === typeFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [clusters, minSize, reasonFilter, typeFilter]);

  function primaryFor(cluster: DuplicateCluster): Entity {
    const chosen = primaryByCluster[cluster.id];
    return (
      cluster.entities.find((e) => e.id === chosen) ?? cluster.entities[0]
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duplicates"
        subtitle="Review possible duplicate entities side-by-side before merging."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Match type</label>
          <Select
            value={reasonFilter}
            onValueChange={(v) =>
              setReasonFilter(v as DuplicateMatchReason | "all")
            }
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All matches</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Entity type</label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as EntityType | "all")}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Min cluster size</label>
          <Select
            value={String(minSize)}
            onValueChange={(v) => setMinSize(Number(v))}
          >
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Copy}
          title="No duplicate clusters"
          description={
            clusters.length === 0
              ? "No possible duplicates were found in the workspace."
              : "No clusters match the current filters."
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((cluster) => {
            const expanded = expandedId === cluster.id;
            const primary = primaryFor(cluster);
            const secondaries = cluster.entities.filter(
              (e) => e.id !== primary.id,
            );

            return (
              <li key={cluster.id}>
                <Card className="border-zinc-800/90">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base text-zinc-100">
                          {cluster.entities.length} possible duplicates
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {cluster.reasons.map((r) => (
                            <span
                              key={r}
                              className="rounded-full bg-amber-950/50 px-2 py-0.5 text-xs text-amber-200"
                            >
                              {REASON_LABELS[r]}
                            </span>
                          ))}
                          <span className="text-xs text-zinc-500">
                            score {cluster.score}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setExpandedId(expanded ? null : cluster.id)
                        }
                      >
                        {expanded ? "Collapse" : "Review merge"}
                      </Button>
                    </div>

                    {!expanded && (
                      <div className="mt-4">
                        <ClusterPreview
                          entities={cluster.entities}
                          allEntities={allEntities}
                        />
                      </div>
                    )}
                  </CardHeader>
                  {expanded && (
                    <CardContent className="space-y-6 border-t border-zinc-800 pt-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-zinc-400">Primary entity:</span>
                        <Select
                          value={primary.id}
                          onValueChange={(id) =>
                            setPrimaryByCluster((prev) => ({
                              ...prev,
                              [cluster.id]: id,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cluster.entities.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {entityPickerLabel(e, identityMap)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {secondaries.length === 1 ? (
                        <EntityComparePanel
                          primary={primary}
                          secondary={secondaries[0]!}
                          title="Compare before merge"
                          allEntities={allEntities}
                        />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <EntityCompareSummary
                            entity={primary}
                            role="primary"
                            allEntities={allEntities}
                          />
                          {secondaries.map((e) => (
                            <EntityCompareSummary
                              key={e.id}
                              entity={e}
                              role="candidate"
                              allEntities={allEntities}
                            />
                          ))}
                        </div>
                      )}

                      {secondaries.map((secondary) => (
                        <MergePanel
                          key={secondary.id}
                          primary={primary}
                          secondary={secondary}
                          showCompare={secondaries.length > 1}
                          allEntities={allEntities}
                        />
                      ))}
                    </CardContent>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
