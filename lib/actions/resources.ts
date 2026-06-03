"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import { getResources, saveResources } from "@/lib/storage";
import { moveResourceToTrash } from "@/lib/storage/trash";
import type { Resource, ResourceKind } from "@/lib/types";

export async function listResources() {
  const { resources } = await getResources();
  return resources.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getResourceById(id: string) {
  const { resources } = await getResources();
  return resources.find((r) => r.id === id) ?? null;
}

export async function saveResource(input: {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  kind: ResourceKind;
  url?: string;
  page?: Resource["page"];
}) {
  const { resources } = await getResources();
  const now = new Date().toISOString();
  let resource: Resource;
  if (input.id) {
    const existing = resources.find((r) => r.id === input.id);
    if (!existing) throw new Error("Resource not found");
    resource = {
      ...existing,
      ...input,
      tags: input.tags ?? existing.tags,
      updatedAt: now,
    };
    const idx = resources.findIndex((r) => r.id === input.id);
    resources[idx] = resource;
  } else {
    resource = {
      id: uuidv4(),
      name: input.name.trim(),
      description: input.description,
      category: input.category,
      tags: input.tags ?? [],
      kind: input.kind,
      url: input.url,
      page: input.page,
      createdAt: now,
      updatedAt: now,
    };
    resources.push(resource);
  }
  await saveResources({ resources });
  await logActivity({
    action: input.id ? "update" : "create",
    targetType: "resource",
    targetId: resource.id,
    summary: `${input.id ? "Updated" : "Created"} resource "${resource.name}"`,
  });
  revalidatePath("/resources");
  revalidatePath(`/resources/${resource.id}`);
  return resource;
}

export async function deleteResource(id: string) {
  const { resources } = await getResources();
  const r = resources.find((x) => x.id === id);
  if (!r) return;
  await moveResourceToTrash(r);
  await logActivity({
    action: "delete",
    targetType: "resource",
    targetId: id,
    summary: `Moved resource "${r.name}" to trash`,
  });
  revalidatePath("/resources");
  revalidatePath("/trash");
}
