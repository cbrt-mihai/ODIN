import {
  buildEntityIdentityMap,
  resolveEntityByDisplayTarget,
} from "@/lib/entities/identity";
import type { EntityType } from "@/lib/types";
import { isDotPath, normalizeDotPath, parseWikilinkInner } from "./parse";
import { buildReferenceIndex, resolvePathFromIndex } from "./path";
import type {
  PathTarget,
  ReferenceContext,
  ReferenceIndex,
  ResolvedRef,
} from "./types";

const ENTITY_PREFIX = /^([a-z][a-z0-9_]*):([a-f0-9-]+)$/i;
const ENTITY_CANONICAL = /^entity:([a-f0-9-]+)$/i;
const CASE_CANONICAL = /^case:([a-f0-9-]+)$/i;
const FIELD_CANONICAL = /^field:([a-f0-9-]+)\/([a-f0-9-]+)$/i;

function getIndex(ctx: ReferenceContext): ReferenceIndex {
  return ctx.index ?? buildReferenceIndex(ctx.entities, ctx.cases);
}

function pathTargetToRef(
  target: PathTarget,
  dotPath: string,
  alias?: string,
): ResolvedRef {
  switch (target.kind) {
    case "entity":
      return {
        href: `/entities/${target.entityId}`,
        label: alias ?? target.label,
        external: false,
        kind: "entity",
        meta: { entityId: target.entityId, path: dotPath },
      };
    case "section":
      return {
        href: `/entities/${target.entityId}#section-${target.sectionId}`,
        label: alias ?? target.label,
        external: false,
        kind: "section",
        meta: {
          entityId: target.entityId,
          sectionId: target.sectionId,
          path: dotPath,
        },
      };
    case "field":
      return {
        href: `/entities/${target.entityId}?field=${target.fieldId}`,
        label: alias ?? target.label,
        external: false,
        kind: "field",
        meta: {
          entityId: target.entityId,
          sectionId: target.sectionId,
          fieldId: target.fieldId,
          path: dotPath,
        },
      };
    case "case":
      return {
        href: `/cases/${target.caseId}`,
        label: alias ?? target.label,
        external: false,
        kind: "case",
        meta: { caseId: target.caseId, path: dotPath },
      };
    case "caseSection":
      return {
        href: `/cases/${target.caseId}#case-${target.sectionKey}`,
        label: alias ?? target.label,
        external: false,
        kind: "caseSection",
        meta: { caseId: target.caseId, path: dotPath },
      };
    case "caseTimelineEvent":
      return {
        href: `/cases/${target.caseId}#case-event-${target.eventId}`,
        label: alias ?? target.label,
        external: false,
        kind: "caseTimelineEvent",
        meta: { caseId: target.caseId, path: dotPath },
      };
  }
}

function resolveCanonical(
  target: string,
  ctx: ReferenceContext,
  alias?: string,
): ResolvedRef | null {
  const entityMatch = target.match(ENTITY_CANONICAL);
  if (entityMatch) {
    const entity = ctx.entities.find((e) => e.id === entityMatch[1]);
    if (entity) {
      return {
        href: `/entities/${entity.id}`,
        label: alias ?? entity.displayName,
        external: false,
        kind: "entity",
        meta: { entityId: entity.id },
      };
    }
  }

  const caseMatch = target.match(CASE_CANONICAL);
  if (caseMatch) {
    const caseData = ctx.cases.find((c) => c.id === caseMatch[1]);
    if (caseData) {
      return {
        href: `/cases/${caseData.id}`,
        label: alias ?? caseData.title,
        external: false,
        kind: "case",
        meta: { caseId: caseData.id },
      };
    }
  }

  const fieldMatch = target.match(FIELD_CANONICAL);
  if (fieldMatch) {
    const entityId = fieldMatch[1];
    const fieldId = fieldMatch[2];
    const entity = ctx.entities.find((e) => e.id === entityId);
    if (entity) {
      for (const section of entity.sections) {
        const field = section.fields.find((f) => f.id === fieldId);
        if (field) {
          return {
            href: `/entities/${entity.id}?field=${field.id}`,
            label: alias ?? field.label,
            external: false,
            kind: "field",
            meta: { entityId, sectionId: section.id, fieldId: field.id },
          };
        }
      }
    }
  }

  return null;
}

function resolveLegacyEntity(
  target: string,
  ctx: ReferenceContext,
  alias?: string,
): ResolvedRef | null {
  const prefixed = target.match(ENTITY_PREFIX);
  if (prefixed) {
    const type = prefixed[1].toLowerCase() as EntityType;
    const id = prefixed[2];
    const ent = ctx.entities.find((e) => e.id === id && e.type === type);
    if (ent) {
      return {
        href: `/entities/${ent.id}`,
        label: alias ?? ent.displayName,
        external: false,
        kind: "entity",
        meta: { entityId: ent.id },
      };
    }
  }

  const byId = ctx.entities.find((e) => e.id === target);
  if (byId) {
    return {
      href: `/entities/${byId.id}`,
      label: alias ?? byId.displayName,
      external: false,
      kind: "entity",
      meta: { entityId: byId.id },
    };
  }

  const slugLower = target.toLowerCase();
  const bySlug = ctx.entities.find((e) => e.slug?.toLowerCase() === slugLower);
  if (bySlug) {
    return {
      href: `/entities/${bySlug.id}`,
      label: alias ?? bySlug.displayName,
      external: false,
      kind: "entity",
      meta: { entityId: bySlug.id },
    };
  }

  const identityMap = buildEntityIdentityMap(ctx.entities);
  const resolved = resolveEntityByDisplayTarget(
    target,
    ctx.entities,
    identityMap,
  );
  if (resolved) {
    const identity = identityMap.get(resolved.id);
    const label =
      alias ??
      identity?.qualifiedName ??
      resolved.displayName;
    return {
      href: `/entities/${resolved.id}`,
      label,
      external: false,
      kind: "entity",
      meta: { entityId: resolved.id },
    };
  }

  return null;
}

export function resolveInternalRef(
  raw: string,
  ctx: ReferenceContext,
  options: { alias?: string } = {},
): ResolvedRef | null {
  const target = raw.trim();
  if (!target) return null;

  const alias = options.alias;

  if (/^https?:\/\//i.test(target)) {
    return { href: target, label: alias ?? target, external: true, kind: "external" };
  }

  if (isDotPath(target)) {
    const index = getIndex(ctx);
    const normalized = normalizeDotPath(target);
    const pathTarget = resolvePathFromIndex(normalized, index);
    if (pathTarget) {
      return pathTargetToRef(pathTarget, `@${normalized}`, alias);
    }
    return null;
  }

  const canonical = resolveCanonical(target, ctx, alias);
  if (canonical) return canonical;

  return resolveLegacyEntity(target, ctx, alias);
}

/** Resolve wikilink inner text (handles alias|target split). */
export function resolveWikilinkInner(
  inner: string,
  ctx: ReferenceContext,
): ResolvedRef | null {
  const { alias, target } = parseWikilinkInner(inner);
  const resolved = resolveInternalRef(target, ctx, { alias });
  if (resolved && alias) {
    return { ...resolved, label: alias };
  }
  return resolved;
}
