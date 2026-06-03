import { v4 as uuidv4 } from "uuid";
import {
  defaultDateRangesValue,
} from "@/lib/types/dates";
import {
  migrateProofItem,
  migrateProofList,
  normalizeStoredValidity,
} from "@/lib/date-range/migrate";
import type { ProofItem, ProofKind, Provenance } from "@/lib/types";

export function defaultProvenance(): Provenance {
  return { confidence: "unsure", proofs: [] };
}

export function defaultProofItem(
  partial?: Partial<ProofItem>,
): ProofItem {
  return migrateProofItem({
    id: uuidv4(),
    title: "New evidence",
    kind: "url",
    confidence: "unsure",
    order: 0,
    tags: [],
    validity: partial?.validity ?? defaultDateRangesValue(),
    ...partial,
  });
}

export function normalizeProvenance(p?: Provenance): Provenance {
  if (!p) return defaultProvenance();
  const merged = {
    ...defaultProvenance(),
    ...p,
    proofs: p.proofs ?? [],
  };
  return {
    ...merged,
    validity: normalizeStoredValidity(merged.validity),
    proofs: migrateProofList(merged.proofs),
  };
}

export function proofCount(p?: Provenance): number {
  return p?.proofs?.length ?? 0;
}

export function addProofToProvenance(
  provenance: Provenance,
  kind: ProofKind = "url",
): Provenance {
  const proofs = [...(provenance.proofs ?? [])];
  proofs.push(
    defaultProofItem({
      kind,
      order: proofs.length,
      confidence: provenance.confidence,
    }),
  );
  return { ...provenance, proofs };
}

export function updateProof(
  provenance: Provenance,
  proofId: string,
  patch: Partial<ProofItem>,
): Provenance {
  return {
    ...provenance,
    proofs: (provenance.proofs ?? []).map((p) =>
      p.id === proofId ? { ...p, ...patch } : p,
    ),
  };
}

export function removeProof(
  provenance: Provenance,
  proofId: string,
): Provenance {
  return {
    ...provenance,
    proofs: (provenance.proofs ?? [])
      .filter((p) => p.id !== proofId)
      .map((p, i) => ({ ...p, order: i })),
  };
}

export function reorderProofs(
  provenance: Provenance,
  ids: string[],
): Provenance {
  const byId = new Map((provenance.proofs ?? []).map((p) => [p.id, p]));
  const proofs = ids
    .map((id, order) => {
      const p = byId.get(id);
      return p ? { ...p, order } : null;
    })
    .filter(Boolean) as ProofItem[];
  return { ...provenance, proofs };
}
