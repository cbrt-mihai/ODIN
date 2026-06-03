import { v4 as uuidv4 } from "uuid";
import { galleryItemHref } from "@/lib/media/gallery";
import { mediaDisplayName } from "@/lib/media/display-name";
import type { Attachment, GalleryImage } from "@/lib/types";

export function mediaItemCopyUrl(
  item: GalleryImage | Attachment,
): string | null {
  if ("source" in item) return galleryItemHref(item);
  if (item.path) return `/api/files/${item.path}`;
  return null;
}

export function toAbsoluteMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).href;
}

export function duplicateGalleryItem(
  item: GalleryImage,
  order: number,
): GalleryImage {
  return {
    ...item,
    id: uuidv4(),
    order,
    caption: `${mediaDisplayName(item)} (copy)`,
    contextEntries: item.contextEntries?.map((e) => ({ ...e, id: uuidv4() })),
    noteEntries: item.noteEntries?.map((e) => ({ ...e, id: uuidv4() })),
    provenance: item.provenance
      ? {
          ...item.provenance,
          proofs: item.provenance.proofs?.map((p) => ({ ...p, id: uuidv4() })),
        }
      : undefined,
  };
}

export function duplicateAttachment(item: Attachment, order: number): Attachment {
  return {
    ...item,
    id: uuidv4(),
    order,
    caption: `${mediaDisplayName(item)} (copy)`,
    uploadedAt: new Date().toISOString(),
    contextEntries: item.contextEntries?.map((e) => ({ ...e, id: uuidv4() })),
    noteEntries: item.noteEntries?.map((e) => ({ ...e, id: uuidv4() })),
    provenance: item.provenance
      ? {
          ...item.provenance,
          proofs: item.provenance.proofs?.map((p) => ({ ...p, id: uuidv4() })),
        }
      : undefined,
  };
}
