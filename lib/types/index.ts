import type { TextFlavor } from "./annotations";
import type { DateRangeValue, DateRangesValue } from "./dates";
import type { ContextEntry, NoteEntry } from "./entries";
import type { ProofItem } from "./proof";

/** Entity kind slug, e.g. person, organization, or a custom id from settings */
export type EntityType = string;

export interface EntityTypeDefinition {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  /** Hex color for graphs and badges */
  color?: string;
  /**
   * Synthesized for entities whose type was removed from settings.
   * Not persisted — recomputed from workspace data at display time.
   */
  retired?: boolean;
}

export type ConfidenceTypeId =
  | "inferred"
  | "deduced"
  | "unsure"
  | "sure"
  | "debunked"
  | string;

export type FieldTypeId =
  | "shortText"
  | "longText"
  | "richMarkdown"
  | "obsidianMarkdown"
  | "url"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "datetime"
  | "dateRange"
  | "dates"
  | "location"
  | "boolean"
  | "dropdown"
  | "checklist"
  | "tags"
  | "image"
  | "entityLink";

export type {
  DateBound,
  DateBoundKind,
  DateEntry,
  DateRangeValue,
  DateRangesValue,
  DatesValue,
  KnownMiddle,
  LocationValue,
} from "./dates";

export {
  defaultDateBound,
  defaultDateRangeValue,
  defaultDateRangesValue,
  defaultDatesValue,
  defaultLocationValue,
} from "./dates";

export type ToolKind = "external" | "internal_page";
export type ResourceKind = "external" | "internal_page";

export type TrashItemType =
  | "entity"
  | "case"
  | "group"
  | "tool"
  | "resource"
  | "playbook";
export type MarkdownFlavor = "rich" | "obsidian";

export type { EntryAnnotations, TextFlavor } from "./annotations";
export {
  TEXT_FLAVORS,
  TEXT_FLAVOR_TOGGLE,
  defaultAnnotations,
} from "./annotations";
export type { ProofItem, ProofKind } from "./proof";
export { PROOF_KINDS } from "./proof";
export type {
  ContextEntry,
  ContextEntryKind,
  NoteEntry,
  NoteEntryKind,
} from "./entries";
export {
  CONTEXT_ENTRY_KINDS,
  NOTE_ENTRY_KINDS,
} from "./entries";

/** @deprecated Migrated to {@link DateRangeValue} on load — do not write new data. */
export interface ValidityRange {
  validFrom?: string;
  validTo?: string;
  precision?: "day" | "month" | "year";
  notes?: string;
}

export interface Provenance {
  source?: string;
  sourceUrl?: string;
  collectedAt?: string;
  confidence: ConfidenceTypeId;
  /** When this source/evidence applies (known/unknown/present bounds). */
  validity?: DateRangesValue;
  notes?: string;
  notesFlavor?: TextFlavor;
  tags?: string[];
  description?: string;
  descriptionFlavor?: TextFlavor;
  /** Structured evidence supporting this item. */
  proofs?: ProofItem[];
}

export interface FieldTypeConfig {
  options?: { id: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  allowMultiple?: boolean;
}

export interface FieldValue {
  type: FieldTypeId;
  data: unknown;
  /** When this field’s value was true (non-date field types). Date types store the range in `data`. */
  validity?: DateRangesValue;
}

export interface Field {
  id: string;
  label: string;
  type: FieldTypeId;
  typeConfig?: FieldTypeConfig;
  value: FieldValue;
  order: number;
  provenance: Provenance;
  /** @deprecated Use contextEntries — migrated on load */
  description?: string;
  descriptionFlavor?: TextFlavor;
  tags?: string[];
  /** @deprecated Use noteEntries — migrated on load */
  notes?: string;
  notesFlavor?: TextFlavor;
  contextEntries?: ContextEntry[];
  noteEntries?: NoteEntry[];
  /** How to render/edit the field value when it is text-like. */
  valueFlavor?: TextFlavor;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  fields: Field[];
  provenance?: Provenance;
}

export interface GalleryFolder {
  id: string;
  name: string;
  parentId?: string;
  order: number;
  description?: string;
  descriptionFlavor?: TextFlavor;
  tags?: string[];
  notes?: string;
  notesFlavor?: TextFlavor;
}

export interface GalleryImage {
  id: string;
  source: "upload" | "url";
  path?: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  caption?: string;
  description?: string;
  descriptionFlavor?: TextFlavor;
  tags?: string[];
  notes?: string;
  notesFlavor?: TextFlavor;
  contextEntries?: ContextEntry[];
  noteEntries?: NoteEntry[];
  folderId?: string;
  sha256?: string;
  order: number;
  /** When this image depicts or applies (with per-bound certainty). */
  validity?: DateRangesValue;
  provenance?: Provenance;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  caption?: string;
  description?: string;
  descriptionFlavor?: TextFlavor;
  tags?: string[];
  notes?: string;
  notesFlavor?: TextFlavor;
  contextEntries?: ContextEntry[];
  noteEntries?: NoteEntry[];
  folderId?: string;
  order?: number;
  /** When this file depicts or applies (with per-bound certainty). */
  validity?: DateRangesValue;
  provenance?: Provenance;
  uploadedAt: string;
}

export type ProfileImage = {
  source: "upload" | "url";
  path?: string;
  url?: string;
  mimeType?: string;
  filename?: string;
};

export interface Group {
  id: string;
  title: string;
  description?: string;
  color?: string;
  profileImage?: ProfileImage;
  entityIds: string[];
  /** Cases this group is associated with (bidirectional with Case.groupIds). */
  caseIds?: string[];
  /** Other groups related to this roster or investigation thread. */
  linkedGroupIds?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  displayName: string;
  slug?: string;
  /**
   * Short label to tell apart records with the same display name (shown in parentheses).
   * Auto-suggested when homonyms exist; stored value wins over auto.
   */
  disambiguator?: string;
  aliases?: string[];
  tags?: string[];
  caseIds?: string[];
  groupIds?: string[];
  sections: Section[];
  /** Typed context blocks (overview, background, etc.) */
  contextEntries?: ContextEntry[];
  /** Typed investigation notes */
  noteEntries?: NoteEntry[];
  /** Entity-wide evidence and source metadata */
  provenance?: Provenance;
  galleryFolders?: GalleryFolder[];
  /** Folder tree for platform file attachments (same shape as gallery folders). */
  attachmentFolders?: GalleryFolder[];
  gallery: GalleryImage[];
  attachments: Attachment[];
  events: TimelineEvent[];
  profileImage?: ProfileImage;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight row for pickers and lists — avoids shipping full entity payloads. */
export type EntitySummary = Pick<
  Entity,
  | "id"
  | "type"
  | "displayName"
  | "disambiguator"
  | "slug"
  | "profileImage"
>;

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  endAt?: string;
  type?: string;
  entityIds?: string[];
  sourceUrl?: string;
  provenance?: Provenance;
  order: number;
}

export interface Case {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  profileImage?: ProfileImage;
  status: "active" | "archived" | "closed";
  entityIds: string[];
  /** Groups linked to this case (bidirectional with Group.caseIds). */
  groupIds?: string[];
  /** Other cases related to this investigation thread. */
  linkedCaseIds?: string[];
  toolIds?: string[];
  resourceIds?: string[];
  playbookIds?: string[];
  events: TimelineEvent[];
  playbookProgress: PlaybookInstance[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  fromType: EntityType;
  toType: EntityType;
  type: string;
  /** Outgoing phrase override (from → to), e.g. "Owns". */
  label?: string;
  /** Incoming phrase override (to ← from), e.g. "Owned by". */
  inverseLabel?: string;
  bidirectional?: boolean;
  /** When this link applied or was observed. */
  validity?: DateRangesValue;
  /** Confirmation level for this link. */
  confidence?: ConfidenceTypeId;
  provenance?: Provenance;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalPageContent {
  format: "markdown" | "html";
  flavor?: MarkdownFlavor;
  body: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  kind: ToolKind;
  url?: string;
  page?: InternalPageContent;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  kind: ResourceKind;
  url?: string;
  page?: InternalPageContent;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  id: string;
  status: "pending" | "triaged" | "archived";
  capturedAt: string;
  contentType: "text" | "url" | "image";
  content: string;
  notes?: string;
  suggestedEntityId?: string;
  triagedTo?: {
    entityId?: string;
    caseId?: string;
    sectionId?: string;
    fieldId?: string;
  };
}

export interface PlaybookStep {
  id: string;
  title: string;
  description?: string;
  toolId?: string;
  resourceId?: string;
  order: number;
}

export interface Playbook {
  id: string;
  title: string;
  description?: string;
  steps: PlaybookStep[];
}

export interface PlaybookInstance {
  playbookId: string;
  completedStepIds: string[];
  startedAt: string;
  updatedAt: string;
}

export interface ConfidenceTypeDefinition {
  id: ConfidenceTypeId;
  label: string;
  description?: string;
  color: string;
  order: number;
  isTerminal?: boolean;
}

export interface FieldTypeDefinition {
  id: FieldTypeId;
  label: string;
  enabled: boolean;
  defaultTypeConfig?: FieldTypeConfig;
  entityTypes?: EntityType[];
  order: number;
}

export interface SavedView {
  id: string;
  name: string;
  page: "entities" | "cases" | "groups" | "tools" | "resources" | "inbox";
  filters: Record<string, unknown>;
  sort?: string;
  pinned?: boolean;
}

export interface ActivityEntry {
  id: string;
  at: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "restore"
    | "merge"
    | "import"
    | "export"
  targetType: string;
  targetId: string;
  summary: string;
  meta?: Record<string, unknown>;
}

export interface Settings {
  theme: {
    mode: "light" | "dark" | "system";
    accent: string;
    radius: string;
    fontScale?: number;
  };
  /** Which entity kinds appear in create flows, filters, and charts */
  entityTypes: EntityTypeDefinition[];
  fieldTypes: FieldTypeDefinition[];
  confidenceTypes: ConfidenceTypeDefinition[];
  sectionTemplates: {
    id: string;
    title: string;
    entityTypes?: EntityType[];
    defaultFields: Partial<Field>[];
  }[];
  entityTemplates: {
    id: string;
    title: string;
    entityType: EntityType;
    sections: Partial<Section>[];
  }[];
  relationshipTypes: {
    id: string;
    label: string;
    /** Phrase on the target entity page, e.g. "Owned by" for type "Owns". */
    inverseLabel?: string;
    fromTypes: EntityType[];
    toTypes: EntityType[];
  }[];
  eventTypes: string[];
  categories: { tools: string[]; resources: string[] };
}

export interface RelationshipsFile {
  relationships: Relationship[];
}

export interface InboxFile {
  items: InboxItem[];
}

export interface PlaybooksFile {
  playbooks: Playbook[];
}

export interface ToolsFile {
  tools: Tool[];
}

export interface ResourcesFile {
  resources: Resource[];
}

export interface ActivityFile {
  entries: ActivityEntry[];
}

export interface SavedViewsFile {
  views: SavedView[];
}
