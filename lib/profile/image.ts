import type { GalleryImage, ProfileImage } from "@/lib/types";

export function profileImageHref(
  image: ProfileImage | undefined,
): string | null {
  if (!image) return null;
  if (image.source === "url" && image.url?.trim()) {
    return image.url.trim();
  }
  if (image.source === "upload" && image.path?.trim()) {
    return `/api/files/${image.path.replace(/^\//, "")}`;
  }
  return null;
}

export function profileImageFromGallery(img: GalleryImage): ProfileImage {
  if (img.source === "url" && img.url) {
    return { source: "url", url: img.url };
  }
  if (img.source === "upload" && img.path) {
    return {
      source: "upload",
      path: img.path,
      mimeType: img.mimeType,
      filename: img.filename,
    };
  }
  return { source: "url", url: "" };
}
