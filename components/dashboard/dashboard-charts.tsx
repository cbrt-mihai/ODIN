import { BarChart } from "@/components/investigation/bar-chart";
import { ActivitySparkline } from "@/components/investigation/activity-sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityByDay } from "@/lib/investigation/stats";
import type { ActivityEntry, Case } from "@/lib/types";

const STATUS_COLORS: Record<Case["status"], string> = {
  active: "#34d399",
  archived: "#94a3b8",
  closed: "#f87171",
};

export function DashboardCharts({
  cases,
  activityEntries,
}: {
  cases: Case[];
  activityEntries: ActivityEntry[];
}) {
  const statusCounts: Record<Case["status"], number> = {
    active: 0,
    archived: 0,
    closed: 0,
  };
  for (const c of cases) {
    statusCounts[c.status] += 1;
  }

  const caseItems = (["active", "archived", "closed"] as const)
    .map((status) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status],
      color: STATUS_COLORS[status],
    }))
    .filter((i) => i.value > 0);

  const activityBuckets = activityByDay(activityEntries, 30);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivitySparkline buckets={activityBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cases by status</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            items={caseItems}
            emptyMessage="No cases yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
