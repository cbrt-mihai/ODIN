import type { GalleryImage } from "@/lib/types";

export function galleryItemHref(item: GalleryImage): string | null {
  if (item.source === "url" && item.url) return item.url;
  if (item.path) return `/api/files/${item.path}`;
  return null;
}
