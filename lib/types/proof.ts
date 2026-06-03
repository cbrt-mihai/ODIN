import type { ConfidenceTypeId } from "@/lib/types";
import type { DateRangesValue } from "./dates";
import type { EntryAnnotations, TextFlavor } from "./annotations";

export type ProofKind =
  | "url"
  | "document"
  | "screenshot"
  | "witness"
  | "observation"
  | "analysis"
  | "other";

export interface ProofItem extends EntryAnnotations {
  id: string;
  title: string;
  kind: ProofKind;
  /** External link when source is url. */
  url?: string;
  /** Stored file under data/uploads/{entityId}/proofs/ */
  path?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  excerpt?: string;
  excerptFlavor?: TextFlavor;
  /** When this evidence was collected. */
  collectedAt?: string;
  /** When the fact this evidence supports was true (known/unknown/present bounds). */
  validity?: DateRangesValue;
  confidence: ConfidenceTypeId;
  order: number;
}

export const PROOF_KINDS: { id: ProofKind; label: string }[] = [
  { id: "url", label: "Link / URL" },
  { id: "document", label: "Document" },
  { id: "screenshot", label: "Screenshot" },
  { id: "witness", label: "Witness / statement" },
  { id: "observation", label: "Direct observation" },
  { id: "analysis", label: "Analysis" },
  { id: "other", label: "Other" },
];
