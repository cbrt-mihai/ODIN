import { buildEntityIdentityMap } from "@/lib/entities/identity";
import { slugify } from "@/lib/utils";
import type { Case, Entity, Field, Section } from "@/lib/types";
import { normalizeDotPath } from "./parse";
import type {
  CasePathEntry,
  EntityPathEntry,
  FieldPathEntry,
  PathTarget,
  ReferenceIndex,
  SectionPathEntry,
} from "./types";

export const CASE_SECTION_KEYS = [
  "description",
  "timeline",
  "playbook",
  "entities",
  "relationships",
] as const;

export type CaseSectionKey = (typeof CASE_SECTION_KEYS)[number];

const CASE_SECTION_LABELS: Record<CaseSectionKey, string> = {
  description: "Description",
  timeline: "Timeline",
  playbook: "Playbook",
  entities: "Entities",
  relationships: "Relationships",
};

function uniqueSlug(base: string, used: Set<string>): string {
  let slug = slugify(base);
  if (!slug) slug = "item";
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) n++;
  const finalSlug = `${slug}-${n}`;
  used.add(finalSlug);
  return finalSlug;
}

export function entityRootSlug(entity: Entity): string {
  return entity.slug?.trim() || slugify(entity.displayName) || entity.id.slice(0, 8);
}

export function caseRootSlug(caseData: Case): string {
  return caseData.slug?.trim() || slugify(caseData.title) || caseData.id.slice(0, 8);
}

export function buildEntityPath(
  entity: Entity,
  section?: Section,
  field?: Field,
  slugs?: { entity: string; section?: string; field?: string },
): string {
  const root = slugs?.entity ?? entityRootSlug(entity);
  if (!section) return `@${root}`;
  const sectionSlug =
    slugs?.section ?? (slugify(section.title) || section.id.slice(0, 8));
  if (!field) return `@${root}.${sectionSlug}`;
  const fieldSlug = slugs?.field ?? (slugify(field.label) || field.id.slice(0, 8));
  return `@${root}.${sectionSlug}.${fieldSlug}`;
}

export function buildCasePath(
  caseData: Case,
  sectionKey?: CaseSectionKey,
  eventTitle?: string,
  slugs?: { case: string; event?: string },
): string {
  const root = slugs?.case ?? caseRootSlug(caseData);
  if (!sectionKey) return `@${root}`;
  if (sectionKey !== "timeline" || !eventTitle) {
    return `@${root}.${sectionKey}`;
  }
  const eventSlug = slugs?.event ?? slugify(eventTitle);
  return `@${root}.timeline.${eventSlug}`;
}

export function formatAliasedWikilink(label: string, dotPath: string): string {
  const path = dotPath.startsWith("@") ? dotPath : `@${dotPath}`;
  return `[[${label}|${path}]]`;
}

/** Default wikilink for an entity — uses qualified name when homonyms exist. */
export function formatDefaultEntityWikilink(entry: {
  displayName: string;
  qualifiedName: string;
  path: string;
  isHomonym: boolean;
}): string {
  const label = entry.isHomonym ? entry.qualifiedName : entry.displayName;
  return formatAliasedWikilink(label, `@${entry.path}`);
}

function indexEntity(
  entity: Entity,
  usedRootSlugs: Set<string>,
): Omit<
  EntityPathEntry,
  "type" | "qualifiedName" | "disambiguator" | "isHomonym" | "searchText"
> {
  const root = uniqueSlug(entityRootSlug(entity), usedRootSlugs);
  const sections: SectionPathEntry[] = [];

  for (const section of [...entity.sections].sort((a, b) => a.order - b.order)) {
    const sectionSlugs = new Set<string>();
    const sectionSlug = uniqueSlug(section.title, sectionSlugs);
    const fields: FieldPathEntry[] = [];

    for (const field of [...section.fields].sort((a, b) => a.order - b.order)) {
      const fieldSlugs = new Set<string>();
      const fieldSlug = uniqueSlug(field.label, fieldSlugs);
      fields.push({
        slug: fieldSlug,
        label: field.label,
        fieldId: field.id,
        path: `${root}.${sectionSlug}.${fieldSlug}`,
      });
    }

    sections.push({
      slug: sectionSlug,
      title: section.title,
      sectionId: section.id,
      path: `${root}.${sectionSlug}`,
      fields,
    });
  }

  return {
    entityId: entity.id,
    slug: root,
    displayName: entity.displayName,
    path: root,
    sections,
  };
}

function indexCase(caseData: Case, usedRootSlugs: Set<string>): CasePathEntry {
  const root = uniqueSlug(caseRootSlug(caseData), usedRootSlugs);
  const sections = CASE_SECTION_KEYS.map((key) => ({
    key,
    label: CASE_SECTION_LABELS[key],
    path: `${root}.${key}`,
  }));

  const eventSlugs = new Set<string>();
  const timelineEvents = [...caseData.events]
    .sort((a, b) => a.order - b.order)
    .map((event) => {
      const eventSlug = uniqueSlug(event.title, eventSlugs);
      return {
        slug: eventSlug,
        title: event.title,
        eventId: event.id,
        path: `${root}.timeline.${eventSlug}`,
      };
    });

  return {
    caseId: caseData.id,
    slug: root,
    title: caseData.title,
    path: root,
    sections,
    timelineEvents,
  };
}

export function buildReferenceIndex(
  entities: Entity[],
  cases: Case[],
): ReferenceIndex {
  const usedRootSlugs = new Set<string>();
  const entitySlugToId = new Map<string, string>();
  const caseSlugToId = new Map<string, string>();
  const paths = new Map<string, PathTarget>();
  const identityMap = buildEntityIdentityMap(entities);

  const entityEntries = entities.map((entity) => {
    const entry = indexEntity(entity, usedRootSlugs);
    const identity = identityMap.get(entity.id)!;
    const enriched = {
      ...entry,
      type: entity.type,
      qualifiedName: identity.qualifiedName,
      disambiguator: identity.disambiguator,
      isHomonym: identity.isHomonym,
      searchText: identity.searchText,
    };
    entitySlugToId.set(entry.slug, entity.id);
    paths.set(entry.path, {
      kind: "entity",
      entityId: entity.id,
      label: entity.displayName,
    });

    for (const section of entry.sections) {
      paths.set(section.path, {
        kind: "section",
        entityId: entity.id,
        sectionId: section.sectionId,
        label: section.title,
      });
      for (const field of section.fields) {
        paths.set(field.path, {
          kind: "field",
          entityId: entity.id,
          sectionId: section.sectionId,
          fieldId: field.fieldId,
          label: field.label,
        });
      }
    }

    return enriched;
  });

  const caseEntries = cases.map((caseData) => {
    const entry = indexCase(caseData, usedRootSlugs);
    caseSlugToId.set(entry.slug, caseData.id);
    paths.set(entry.path, {
      kind: "case",
      caseId: caseData.id,
      label: caseData.title,
    });

    for (const section of entry.sections) {
      paths.set(section.path, {
        kind: "caseSection",
        caseId: caseData.id,
        sectionKey: section.key,
        label: section.label,
      });
    }

    for (const event of entry.timelineEvents) {
      paths.set(event.path, {
        kind: "caseTimelineEvent",
        caseId: caseData.id,
        eventId: event.eventId,
        label: event.title,
      });
    }

    return entry;
  });

  return {
    entitySlugToId,
    caseSlugToId,
    paths,
    entities: entityEntries,
    cases: caseEntries,
  };
}

export function resolvePathFromIndex(
  dotPath: string,
  index: ReferenceIndex,
): PathTarget | null {
  return index.paths.get(normalizeDotPath(dotPath)) ?? null;
}
