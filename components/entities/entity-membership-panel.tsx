"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, FolderOpen, Plus, X } from "lucide-react";
import { QuickEditButton } from "@/components/entities/quick-edit-button";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCase,
  linkEntityToCase,
  unlinkEntityFromCase,
} from "@/lib/actions/cases";
import {
  createGroupByTitle,
  linkEntityToGroup,
  unlinkEntityFromGroup,
} from "@/lib/actions/groups";
import type { Case, Entity, Group } from "@/lib/types";

function CreateAndLinkRow({
  placeholder,
  buttonLabel,
  disabled,
  onCreate,
}: {
  placeholder: string;
  buttonLabel: string;
  disabled?: boolean;
  onCreate: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreate(trimmed);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="max-w-xs"
        disabled={disabled || busy}
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={disabled || busy || !title.trim()}
      >
        <Plus className="h-4 w-4" />
        {busy ? "Creating…" : buttonLabel}
      </Button>
    </form>
  );
}

export function EntityMembershipPanel({
  entity,
  cases,
  groups,
  readOnly,
  onQuickEdit,
  onDoneManage,
  focusOpen,
}: {
  entity: Entity;
  cases: Case[];
  groups: Group[];
  readOnly?: boolean;
  onQuickEdit?: () => void;
  onDoneManage?: () => void;
  focusOpen?: boolean;
}) {
  const router = useRouter();
  const [managing, setManaging] = useState(false);
  const canManage = !readOnly || managing;

  useEffect(() => {
    if (focusOpen) setManaging(true);
  }, [focusOpen]);

  useEffect(() => {
    if (readOnly && !focusOpen) setManaging(false);
  }, [readOnly, focusOpen]);

  const linkedCaseIds = new Set([
    ...(entity.caseIds ?? []),
    ...cases.filter((c) => c.entityIds.includes(entity.id)).map((c) => c.id),
  ]);
  const linkedGroupIds = new Set([
    ...(entity.groupIds ?? []),
    ...groups.filter((g) => g.entityIds.includes(entity.id)).map((g) => g.id),
  ]);

  const linkedCases = cases.filter((c) => linkedCaseIds.has(c.id));
  const linkedGroups = groups.filter((g) => linkedGroupIds.has(g.id));
  const availableCases = cases.filter((c) => !linkedCaseIds.has(c.id));
  const availableGroups = groups.filter((g) => !linkedGroupIds.has(g.id));

  async function refreshAfterLink() {
    router.refresh();
  }

  return (
    <CollapsibleCard
      key={focusOpen ? "entity-membership-focus" : "entity-membership"}
      id="entity-membership"
      title="Cases & groups"
      defaultOpen={false}
      forceOpen={focusOpen || managing}
      contentClassName="space-y-6"
      actions={
        readOnly && managing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-zinc-500"
            onClick={(e) => {
              e.stopPropagation();
              setManaging(false);
              onDoneManage?.();
            }}
          >
            Done
          </Button>
        ) : readOnly && onQuickEdit ? (
          <QuickEditButton
            label="Edit cases & groups"
            onClick={() => {
              setManaging(true);
              onQuickEdit();
            }}
          />
        ) : undefined
      }
    >
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <Briefcase className="h-3.5 w-3.5" />
          Cases ({linkedCases.length})
        </p>
        {linkedCases.length === 0 ? (
          <p className="text-sm text-zinc-500">Not in any case.</p>
        ) : (
          <ul className="space-y-1">
            {linkedCases.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm"
              >
                <Link href={`/cases/${c.id}`} className="hover:text-blue-400">
                  {c.title}
                  <span className="ml-2 text-xs capitalize text-zinc-500">
                    {c.status}
                  </span>
                </Link>
                {canManage && (
                  <button
                    type="button"
                    className="text-zinc-600 hover:text-red-400"
                    onClick={async () => {
                      await unlinkEntityFromCase(c.id, entity.id);
                      await refreshAfterLink();
                    }}
                    aria-label={`Remove from case ${c.title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <>
            {availableCases.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Select
                  onValueChange={async (caseId) => {
                    await linkEntityToCase(caseId, entity.id);
                    await refreshAfterLink();
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add to existing case…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <CreateAndLinkRow
              placeholder="New case title"
              buttonLabel="Create case & add"
              onCreate={async (title) => {
                const c = await createCase(title);
                await linkEntityToCase(c.id, entity.id);
                await refreshAfterLink();
              }}
            />
          </>
        )}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <FolderOpen className="h-3.5 w-3.5" />
          Groups ({linkedGroups.length})
        </p>
        {linkedGroups.length === 0 ? (
          <p className="text-sm text-zinc-500">Not in any group.</p>
        ) : (
          <ul className="space-y-1">
            {linkedGroups.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm"
              >
                <Link href={`/groups/${g.id}`} className="hover:text-blue-400">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: g.color ?? "#6366f1" }}
                  />
                  {g.title}
                </Link>
                {canManage && (
                  <button
                    type="button"
                    className="text-zinc-600 hover:text-red-400"
                    onClick={async () => {
                      await unlinkEntityFromGroup(g.id, entity.id);
                      await refreshAfterLink();
                    }}
                    aria-label={`Remove from group ${g.title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <>
            {availableGroups.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Select
                  onValueChange={async (groupId) => {
                    await linkEntityToGroup(groupId, entity.id);
                    await refreshAfterLink();
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add to existing group…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <CreateAndLinkRow
              placeholder="New group title"
              buttonLabel="Create group & add"
              onCreate={async (title) => {
                const g = await createGroupByTitle(title);
                await linkEntityToGroup(g.id, entity.id);
                await refreshAfterLink();
              }}
            />
          </>
        )}
      </div>
    </CollapsibleCard>
  );
}
