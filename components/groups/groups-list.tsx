"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Group } from "@/lib/types";

export function GroupsList({ groups }: { groups: Group[] }) {
  return (
    <>
      {groups.map((g) => (
        <li key={g.id}>
          <Link
            href={`/groups/${g.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: g.color ?? "#6366f1" }}
              />
              <div className="min-w-0">
                <span className="font-medium">{g.title}</span>
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
    </>
  );
}
