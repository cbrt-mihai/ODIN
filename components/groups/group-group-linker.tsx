"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  linkGroupToGroup,
  unlinkGroupFromGroup,
} from "@/lib/actions/groups";
import type { Group } from "@/lib/types";

export function GroupGroupLinker({
  groupId,
  groups,
  linkedGroupIds,
}: {
  groupId: string;
  groups: Group[];
  linkedGroupIds: string[];
}) {
  const router = useRouter();
  const linked = groups.filter((g) => linkedGroupIds.includes(g.id));
  const available = groups.filter(
    (g) => g.id !== groupId && !linkedGroupIds.includes(g.id),
  );

  if (linked.length === 0 && available.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No other groups available to link.</p>
    );
  }

  return (
    <div className="space-y-3">
      {linked.length > 0 ? (
        <ul className="space-y-1">
          {linked.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm"
            >
              <Link
                href={`/groups/${g.id}`}
                className="flex min-w-0 items-center gap-2 hover:text-blue-400"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: g.color ?? "#6366f1" }}
                  aria-hidden
                />
                <span className="break-words">{g.title}</span>
              </Link>
              <button
                type="button"
                className="shrink-0 text-zinc-600 hover:text-red-400"
                onClick={async () => {
                  await unlinkGroupFromGroup(groupId, g.id);
                  router.refresh();
                }}
                aria-label={`Unlink group ${g.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No linked groups.</p>
      )}
      {available.length > 0 && (
        <Select
          onValueChange={async (otherId) => {
            await linkGroupToGroup(groupId, otherId);
            router.refresh();
          }}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Link another group" />
          </SelectTrigger>
          <SelectContent>
            {available.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
