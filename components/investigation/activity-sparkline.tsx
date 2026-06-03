"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function ActivitySparkline({
  buckets,
  className,
}: {
  buckets: { date: string; count: number }[];
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = useMemo(
    () => Math.max(...buckets.map((b) => b.count), 1),
    [buckets],
  );
  const total = buckets.reduce((s, b) => s + b.count, 0);

  if (total === 0) {
    return (
      <p className={cn("text-sm text-zinc-500", className)}>
        No activity in the last {buckets.length} days.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex h-24 items-end gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2"
        role="img"
        aria-label={`Activity over ${buckets.length} days, ${total} total actions`}
      >
        {buckets.map((b, i) => {
          const h = Math.max(4, Math.round((b.count / max) * 100));
          return (
            <div
              key={b.date}
              className="relative flex flex-1 flex-col justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={cn(
                  "w-full rounded-t-sm bg-indigo-500/80 transition-colors",
                  hovered === i && "bg-indigo-400",
                  b.count === 0 && "bg-zinc-800",
                )}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      {hovered !== null && (
        <p className="text-xs text-zinc-400">
          {buckets[hovered].date}: {buckets[hovered].count} action
          {buckets[hovered].count === 1 ? "" : "s"}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        {total} actions in the last {buckets.length} days
      </p>
    </div>
  );
}
