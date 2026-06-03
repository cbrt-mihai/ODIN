import Link from "next/link";
import { Briefcase, Copy, Inbox, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listInboxItems } from "@/lib/actions/inbox";
import { listTools } from "@/lib/actions/tools";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { PinnedSection } from "@/components/dashboard/pinned-section";
import { WorkspaceStatsPanel } from "@/components/dashboard/workspace-stats-panel";
import { EntityRefLabelFromIdentity } from "@/components/entities/entity-ref-label";
import { buildEntityIdentityMap } from "@/lib/entities/identity";
import { getActivity, getRelationships } from "@/lib/storage";
import { computeWorkspaceStats } from "@/lib/workspace/stats";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [entities, cases, tools, inbox, activity, relationships] =
    await Promise.all([
      listEntities(),
      listCases(),
      listTools(),
      listInboxItems(),
      getActivity(),
      getRelationships(),
    ]);

  const entityIdentityMap = buildEntityIdentityMap(entities);

  const workspaceStats = computeWorkspaceStats({
    entities,
    cases,
    relationships: relationships.relationships,
    inbox,
    activity: activity.entries,
  });

  const pendingInbox = inbox.filter((i) => i.status === "pending").length;

  const stats = [
    { label: "Entities", value: entities.length, href: "/entities", icon: Users },
    { label: "Cases", value: cases.length, href: "/cases", icon: Briefcase },
    { label: "Tools", value: tools.length, href: "/tools", icon: Wrench },
    {
      label: "Inbox pending",
      value: pendingInbox,
      href: "/inbox",
      icon: Inbox,
    },
    {
      label: "Duplicate clusters",
      value: workspaceStats.duplicateNameClusters,
      href: "/duplicates",
      icon: Copy,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Local OSINT workspace — data stored in{" "}
          <code className="rounded bg-zinc-800 px-1 text-xs">data/</code>.{" "}
          <Link href="/docs" className="text-blue-400 hover:underline">
            User guide
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="block">
              <Card className="interactive-card h-full hover:border-zinc-600 hover:shadow-md hover:shadow-black/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    {s.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <PinnedSection />

      <WorkspaceStatsPanel stats={workspaceStats} />

      <DashboardCharts cases={cases} activityEntries={activity.entries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent entities</CardTitle>
          </CardHeader>
          <CardContent>
            {entities.length === 0 ? (
              <p className="text-sm text-zinc-500">No entities yet.</p>
            ) : (
              <ul className="space-y-2">
                {entities.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/entities/${e.id}`}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-zinc-800/80"
                    >
                      <div className="min-w-0">
                        <EntityRefLabelFromIdentity
                          identity={entityIdentityMap.get(e.id)!}
                          monoPath={entityIdentityMap.get(e.id)?.isHomonym}
                        />
                      </div>
                      <span className="shrink-0 text-xs capitalize text-zinc-500">
                        {e.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.entries.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activity.entries.slice(0, 10).map((entry) => (
                  <li key={entry.id} className="text-zinc-400">
                    <span className="text-zinc-300">{entry.summary}</span>
                    <span className="mt-0.5 block text-xs">
                      {formatDate(entry.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
