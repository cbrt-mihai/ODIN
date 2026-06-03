export type GalleryPreviewSize = "small" | "medium" | "large";

const STORAGE_KEY = "theblacklist:gallery-preview-size";

export const GALLERY_PREVIEW_SIZE_OPTIONS: {
  value: GalleryPreviewSize;
  label: string;
}[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export const DEFAULT_GALLERY_PREVIEW_SIZE: GalleryPreviewSize = "medium";

export function readGalleryPreviewSize(): GalleryPreviewSize {
  if (typeof window === "undefined") return DEFAULT_GALLERY_PREVIEW_SIZE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "small" || raw === "medium" || raw === "large") return raw;
  } catch {
    // ignore
  }
  return DEFAULT_GALLERY_PREVIEW_SIZE;
}

export function writeGalleryPreviewSize(size: GalleryPreviewSize) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // ignore
  }
}

export function galleryPreviewLayout(size: GalleryPreviewSize) {
  switch (size) {
    case "small":
      return {
        gridClass:
          "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(6.5rem,1fr))]",
        cardMetaClass: "space-y-0.5 p-1.5",
        titleClass: "truncate text-[10px] font-medium text-zinc-300",
        tagsClass: "truncate text-[9px] text-zinc-500",
        detailsClass: "text-[9px] text-blue-400 hover:underline",
        toolbarExpanded: false,
      };
    case "large":
      return {
        gridClass:
          "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))]",
        cardMetaClass: "space-y-1.5 p-3",
        titleClass: "truncate text-sm font-medium text-zinc-200",
        tagsClass: "truncate text-xs text-zinc-500",
        detailsClass: "text-xs text-blue-400 hover:underline",
        toolbarExpanded: true,
      };
    default:
      return {
        gridClass:
          "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))]",
        cardMetaClass: "space-y-1 p-2",
        titleClass: "truncate text-xs font-medium text-zinc-300",
        tagsClass: "truncate text-[10px] text-zinc-500",
        detailsClass: "text-[10px] text-blue-400 hover:underline",
        toolbarExpanded: true,
      };
  }
}
