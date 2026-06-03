import { formatDateRanges } from "@/lib/date-range/format";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";
import {
  inferInverseActionLabel,
  invertRoleOfLabel,
} from "@/lib/relationships/inverse-labels";
import type {
  ConfidenceTypeDefinition,
  DateRangeValue,
  Entity,
  Relationship,
} from "@/lib/types";

export type RelationshipTypeOption = {
  id: string;
  label: string;
  inverseLabel?: string;
  fromTypes: Entity["type"][];
  toTypes: Entity["type"][];
};

export const CUSTOM_RELATIONSHIP_VALUE = "__custom__";

export function slugFromRelationshipLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || "custom_relationship";
}

function findRelationshipType(
  typeId: string,
  types: RelationshipTypeOption[],
): RelationshipTypeOption | undefined {
  return types.find((t) => t.id === typeId);
}

/** Outgoing display label for a relationship type id, with per-link override. */
export function relationshipDisplayLabel(
  typeId: string,
  types: RelationshipTypeOption[],
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  return (
    findRelationshipType(typeId, types)?.label ?? typeId.replace(/_/g, " ")
  );
}

/** Effective outgoing phrase for a link (per-link label, type label, or type id). */
export function effectiveRelationshipOutgoingLabel(
  typeId: string,
  types: RelationshipTypeOption[],
  linkLabel?: string,
): string {
  return (
    linkLabel?.trim() ||
    findRelationshipType(typeId, types)?.label ||
    typeId.replace(/_/g, " ")
  );
}

function isGenericInverseFallback(label: string): boolean {
  return label.trim().toLowerCase() === "related to";
}

/** Prefer a freshly inferred inverse when the stored value is only the generic fallback. */
function resolveInverseLabel(
  outgoing: string,
  stored?: string,
): string {
  const inferred = inferInverseRelationshipLabel(outgoing);
  if (stored?.trim()) {
    const trimmed = stored.trim();
    if (
      isGenericInverseFallback(trimmed) &&
      !isGenericInverseFallback(inferred)
    ) {
      return inferred;
    }
    return trimmed;
  }
  return inferred;
}

/** Incoming display label (viewed from the target entity). */
export function relationshipInverseDisplayLabel(
  typeId: string,
  types: RelationshipTypeOption[],
  options?: {
    outgoingOverride?: string;
    inverseOverride?: string;
  },
): string {
  const type = findRelationshipType(typeId, types);
  const outgoing = effectiveRelationshipOutgoingLabel(
    typeId,
    types,
    options?.outgoingOverride,
  );

  // Per-link custom text: infer from that text (may override stale stored inverse).
  if (options?.outgoingOverride?.trim()) {
    return resolveInverseLabel(outgoing, options.inverseOverride);
  }

  if (options?.inverseOverride?.trim()) {
    return resolveInverseLabel(outgoing, options.inverseOverride);
  }

  if (type?.inverseLabel?.trim()) {
    const stored = type.inverseLabel.trim();
    const typeLabel = type.label?.trim();
    if (typeLabel && stored.toLowerCase() === typeLabel.toLowerCase()) {
      return inferInverseRelationshipLabel(outgoing);
    }
    return resolveInverseLabel(outgoing, stored);
  }

  return inferInverseRelationshipLabel(outgoing);
}

/** Heuristic inverse when settings do not define one. */
export function inferInverseRelationshipLabel(outgoingLabel: string): string {
  const trimmed = outgoingLabel.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "associated with") return trimmed;
  if (lower === "owns") return "Owned by";
  if (lower === "owned by") return "Owns";
  if (lower === "employed by") return "Employs";
  if (lower === "employs") return "Employed by";
  if (lower === "registered to") return "Registration for";
  if (lower === "registration for") return "Registered to";

  const actionInverse = inferInverseActionLabel(trimmed);
  if (actionInverse) return actionInverse;

  if (/\s+by$/i.test(trimmed)) {
    const stem = trimmed.replace(/\s+by$/i, "").trim();
    if (stem.toLowerCase() === "employed") return "Employs";
    if (stem.toLowerCase() === "owned") return "Owns";
    return `Has ${stem.toLowerCase()} relationship with`;
  }

  const roleOfInverse = invertRoleOfLabel(trimmed);
  if (roleOfInverse) return roleOfInverse;

  if (/\s+on$/i.test(trimmed)) {
    return trimmed.replace(/\s+on$/i, " hosted by");
  }

  if (/\s+for$/i.test(trimmed)) {
    return trimmed.replace(/\s+for$/i, " has");
  }

  if (/\s+with$/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function relationshipValidity(
  rel: Relationship,
): import("@/lib/types").DateRangesValue | undefined {
  const raw = rel.validity ?? rel.provenance?.validity;
  if (!raw) return undefined;
  const migrated = migrateDateRangesValue(raw);
  if (!migrated.entries.length) return undefined;
  return migrated;
}

export function relationshipConfidence(
  rel: Relationship,
): string | undefined {
  return rel.confidence ?? rel.provenance?.confidence;
}

export function relationshipMetaParts(
  rel: Relationship,
  confidenceTypes: ConfidenceTypeDefinition[],
): { date?: string; confidenceId?: string; confidenceLabel?: string } {
  const validity = relationshipValidity(rel);
  const confidenceId = relationshipConfidence(rel);
  const date = validity ? formatDateRanges(validity) : undefined;
  const confidenceLabel = confidenceId
    ? (confidenceTypes.find((c) => c.id === confidenceId)?.label ??
      confidenceId)
    : undefined;
  return { date, confidenceId, confidenceLabel };
}

export function formatRelationshipMeta(
  rel: Relationship,
  confidenceTypes: ConfidenceTypeDefinition[],
): string {
  const { date, confidenceLabel } = relationshipMetaParts(
    rel,
    confidenceTypes,
  );
  const parts: string[] = [];
  if (date) parts.push(date);
  if (confidenceLabel) parts.push(confidenceLabel);
  return parts.join(" · ");
}

export function outgoingLinkParts(
  rel: Relationship,
  target: Entity | undefined,
  types: RelationshipTypeOption[],
): { label: string; name: string } {
  return {
    label: relationshipDisplayLabel(rel.type, types, rel.label),
    name: target?.displayName ?? "Unknown",
  };
}

export function incomingLinkParts(
  rel: Relationship,
  source: Entity | undefined,
  types: RelationshipTypeOption[],
): { label: string; name: string } {
  return {
    label: relationshipInverseDisplayLabel(rel.type, types, {
      outgoingOverride: rel.label,
      inverseOverride: rel.inverseLabel,
    }),
    name: source?.displayName ?? "Unknown",
  };
}

function formatLinkPhrase(parts: { label: string; name: string }): string {
  return `${parts.label} ${parts.name}`.replace(/\s+/g, " ").trim();
}

/** Outgoing from current entity: "Owns elena.dev", "Employed by Acme". */
export function formatOutgoingLink(
  rel: Relationship,
  target: Entity | undefined,
  types: RelationshipTypeOption[],
): string {
  return formatLinkPhrase(outgoingLinkParts(rel, target, types));
}

/** Incoming to current entity: "Owned by Elena V. Vasquez". */
export function formatIncomingLink(
  rel: Relationship,
  source: Entity | undefined,
  types: RelationshipTypeOption[],
): string {
  return formatLinkPhrase(incomingLinkParts(rel, source, types));
}

export function formatRelationshipForEntity(
  entityId: string,
  rel: Relationship,
  other: Entity | undefined,
  types: RelationshipTypeOption[],
): string {
  if (rel.fromEntityId === entityId) {
    return formatOutgoingLink(rel, other, types);
  }
  return formatIncomingLink(rel, other, types);
}

export function formatRelationshipForEntityWithMeta(
  entityId: string,
  rel: Relationship,
  other: Entity | undefined,
  types: RelationshipTypeOption[],
  confidenceTypes: ConfidenceTypeDefinition[],
): string {
  const base = formatRelationshipForEntity(entityId, rel, other, types);
  const meta = formatRelationshipMeta(rel, confidenceTypes);
  return meta ? `${base} (${meta})` : base;
}

export function filterRelationshipTypes(
  types: RelationshipTypeOption[],
  fromType: Entity["type"],
  toType?: Entity["type"],
): RelationshipTypeOption[] {
  return types.filter((t) => {
    if (!t.fromTypes.includes(fromType)) return false;
    if (toType && !t.toTypes.includes(toType)) return false;
    return true;
  });
}

export function previewRelationshipPhrase(
  typeId: string,
  customLabel: string,
  types: RelationshipTypeOption[],
  targetName?: string,
  customInverseLabel?: string,
): string {
  const label =
    typeId === CUSTOM_RELATIONSHIP_VALUE
      ? customLabel.trim() || "…"
      : relationshipDisplayLabel(typeId, types);
  const name = targetName?.trim() || "…";
  return `${label} ${name}`.replace(/\s+/g, " ").trim();
}

export function previewInverseRelationshipPhrase(
  typeId: string,
  customLabel: string,
  customInverseLabel: string,
  types: RelationshipTypeOption[],
  sourceName?: string,
): string {
  const label =
    typeId === CUSTOM_RELATIONSHIP_VALUE
      ? customInverseLabel.trim() ||
        inferInverseRelationshipLabel(customLabel.trim() || "…")
      : relationshipInverseDisplayLabel(typeId, types, {
          outgoingOverride:
            typeId === CUSTOM_RELATIONSHIP_VALUE ? customLabel : undefined,
          inverseOverride:
            typeId === CUSTOM_RELATIONSHIP_VALUE
              ? customInverseLabel
              : undefined,
        });
  const name = sourceName?.trim() || "…";
  return `${label} ${name}`.replace(/\s+/g, " ").trim();
}

/** Edge label on a graph when `viewerId` is the focal entity. */
export function relationshipEdgeLabelForViewer(
  viewerId: string,
  rel: Relationship,
  types: RelationshipTypeOption[],
): string {
  if (rel.fromEntityId === viewerId) {
    return relationshipDisplayLabel(rel.type, types, rel.label);
  }
  return relationshipInverseDisplayLabel(rel.type, types, {
    outgoingOverride: rel.label,
    inverseOverride: rel.inverseLabel,
  });
}
