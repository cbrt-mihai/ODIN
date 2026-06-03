import { Suspense } from "react";
import { GroupsIndex } from "@/components/groups/groups-index";
import { listGroups } from "@/lib/actions/groups";

export default async function GroupsPage() {
  const groups = await listGroups();
  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
      }
    >
      <GroupsIndex groups={groups} />
    </Suspense>
  );
}
