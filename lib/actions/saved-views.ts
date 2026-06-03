"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import {
  getSavedViewsFile,
  saveSavedViewsFile,
} from "@/lib/storage/saved-views";
import type { SavedView } from "@/lib/types";

function recordPinKey(view: Pick<SavedView, "page" | "filters">): string | null {
  const { filters } = view;
  if (view.page === "entities" && filters.entityId) {
    return `entities:${filters.entityId}`;
  }
  if (view.page === "cases" && filters.caseId) {
    return `cases:${filters.caseId}`;
  }
  if (view.page === "tools" && filters.toolId) {
    return `tools:${filters.toolId}`;
  }
  if (view.page === "groups" && filters.groupId) {
    return `groups:${filters.groupId}`;
  }
  return null;
}

export async function listSavedViews() {
  const { views } = await getSavedViewsFile();
  return views;
}

export async function saveView(input: Omit<SavedView, "id"> & { id?: string }) {
  const file = await getSavedViewsFile();
  if (input.id) {
    const idx = file.views.findIndex((v) => v.id === input.id);
    if (idx >= 0) {
      file.views[idx] = { ...file.views[idx], ...input, id: input.id };
    }
  } else {
    const pinKey = recordPinKey(input);
    if (pinKey != null) {
      let updated = false;
      for (let i = 0; i < file.views.length; i++) {
        if (recordPinKey(file.views[i]) === pinKey) {
          file.views[i] = {
            ...file.views[i],
            ...input,
            id: file.views[i].id,
          };
          updated = true;
        }
      }
      if (!updated) {
        file.views.push({ ...input, id: uuidv4() });
      }
    } else {
      file.views.push({ ...input, id: uuidv4() });
    }
  }
  await saveSavedViewsFile(file);
  revalidatePath("/");
}

export async function isEntityPinned(entityId: string): Promise<boolean> {
  const { views } = await getSavedViewsFile();
  return views.some(
    (v) =>
      v.page === "entities" &&
      v.filters.entityId === entityId &&
      v.pinned === true,
  );
}

export async function deleteSavedView(id: string) {
  const file = await getSavedViewsFile();
  await saveSavedViewsFile({
    views: file.views.filter((v) => v.id !== id),
  });
}

export async function getPinnedItems() {
  const { views } = await getSavedViewsFile();
  return views.filter((v) => v.pinned);
}
