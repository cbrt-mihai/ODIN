"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPlaybookStep,
  createPlaybook,
  deletePlaybook,
  deletePlaybookStep,
  updatePlaybookStep,
} from "@/lib/actions/playbooks";
import type { Playbook, Resource, Tool } from "@/lib/types";

export function PlaybookManager({
  playbooks,
  tools,
  resources,
}: {
  playbooks: Playbook[];
  tools: Tool[];
  resources: Resource[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [title, setTitle] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [activePb, setActivePb] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<{
    playbookId: string;
    stepId: string;
  } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editToolId, setEditToolId] = useState("");
  const [editResourceId, setEditResourceId] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createPlaybook(title);
    setTitle("");
    router.refresh();
  }

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!activePb || !stepTitle.trim()) return;
    await addPlaybookStep(activePb, stepTitle);
    setStepTitle("");
    router.refresh();
  }

  function startEditStep(playbookId: string, step: Playbook["steps"][0]) {
    setEditingStep({ playbookId, stepId: step.id });
    setEditTitle(step.title);
    setEditDesc(step.description ?? "");
    setEditToolId(step.toolId ?? "");
    setEditResourceId(step.resourceId ?? "");
  }

  async function saveStep() {
    if (!editingStep) return;
    await updatePlaybookStep(editingStep.playbookId, editingStep.stepId, {
      title: editTitle,
      description: editDesc || undefined,
      toolId: editToolId || undefined,
      resourceId: editResourceId || undefined,
    });
    setEditingStep(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="flex gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New playbook title"
          className="max-w-md"
        />
        <Button type="submit">Create playbook</Button>
      </form>

      {playbooks.length === 0 ? (
        <p className="text-sm text-zinc-500">No playbooks yet.</p>
      ) : (
        <ul className="space-y-6">
          {playbooks.map((pb) => (
            <li
              key={pb.id}
              className="rounded-lg border border-zinc-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{pb.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Delete playbook",
                      description: `Move playbook "${pb.title}" to trash?`,
                      confirmLabel: "Move to trash",
                      destructive: true,
                    });
                    if (!ok) return;
                    await deletePlaybook(pb.id);
                    router.refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
              {pb.description && (
                <p className="text-sm text-zinc-500">{pb.description}</p>
              )}
              <ol className="space-y-3 text-sm text-zinc-300">
                {pb.steps
                  .sort((a, b) => a.order - b.order)
                  .map((s) => (
                    <li
                      key={s.id}
                      className="rounded-md border border-zinc-800/80 p-3"
                    >
                      {editingStep?.stepId === s.id &&
                      editingStep.playbookId === pb.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <Textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={2}
                            placeholder="Description"
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Tool</Label>
                              <Select
                                value={editToolId || "_none"}
                                onValueChange={(v) =>
                                  setEditToolId(v === "_none" ? "" : v)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">None</SelectItem>
                                  {tools.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Resource</Label>
                              <Select
                                value={editResourceId || "_none"}
                                onValueChange={(v) =>
                                  setEditResourceId(v === "_none" ? "" : v)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">None</SelectItem>
                                  {resources.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveStep}>
                              Save step
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingStep(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-medium">{s.title}</span>
                            {s.description && (
                              <p className="mt-1 text-xs text-zinc-500">
                                {s.description}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              {s.toolId && (
                                <Link
                                  href={`/tools/${s.toolId}`}
                                  className="text-blue-400 hover:underline"
                                >
                                  Tool
                                </Link>
                              )}
                              {s.resourceId && (
                                <Link
                                  href={`/resources/${s.resourceId}`}
                                  className="text-blue-400 hover:underline"
                                >
                                  Resource
                                </Link>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditStep(pb.id, s)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400"
                              onClick={async () => {
                                const ok = await confirmDialog({
                                  title: "Remove step",
                                  description: `Remove step "${s.title}"?`,
                                  confirmLabel: "Remove",
                                  destructive: true,
                                });
                                if (!ok) return;
                                await deletePlaybookStep(pb.id, s.id);
                                router.refresh();
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
              </ol>
              <form
                onSubmit={addStep}
                className="flex gap-2"
                onFocus={() => setActivePb(pb.id)}
              >
                <Input
                  value={activePb === pb.id ? stepTitle : ""}
                  onChange={(e) => {
                    setActivePb(pb.id);
                    setStepTitle(e.target.value);
                  }}
                  placeholder="Add step"
                  className="max-w-xs"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Add step
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
