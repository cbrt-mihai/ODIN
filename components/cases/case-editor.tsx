"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownFieldEditor } from "@/components/entities/markdown-field-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileImageField } from "@/components/profile/profile-image-field";
import { deleteCase, updateCase } from "@/lib/actions/cases";
import type { Case, Entity } from "@/lib/types";

export function CaseEditor({
  caseData,
  entities = [],
  cases = [],
}: {
  caseData: Case;
  entities?: Entity[];
  cases?: Case[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [title, setTitle] = useState(caseData.title);
  const [description, setDescription] = useState(caseData.description ?? "");
  const [status, setStatus] = useState(caseData.status);
  const [profileImage, setProfileImage] = useState(caseData.profileImage);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateCase({
        ...caseData,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
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
                scope="case"
                recordId={caseData.id}
                value={profileImage}
                onChange={setProfileImage}
                layout="compact"
              />
            ) : (
              <ProfileAvatar
                profileImage={caseData.profileImage}
                kind="case"
                size="lg"
                shape="square"
              />
            )}
          </div>
          <div className="min-w-0">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full max-w-2xl rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-2xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold">{caseData.title}</h1>
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
                  setTitle(caseData.title);
                  setDescription(caseData.description ?? "");
                  setStatus(caseData.status);
                  setProfileImage(caseData.profileImage);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Edit case
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: "Delete case",
                    description: `Move case "${caseData.title}" to trash?`,
                    confirmLabel: "Move to trash",
                    destructive: true,
                  });
                  if (!ok) return;
                  await deleteCase(caseData.id);
                  router.push("/cases");
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
        <div className="space-y-4 max-w-3xl">
          {!profileImage && (
            <p className="text-xs text-zinc-500">
              Optional profile image appears in lists and reports.
            </p>
          )}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as Case["status"])
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Obsidian markdown)</Label>
            <MarkdownFieldEditor
              value={description}
              onChange={setDescription}
              flavor="obsidian"
              entities={entities}
              cases={cases}
              placeholder="Case notes, hypotheses, links…"
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm capitalize text-zinc-400">{caseData.status}</p>
          {caseData.description ? null : (
            <p className="text-sm text-zinc-500">No description.</p>
          )}
        </>
      )}
    </div>
  );
}
