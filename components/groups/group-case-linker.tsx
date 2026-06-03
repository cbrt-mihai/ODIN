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
import { linkGroupToCase, unlinkGroupFromCase } from "@/lib/actions/cases";
import type { Case } from "@/lib/types";

export function GroupCaseLinker({
  groupId,
  cases,
  linkedCaseIds,
}: {
  groupId: string;
  cases: Case[];
  linkedCaseIds: string[];
}) {
  const router = useRouter();
  const linked = cases.filter((c) => linkedCaseIds.includes(c.id));
  const available = cases.filter((c) => !linkedCaseIds.includes(c.id));

  if (linked.length === 0 && available.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No cases available to link.</p>
    );
  }

  return (
    <div className="space-y-3">
      {linked.length > 0 ? (
        <ul className="space-y-1">
          {linked.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm"
            >
              <Link href={`/cases/${c.id}`} className="min-w-0 hover:text-blue-400">
                <span className="break-words">{c.title}</span>
                <span className="ml-2 text-xs capitalize text-zinc-500">
                  {c.status}
                </span>
              </Link>
              <button
                type="button"
                className="shrink-0 text-zinc-600 hover:text-red-400"
                onClick={async () => {
                  await unlinkGroupFromCase(c.id, groupId);
                  router.refresh();
                }}
                aria-label={`Unlink case ${c.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No linked cases.</p>
      )}
      {available.length > 0 && (
        <Select
          onValueChange={async (caseId) => {
            await linkGroupToCase(caseId, groupId);
            router.refresh();
          }}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Link a case" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title} ({c.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
