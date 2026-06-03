"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import { getPlaybooks, savePlaybooks } from "@/lib/storage";
import { movePlaybookToTrash } from "@/lib/storage/trash";
import type { Playbook, PlaybookStep } from "@/lib/types";

export async function listPlaybooks() {
  const { playbooks } = await getPlaybooks();
  return playbooks;
}

export async function createPlaybook(title: string, description?: string) {
  const { playbooks } = await getPlaybooks();
  const pb: Playbook = {
    id: uuidv4(),
    title: title.trim(),
    description,
    steps: [],
  };
  playbooks.push(pb);
  await savePlaybooks({ playbooks });
  await logActivity({
    action: "create",
    targetType: "playbook",
    targetId: pb.id,
    summary: `Created playbook "${pb.title}"`,
  });
  return pb;
}

export async function addPlaybookStep(
  playbookId: string,
  title: string,
  description?: string,
) {
  const { playbooks } = await getPlaybooks();
  const pb = playbooks.find((p) => p.id === playbookId);
  if (!pb) throw new Error("Playbook not found");
  const step: PlaybookStep = {
    id: uuidv4(),
    title: title.trim(),
    description,
    order: pb.steps.length,
  };
  pb.steps.push(step);
  await savePlaybooks({ playbooks });
  return step;
}

export async function updatePlaybookStep(
  playbookId: string,
  stepId: string,
  patch: Partial<
    Pick<PlaybookStep, "title" | "description" | "toolId" | "resourceId">
  >,
) {
  const { playbooks } = await getPlaybooks();
  const pb = playbooks.find((p) => p.id === playbookId);
  if (!pb) throw new Error("Playbook not found");
  const step = pb.steps.find((s) => s.id === stepId);
  if (!step) throw new Error("Step not found");
  Object.assign(step, patch);
  if (patch.title) step.title = patch.title.trim();
  await savePlaybooks({ playbooks });
  return step;
}

export async function deletePlaybookStep(playbookId: string, stepId: string) {
  const { playbooks } = await getPlaybooks();
  const pb = playbooks.find((p) => p.id === playbookId);
  if (!pb) return;
  pb.steps = pb.steps
    .filter((s) => s.id !== stepId)
    .map((s, i) => ({ ...s, order: i }));
  await savePlaybooks({ playbooks });
}

export async function deletePlaybook(id: string) {
  const { playbooks } = await getPlaybooks();
  const pb = playbooks.find((p) => p.id === id);
  if (!pb) return;
  await movePlaybookToTrash(pb);
  await logActivity({
    action: "delete",
    targetType: "playbook",
    targetId: id,
    summary: `Moved playbook "${pb.title}" to trash`,
  });
  revalidatePath("/playbooks");
  revalidatePath("/trash");
}
