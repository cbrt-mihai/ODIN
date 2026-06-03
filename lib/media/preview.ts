export type MediaPreviewKind = "image" | "video" | "audio" | "pdf";

export const GALLERY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const GALLERY_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

export const GALLERY_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
]);

export const GALLERY_MEDIA_TYPES = new Set([
  ...GALLERY_IMAGE_TYPES,
  ...GALLERY_VIDEO_TYPES,
  ...GALLERY_AUDIO_TYPES,
]);

export const GALLERY_FILE_ACCEPT = "image/*,video/*,audio/*";

export const MAX_GALLERY_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_GALLERY_VIDEO_AUDIO_BYTES = 50 * 1024 * 1024;

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif",
]);

const VIDEO_EXT = new Set(["mp4", "webm", "mov", "ogv", "m4v"]);

const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"]);

export function isGalleryMediaMime(mime: string): boolean {
  const lower = mime.toLowerCase();
  if (GALLERY_MEDIA_TYPES.has(lower)) return true;
  if (lower.startsWith("image/")) return true;
  if (lower.startsWith("video/")) return true;
  if (lower.startsWith("audio/")) return true;
  return false;
}

export function galleryUploadMaxBytes(mime: string): number {
  const lower = mime.toLowerCase();
  if (
    GALLERY_VIDEO_TYPES.has(lower) ||
    GALLERY_AUDIO_TYPES.has(lower) ||
    lower.startsWith("video/") ||
    lower.startsWith("audio/")
  ) {
    return MAX_GALLERY_VIDEO_AUDIO_BYTES;
  }
  return MAX_GALLERY_IMAGE_BYTES;
}

function extensionOf(...names: (string | undefined)[]): string | undefined {
  for (const name of names) {
    if (!name) continue;
    const base = name.split("?")[0]?.split("#")[0] ?? "";
    const dot = base.lastIndexOf(".");
    if (dot >= 0) {
      return base.slice(dot + 1).toLowerCase();
    }
  }
  return undefined;
}

export function mediaPreviewKind(input: {
  mimeType?: string;
  filename?: string;
  url?: string;
  path?: string;
  /** Treat unknown uploads as images (e.g. screenshot proof kind). */
  fallbackScreenshot?: boolean;
}): MediaPreviewKind | null {
  const mime = input.mimeType?.toLowerCase();
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";

  const ext = extensionOf(input.filename, input.url, input.path);
  if (ext && IMAGE_EXT.has(ext)) return "image";
  if (ext && VIDEO_EXT.has(ext)) return "video";
  if (ext && AUDIO_EXT.has(ext)) return "audio";
  if (ext === "pdf") return "pdf";

  const url = input.url?.trim();
  if (url) {
    if (/\.(jpe?g|png|gif|webp|svg|avif)(\?|#|$)/i.test(url)) return "image";
    if (/\.(mp4|webm|mov|ogv|m4v)(\?|#|$)/i.test(url)) return "video";
    if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i.test(url)) return "audio";
    if (/\.pdf(\?|#|$)/i.test(url)) return "pdf";
  }

  if (input.fallbackScreenshot && (input.url || input.path)) return "image";

  return null;
}
