import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivity } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export default async function ActivityPage() {
  const { entries } = await getActivity();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Recent changes across entities, cases, tools, and imports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 text-sm">
              {entries.map((e) => (
                <li key={e.id} className="py-3 flex gap-3">
                  <span className="shrink-0 text-xs text-zinc-500 w-36">
                    {formatDate(e.at)}
                  </span>
                  <span className="capitalize text-xs text-zinc-600 w-16">
                    {e.action}
                  </span>
                  <span className="text-zinc-300">{e.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
