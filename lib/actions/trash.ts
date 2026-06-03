"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/storage/activity";
import {
  permanentlyDeleteFromTrash,
  restoreFromTrash,
} from "@/lib/storage/trash";
import type { TrashItemType } from "@/lib/types";

function revalidateForType(itemType: TrashItemType) {
  switch (itemType) {
    case "entity":
      revalidatePath("/entities");
      break;
    case "case":
      revalidatePath("/cases");
      break;
    case "group":
      revalidatePath("/groups");
      break;
    case "tool":
      revalidatePath("/tools");
      break;
    case "resource":
      revalidatePath("/resources");
      break;
    case "playbook":
      revalidatePath("/playbooks");
      break;
  }
  revalidatePath("/");
  revalidatePath("/trash");
}

export async function restoreTrashItem(id: string, itemType: TrashItemType) {
  await restoreFromTrash(id, itemType);
  await logActivity({
    action: "restore",
    targetType: itemType,
    targetId: id,
    summary: `Restored ${itemType} from trash`,
  });
  revalidateForType(itemType);
}

export async function purgeTrashItem(id: string, itemType: TrashItemType) {
  await permanentlyDeleteFromTrash(id, itemType);
  await logActivity({
    action: "delete",
    targetType: itemType,
    targetId: id,
    summary: `Permanently deleted ${itemType} from trash`,
  });
  revalidatePath("/trash");
}

/** @deprecated Use restoreTrashItem */
export async function restoreFromTrashAction(id: string) {
  return restoreTrashItem(id, "entity");
}

/** @deprecated Use purgeTrashItem */
export async function purgeFromTrash(id: string) {
  return purgeTrashItem(id, "entity");
}
