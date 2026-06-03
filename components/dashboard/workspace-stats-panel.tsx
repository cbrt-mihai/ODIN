import { BarChart } from "@/components/investigation/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkspaceStats } from "@/lib/workspace/stats";

const TYPE_COLORS: Record<string, string> = {
  person: "#60a5fa",
  organization: "#34d399",
  domain: "#fbbf24",
  general: "#a78bfa",
};

const TYPE_LABELS: Record<string, string> = {
  person: "People",
  organization: "Organizations",
  domain: "Domains",
  general: "General",
};

export function WorkspaceStatsPanel({ stats }: { stats: WorkspaceStats }) {
  const typeItems = Object.entries(stats.entitiesByType)
    .map(([type, value]) => ({
      label: TYPE_LABELS[type] ?? type,
      value,
      color: TYPE_COLORS[type] ?? "#71717a",
    }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);

  const secondary = [
    {
      label: "Relationships",
      value: stats.relationships,
      hint: "Linked entities",
    },
    {
      label: "Timeline events",
      value: stats.totalTimelineEvents,
      hint: "Across all entities",
    },
    {
      label: "With evidence",
      value: stats.entitiesWithProofs,
      hint: "Entity-level proof",
    },
    {
      label: "Same-name clusters",
      value: stats.duplicateNameClusters,
      hint: "Review on Duplicates",
    },
    {
      label: "Emails extracted",
      value: stats.indicators.emails,
      hint: "From field content",
    },
    {
      label: "Domains extracted",
      value: stats.indicators.domains,
      hint: "From field content",
    },
    {
      label: "Activity (7d)",
      value: stats.activityLast7Days,
      hint: `${stats.activityLast30Days} in 30 days`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secondary.map((item) => (
          <Card key={item.label} className="border-zinc-800/80 bg-zinc-900/30">
            <CardContent className="pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
                {item.value}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {typeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entities by type</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart items={typeItems} emptyMessage="No entities." />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
