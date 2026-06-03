import type { Case, Entity, EntityType } from "@/lib/types";

export type InternalRefKind =
  | "entity"
  | "case"
  | "section"
  | "field"
  | "caseSection"
  | "caseTimelineEvent"
  | "external"
  | "unknown";

export interface ResolvedRef {
  href: string;
  label: string;
  external: boolean;
  kind: InternalRefKind;
  meta?: {
    entityId?: string;
    caseId?: string;
    sectionId?: string;
    fieldId?: string;
    path?: string;
  };
}

export type PathTarget =
  | { kind: "entity"; entityId: string; label: string }
  | {
      kind: "section";
      entityId: string;
      sectionId: string;
      label: string;
    }
  | {
      kind: "field";
      entityId: string;
      sectionId: string;
      fieldId: string;
      label: string;
    }
  | { kind: "case"; caseId: string; label: string }
  | {
      kind: "caseSection";
      caseId: string;
      sectionKey: string;
      label: string;
    }
  | {
      kind: "caseTimelineEvent";
      caseId: string;
      eventId: string;
      label: string;
    };

export interface FieldPathEntry {
  slug: string;
  label: string;
  fieldId: string;
  path: string;
}

export interface SectionPathEntry {
  slug: string;
  title: string;
  sectionId: string;
  path: string;
  fields: FieldPathEntry[];
}

export interface EntityPathEntry {
  entityId: string;
  slug: string;
  displayName: string;
  path: string;
  type: EntityType;
  qualifiedName: string;
  disambiguator: string;
  isHomonym: boolean;
  searchText: string;
  sections: SectionPathEntry[];
}

export interface CasePathEntry {
  caseId: string;
  slug: string;
  title: string;
  path: string;
  sections: { key: string; label: string; path: string }[];
  timelineEvents: { slug: string; title: string; eventId: string; path: string }[];
}

export interface ReferenceIndex {
  entitySlugToId: Map<string, string>;
  caseSlugToId: Map<string, string>;
  /** Dot path without leading `@`, e.g. `elena-vasquez.contact.work-email`. */
  paths: Map<string, PathTarget>;
  entities: EntityPathEntry[];
  cases: CasePathEntry[];
}

export interface ReferenceContext {
  entities: Entity[];
  cases: Case[];
  index?: ReferenceIndex;
}

export type { Case, Entity };
