import { parseWikilinkInner } from "@/lib/references/parse";
import { BARE_DOT_PATH_RE } from "@/lib/references/parse";
import { entityRootSlug } from "@/lib/references/path";
import { migrateAnnotationsToLists } from "@/lib/entries/helpers";
import { migrateProofItem } from "@/lib/date-range/migrate";
import type {
  Attachment,
  Case,
  ContextEntry,
  Entity,
  Field,
  GalleryImage,
  NoteEntry,
  Provenance,
  ProofItem,
  TimelineEvent,
} from "@/lib/types";

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function rewirePathTarget(
  target: string,
  oldRoot: string,
  newRoot: string,
): string {
  const t = target.trim();
  const oldLower = oldRoot.toLowerCase();

  if (t.startsWith("@")) {
    const body = t.slice(1);
    const bodyLower = body.toLowerCase();
    if (bodyLower === oldLower) return `@${newRoot}`;
    if (bodyLower.startsWith(`${oldLower}.`)) {
      return `@${newRoot}${body.slice(oldRoot.length)}`;
    }
    return t;
  }

  const tLower = t.toLowerCase();
  if (tLower === oldLower) return newRoot;
  if (tLower.startsWith(`${oldLower}.`)) {
    return `${newRoot}${t.slice(oldRoot.length)}`;
  }
  return t;
}

/** Rewire wikilinks and @ paths when an entity root slug changes. */
export function rewireTextForSlugChange(
  text: string,
  oldRoot: string,
  newRoot: string,
): string {
  if (!text || oldRoot === newRoot) return text;

  let result = text;

  BARE_DOT_PATH_RE.lastIndex = 0;
  result = result.replace(BARE_DOT_PATH_RE, (match, prefix, path: string) => {
    const pathLower = path.toLowerCase();
    const oldLower = oldRoot.toLowerCase();
    if (pathLower === oldLower) return `${prefix}@${newRoot}`;
    if (pathLower.startsWith(`${oldLower}.`)) {
      return `${prefix}@${newRoot}${path.slice(oldRoot.length)}`;
    }
    return match;
  });

  WIKILINK_RE.lastIndex = 0;
  result = result.replace(WIKILINK_RE, (match, inner: string) => {
    const { alias, target } = parseWikilinkInner(inner);
    const rewired = rewirePathTarget(target, oldRoot, newRoot);
    if (rewired === target) return match;
    if (alias) return `[[${alias}|${rewired}]]`;
    return `[[${rewired}]]`;
  });

  return result;
}

function rewireOptionalText(
  text: string | undefined,
  oldRoot: string,
  newRoot: string,
): string | undefined {
  if (!text) return text;
  const next = rewireTextForSlugChange(text, oldRoot, newRoot);
  return next === text ? text : next;
}

function rewireEntries<T extends ContextEntry | NoteEntry>(
  entries: T[] | undefined,
  oldRoot: string,
  newRoot: string,
): T[] | undefined {
  if (!entries?.length) return entries;
  let changed = false;
  const next = entries.map((entry) => {
    const body = rewireOptionalText(entry.body, oldRoot, newRoot);
    if (body !== entry.body) {
      changed = true;
      return { ...entry, body: body! };
    }
    return entry;
  });
  return changed ? next : entries;
}

function rewireProofs(
  proofs: ProofItem[] | undefined,
  oldRoot: string,
  newRoot: string,
): ProofItem[] | undefined {
  if (!proofs?.length) return proofs;
  let changed = false;
  const next = proofs.map((proof) => {
    const migrated = migrateProofItem(proof);
    const excerpt = rewireOptionalText(migrated.excerpt, oldRoot, newRoot);
    const description = rewireOptionalText(migrated.description, oldRoot, newRoot);
    const notes = rewireOptionalText(migrated.notes, oldRoot, newRoot);
    if (
      excerpt !== migrated.excerpt ||
      description !== migrated.description ||
      notes !== migrated.notes
    ) {
      changed = true;
      return { ...migrated, excerpt, description, notes };
    }
    return proof;
  });
  return changed ? next : proofs;
}

function rewireProvenance(
  provenance: Provenance | undefined,
  oldRoot: string,
  newRoot: string,
): Provenance | undefined {
  if (!provenance) return provenance;
  const notes = rewireOptionalText(provenance.notes, oldRoot, newRoot);
  const description = rewireOptionalText(provenance.description, oldRoot, newRoot);
  const proofs = rewireProofs(provenance.proofs, oldRoot, newRoot);
  if (
    notes === provenance.notes &&
    description === provenance.description &&
    proofs === provenance.proofs
  ) {
    return provenance;
  }
  return { ...provenance, notes, description, proofs };
}

function rewireField(field: Field, oldRoot: string, newRoot: string): Field {
  let next = field;
  let changed = false;

  const textTypes = new Set([
    "shortText",
    "longText",
    "richMarkdown",
    "obsidianMarkdown",
  ]);
  if (textTypes.has(field.type) && typeof field.value.data === "string") {
    const data = rewireTextForSlugChange(field.value.data, oldRoot, newRoot);
    if (data !== field.value.data) {
      next = {
        ...next,
        value: { ...next.value, data },
      };
      changed = true;
    }
  }

  const description = rewireOptionalText(next.description, oldRoot, newRoot);
  const notes = rewireOptionalText(next.notes, oldRoot, newRoot);
  if (description !== next.description || notes !== next.notes) {
    next = { ...next, description, notes };
    changed = true;
  }

  const contextEntries = rewireEntries(next.contextEntries, oldRoot, newRoot);
  const noteEntries = rewireEntries(next.noteEntries, oldRoot, newRoot);
  if (contextEntries !== next.contextEntries || noteEntries !== next.noteEntries) {
    next = { ...next, contextEntries, noteEntries };
    changed = true;
  }

  const provenance = rewireProvenance(next.provenance, oldRoot, newRoot);
  if (provenance && provenance !== next.provenance) {
    next = { ...next, provenance };
    changed = true;
  }

  return changed ? next : field;
}

function rewireGalleryItem(
  item: GalleryImage,
  oldRoot: string,
  newRoot: string,
): GalleryImage {
  const migrated = migrateAnnotationsToLists(item);
  let next: GalleryImage = { ...item, ...migrated };
  let changed = false;

  for (const key of ["caption", "description", "notes"] as const) {
    const value = rewireOptionalText(next[key], oldRoot, newRoot);
    if (value !== next[key]) {
      next = { ...next, [key]: value };
      changed = true;
    }
  }

  const contextEntries = rewireEntries(next.contextEntries, oldRoot, newRoot);
  const noteEntries = rewireEntries(next.noteEntries, oldRoot, newRoot);
  if (contextEntries !== next.contextEntries || noteEntries !== next.noteEntries) {
    next = { ...next, contextEntries, noteEntries };
    changed = true;
  }

  const provenance = rewireProvenance(next.provenance, oldRoot, newRoot);
  if (provenance !== next.provenance) {
    next = { ...next, provenance };
    changed = true;
  }

  return changed ? next : item;
}

function rewireAttachment(
  item: Attachment,
  oldRoot: string,
  newRoot: string,
): Attachment {
  const migrated = migrateAnnotationsToLists(item);
  let next: Attachment = { ...item, ...migrated };
  let changed = false;

  for (const key of ["caption", "description", "notes"] as const) {
    const value = rewireOptionalText(next[key], oldRoot, newRoot);
    if (value !== next[key]) {
      next = { ...next, [key]: value };
      changed = true;
    }
  }

  const contextEntries = rewireEntries(next.contextEntries, oldRoot, newRoot);
  const noteEntries = rewireEntries(next.noteEntries, oldRoot, newRoot);
  if (contextEntries !== next.contextEntries || noteEntries !== next.noteEntries) {
    next = { ...next, contextEntries, noteEntries };
    changed = true;
  }

  const provenance = rewireProvenance(next.provenance, oldRoot, newRoot);
  if (provenance !== next.provenance) {
    next = { ...next, provenance };
    changed = true;
  }

  return changed ? next : item;
}

export function rewireEntityRecord(
  entity: Entity,
  oldRoot: string,
  newRoot: string,
): Entity {
  let next = entity;
  let changed = false;

  const contextEntries = rewireEntries(entity.contextEntries, oldRoot, newRoot);
  const noteEntries = rewireEntries(entity.noteEntries, oldRoot, newRoot);
  if (
    contextEntries !== entity.contextEntries ||
    noteEntries !== entity.noteEntries
  ) {
    next = { ...next, contextEntries, noteEntries };
    changed = true;
  }

  const provenance = rewireProvenance(next.provenance, oldRoot, newRoot);
  if (provenance !== next.provenance) {
    next = { ...next, provenance };
    changed = true;
  }

  const sections = next.sections.map((section) => {
    let sectionChanged = false;
    const fields = section.fields.map((field) => {
      const rewired = rewireField(field, oldRoot, newRoot);
      if (rewired !== field) sectionChanged = true;
      return rewired;
    });
    const sectionProvenance = rewireProvenance(section.provenance, oldRoot, newRoot);
    if (sectionProvenance !== section.provenance) sectionChanged = true;
    return sectionChanged
      ? { ...section, fields, provenance: sectionProvenance }
      : section;
  });
  if (sections.some((s, i) => s !== next.sections[i])) {
    next = { ...next, sections };
    changed = true;
  }

  const gallery = next.gallery.map((item) => rewireGalleryItem(item, oldRoot, newRoot));
  if (gallery.some((g, i) => g !== next.gallery[i])) {
    next = { ...next, gallery };
    changed = true;
  }

  const attachments = (next.attachments ?? []).map((item) =>
    rewireAttachment(item, oldRoot, newRoot),
  );
  if (attachments.some((a, i) => a !== (next.attachments ?? [])[i])) {
    next = { ...next, attachments };
    changed = true;
  }

  return changed ? next : entity;
}

function rewireTimelineEvent(
  event: TimelineEvent,
  oldRoot: string,
  newRoot: string,
): TimelineEvent {
  const description = rewireOptionalText(event.description, oldRoot, newRoot);
  const provenance = rewireProvenance(event.provenance, oldRoot, newRoot);
  if (description === event.description && provenance === event.provenance) {
    return event;
  }
  return { ...event, description, provenance };
}

function rewireCaseRecord(
  caseData: Case,
  oldRoot: string,
  newRoot: string,
): Case {
  let next = caseData;
  let changed = false;

  const description = rewireOptionalText(caseData.description, oldRoot, newRoot);
  if (description !== caseData.description) {
    next = { ...next, description };
    changed = true;
  }

  const events = next.events.map((event) =>
    rewireTimelineEvent(event, oldRoot, newRoot),
  );
  if (events.some((e, i) => e !== next.events[i])) {
    next = { ...next, events };
    changed = true;
  }

  return changed ? next : caseData;
}

export function rewireWorkspaceForEntitySlugChange(
  entities: Entity[],
  cases: Case[],
  oldRoot: string,
  newRoot: string,
): { entities: Entity[]; cases: Case[]; changedCount: number } {
  if (!oldRoot || !newRoot || oldRoot === newRoot) {
    return { entities, cases, changedCount: 0 };
  }

  let changedCount = 0;
  const nextEntities = entities.map((entity) => {
    const rewired = rewireEntityRecord(entity, oldRoot, newRoot);
    if (rewired !== entity) changedCount++;
    return rewired;
  });

  const nextCases = cases.map((caseData) => {
    const rewired = rewireCaseRecord(caseData, oldRoot, newRoot);
    if (rewired !== caseData) changedCount++;
    return rewired;
  });

  return { entities: nextEntities, cases: nextCases, changedCount };
}

export function slugChangeRoots(
  before: Entity,
  after: Entity,
): { oldRoot: string; newRoot: string } | null {
  const oldRoot = entityRootSlug(before);
  const newRoot = entityRootSlug(after);
  if (oldRoot === newRoot) return null;
  return { oldRoot, newRoot };
}
