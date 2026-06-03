import { v4 as uuidv4 } from "uuid";
import type { GalleryFolder } from "@/lib/types";

export type MediaUploadDestinationMode = "root" | "existing" | "new";

export type MediaUploadDestinationState = {
  mode: MediaUploadDestinationMode;
  existingFolderId?: string;
  newFolderName: string;
};

export const DEFAULT_UPLOAD_DESTINATION: MediaUploadDestinationState = {
  mode: "root",
  newFolderName: "",
};

/** Resolve target folder id for an upload (undefined = root). May append a new folder. */
export async function resolveMediaUploadFolderId(
  currentFolderId: string | undefined,
  destination: MediaUploadDestinationState,
  folders: GalleryFolder[],
  persistFolders: (folders: GalleryFolder[]) => Promise<void>,
): Promise<string | undefined> {
  if (currentFolderId) return currentFolderId;

  if (destination.mode === "root") return undefined;

  if (destination.mode === "existing") {
    return destination.existingFolderId || undefined;
  }

  const name = destination.newFolderName.trim() || "New folder";
  const siblings = folders.filter((f) => !f.parentId);
  const folder: GalleryFolder = {
    id: uuidv4(),
    name,
    parentId: undefined,
    order: siblings.length,
  };
  const next = [...folders, folder];
  await persistFolders(next);
  return folder.id;
}

export function folderOptionLabel(
  folder: GalleryFolder,
  folders: GalleryFolder[],
): string {
  const parts: string[] = [];
  let cur: GalleryFolder | undefined = folder;
  const byId = new Map(folders.map((f) => [f.id, f]));
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return parts.join(" / ");
}
