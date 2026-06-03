import {
  buildEntityIdentityMap,
  findHomonyms,
  formatQualifiedName,
  getEntityIdentity,
  homonymCount,
  normalizeDisplayNameKey,
} from "@/lib/entities/identity";
import type { Entity } from "@/lib/types";

export {
  buildEntityIdentityMap,
  findHomonyms,
  formatQualifiedName,
  getEntityIdentity,
  homonymCount,
  normalizeDisplayNameKey,
};
export type { EntityIdentity } from "@/lib/entities/identity";

/** @deprecated Use getEntityIdentity().searchText lines — kept for EntityDisambiguation. */
export function getEntityDisambiguationLines(
  entity: Entity,
  allEntities?: Entity[],
): string[] {
  if (!allEntities) {
    const lines: string[] = [];
    if (entity.disambiguator?.trim()) lines.push(entity.disambiguator.trim());
    if (entity.slug?.trim()) lines.push(`/${entity.slug.trim()}`);
    return lines;
  }
  const identity = getEntityIdentity(entity, allEntities);
  const lines: string[] = [];
  if (identity.isHomonym && identity.disambiguator) {
    lines.push(identity.disambiguator);
  }
  if (identity.referenceSlug) lines.push(`@${identity.referenceSlug}`);
  if ((entity.tags ?? []).length > 0) {
    lines.push(entity.tags!.slice(0, 3).join(" · "));
  }
  return lines.slice(0, 4);
}

export function normalizePersonName(name: string): string {
  return normalizeDisplayNameKey(name);
}
