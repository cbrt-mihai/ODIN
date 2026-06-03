import Link from "next/link";
import { RestoreTrashButton } from "@/components/trash/restore-trash-button";
import { listTrash } from "@/lib/storage/trash";
import type { TrashItemType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<TrashItemType, string> = {
  entity: "Entity",
  case: "Case",
  group: "Group",
  tool: "Tool",
  resource: "Resource",
  playbook: "Playbook",
};

export default async function TrashPage() {
  const entries = await listTrash();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Trash</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Soft-deleted entities, cases, groups, tools, resources, and playbooks
          can be restored or permanently removed.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Trash is empty.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {entries.map((e) => (
            <li
              key={`${e.itemType}-${e.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <span className="font-medium">{e.displayName}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {TYPE_LABELS[e.itemType]}
                </span>
                <p className="text-xs text-zinc-500">
                  {formatDate(e.deletedAt)}
                </p>
              </div>
              <RestoreTrashButton id={e.id} itemType={e.itemType} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
        <Link href="/entities" className="hover:text-zinc-300">
          ← Entities
        </Link>
        <Link href="/cases" className="hover:text-zinc-300">
          Cases
        </Link>
        <Link href="/tools" className="hover:text-zinc-300">
          Tools
        </Link>
      </div>
    </div>
  );
}
