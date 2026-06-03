import type { ProofItem } from "@/lib/types";

export type ProofFileMeta = Pick<
  ProofItem,
  "path" | "filename" | "mimeType" | "sizeBytes" | "sha256"
>;

export async function uploadProofFile(
  entityId: string,
  file: File,
): Promise<ProofFileMeta> {
  const form = new FormData();
  form.append("kind", "proof-file");
  form.append("file", file);
  const res = await fetch(`/api/entities/${entityId}/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as {
    proofFile?: ProofFileMeta;
    error?: string;
  };
  if (!res.ok || !data.proofFile) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data.proofFile;
}

export async function deleteProofFile(entityId: string, path: string) {
  await fetch(
    `/api/entities/${entityId}/upload?proofPath=${encodeURIComponent(path)}`,
    { method: "DELETE" },
  );
}
