"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileImageField } from "@/components/profile/profile-image-field";
import { Label } from "@/components/ui/label";
import { deleteGroup, updateGroup } from "@/lib/actions/groups";
import type { Case, Entity, Group } from "@/lib/types";

export function GroupEditor({
  group,
  entities = [],
  cases = [],
}: {
  group: Group;
  entities?: Entity[];
  cases?: Case[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [title, setTitle] = useState(group.title);
  const [description, setDescription] = useState(group.description ?? "");
  const [color, setColor] = useState(group.color ?? "#6366f1");
  const [profileImage, setProfileImage] = useState(group.profileImage);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateGroup({
        ...group,
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        profileImage,
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 flex-1 gap-6 md:grid-cols-[minmax(11rem,auto)_minmax(0,1fr)] md:items-start">
          <div className="flex justify-center md:block">
            {editing ? (
              <ProfileImageField
                scope="group"
                recordId={group.id}
                value={profileImage}
                onChange={setProfileImage}
                groupColor={color}
                layout="compact"
              />
            ) : (
              <ProfileAvatar
                profileImage={group.profileImage}
                shape="square"
                kind="group"
                groupColor={group.color}
                size="lg"
              />
            )}
          </div>
          <div className="min-w-0">
            {editing ? (
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded border border-zinc-700 bg-transparent"
                  aria-label="Group color"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full max-w-2xl rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-2xl font-bold"
                />
              </div>
            ) : (
              <h1 className="flex items-center gap-3 text-2xl font-bold">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {group.title}
              </h1>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTitle(group.title);
                  setDescription(group.description ?? "");
                  setColor(group.color ?? "#6366f1");
                  setProfileImage(group.profileImage);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Edit group
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: "Delete group",
                    description: `Move group "${group.title}" to trash? Linked entities will be unlinked until restore.`,
                    confirmLabel: "Move to trash",
                    destructive: true,
                  });
                  if (!ok) return;
                  await deleteGroup(group.id);
                  router.push("/groups");
                  router.refresh();
                }}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="max-w-2xl space-y-4">
          <div className="space-y-2">
            <Label>Description (Obsidian markdown)</Label>
            <MarkdownFieldEditor
              value={description}
              onChange={setDescription}
              flavor="obsidian"
              entities={entities}
              cases={cases}
              placeholder="What this group represents…"
            />
          </div>
        </div>
      ) : group.description ? (
        <p className="max-w-2xl whitespace-pre-wrap text-sm text-zinc-300">
          {group.description}
        </p>
      ) : (
        <p className="text-sm text-zinc-500">No description.</p>
      )}
    </div>
  );
}
