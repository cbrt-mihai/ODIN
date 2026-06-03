import { mediaPreviewKind, type MediaPreviewKind } from "@/lib/media/preview";
import type { ProofItem } from "@/lib/types";

export function proofItemHref(proof: ProofItem): string | null {
  if (proof.url?.trim()) return proof.url.trim();
  if (proof.path) return `/api/files/${proof.path}`;
  return null;
}

export function proofHasUpload(proof: ProofItem): boolean {
  return Boolean(proof.path);
}

export function proofUploadLabel(proof: ProofItem): string {
  return proof.filename ?? proof.path?.split("/").pop() ?? "Uploaded file";
}

/** Whether this proof can show an inline media preview. */
export function proofPreviewKind(proof: ProofItem): MediaPreviewKind | null {
  return mediaPreviewKind({
    mimeType: proof.mimeType,
    filename: proof.filename,
    url: proof.url,
    path: proof.path,
    fallbackScreenshot: proof.kind === "screenshot",
  });
}
