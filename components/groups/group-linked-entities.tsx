"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { EntityTypeBadge } from "@/components/entities/entity-type-badge";
import { unlinkEntityFromGroup } from "@/lib/actions/groups";
import type { EntitySummary } from "@/lib/types";

export function GroupLinkedEntities({
  groupId,
  entities,
}: {
  groupId: string;
  entities: EntitySummary[];
}) {

  if (entities.length === 0) {
    return <p className="text-sm text-zinc-500">No entities linked.</p>;
  }

  return (
    <ul className="space-y-2">
      {entities.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2"
        >
          <Link
            href={`/entities/${e.id}`}
            className="flex min-w-0 items-center gap-2 text-sm hover:text-blue-400"
          >
            <EntityTypeBadge type={e.type} />
            <span className="truncate">{e.displayName}</span>
          </Link>
          <button
            type="button"
            className="shrink-0 text-zinc-600 hover:text-red-400"
            onClick={() => unlinkEntityFromGroup(groupId, e.id)}
            aria-label={`Remove ${e.displayName} from group`}
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
