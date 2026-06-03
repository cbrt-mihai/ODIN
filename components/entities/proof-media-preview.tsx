"use client";

import { proofItemHref, proofPreviewKind } from "@/lib/proof/file";
import { cn } from "@/lib/utils";
import { MediaPreview } from "@/components/entities/media-preview";
import type { ProofItem } from "@/lib/types";

export function ProofMediaPreview({
  proof,
  variant = "detail",
}: {
  proof: ProofItem;
  /** `detail` — expanded panel; `compact` — tighter inline preview */
  variant?: "detail" | "compact";
}) {
  const href = proofItemHref(proof);
  if (!proofPreviewKind(proof) || !href) return null;

  return (
    <div className={cn("flex justify-center", variant === "detail" && "w-full")}>
      <MediaPreview
        href={href}
        title={proof.title}
        mimeType={proof.mimeType}
        filename={proof.filename}
        url={proof.url}
        path={proof.path}
        fallbackScreenshot={proof.kind === "screenshot"}
        variant={variant}
      />
    </div>
  );
}
