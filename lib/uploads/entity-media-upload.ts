import type { Attachment, GalleryImage } from "@/lib/types";

export type EntityMediaUploadKind = "gallery" | "attachment";

export type EntityMediaUploadResult =
  | { kind: "gallery"; item: GalleryImage }
  | { kind: "attachment"; item: Attachment };

type UploadResponse = {
  error?: string;
  gallery?: GalleryImage;
  attachment?: Attachment;
};

export async function uploadEntityMediaFile(
  entityId: string,
  kind: EntityMediaUploadKind,
  file: File,
  options?: { folderId?: string },
): Promise<EntityMediaUploadResult> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);
  if (options?.folderId) form.append("folderId", options.folderId);
  const res = await fetch(`/api/entities/${entityId}/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as UploadResponse;
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  if (kind === "gallery") {
    if (!data.gallery) throw new Error("Upload failed");
    return { kind: "gallery", item: data.gallery };
  }
  if (!data.attachment) throw new Error("Upload failed");
  return { kind: "attachment", item: data.attachment };
}

export async function uploadEntityMediaFiles(
  entityId: string,
  kind: EntityMediaUploadKind,
  files: File[],
  options?: { folderId?: string },
): Promise<EntityMediaUploadResult[]> {
  const results: EntityMediaUploadResult[] = [];
  for (const file of files) {
    results.push(await uploadEntityMediaFile(entityId, kind, file, options));
  }
  return results;
}

export async function uploadGalleryUrl(
  entityId: string,
  url: string,
  options?: { folderId?: string },
): Promise<GalleryImage> {
  const form = new FormData();
  form.append("kind", "gallery-url");
  form.append("url", url);
  if (options?.folderId) form.append("folderId", options.folderId);
  const res = await fetch(`/api/entities/${entityId}/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as UploadResponse;
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  if (!data.gallery) throw new Error("Upload failed");
  return data.gallery;
}
