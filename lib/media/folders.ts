import type { GalleryFolder } from "@/lib/types";

export function buildFolderPath(
  folders: GalleryFolder[],
  folderId: string | undefined,
): GalleryFolder[] {
  if (!folderId) return [];
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: GalleryFolder[] = [];
  let cur = byId.get(folderId);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}
