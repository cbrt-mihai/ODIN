"use server";

import { cache } from "react";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import {
  getCases,
  getEntities,
  getEntity,
  getGroups,
  getSettings,
  saveEntity,
} from "@/lib/storage";
import { saveEntitySnapshot } from "@/lib/storage/snapshots";
import { moveEntityToTrash } from "@/lib/storage/trash";
import {
  isEntityTypeEnabled,
  isValidEntityTypeId,
} from "@/lib/entities/entity-types";
import { defaultEntityRecord } from "@/lib/entities/normalize";
import { normalizeEntity } from "@/lib/entities/normalize";
import type {
  Attachment,
  Entity,
  EntitySummary,
  EntityType,
  Field,
  GalleryImage,
  Provenance,
  Section,
} from "@/lib/types";
import type { ContextEntry, NoteEntry } from "@/lib/types/entries";
import { slugify } from "@/lib/utils";

export const listEntitySummaries = cache(async (): Promise<EntitySummary[]> => {
  const entities = await getEntities();
  return entities
    .map((e) => ({
      id: e.id,
      type: e.type,
      displayName: e.displayName,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
});

export async function listEntities() {
  const entities = await getEntities();
  return entities.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getEntityById(id: string) {
  return getEntity(id);
}

function sectionsFromTemplate(
  entityType: EntityType,
  templates: Awaited<ReturnType<typeof getSettings>>["entityTemplates"],
): Section[] {
  const tpl = templates.find((t) => t.entityType === entityType);
  if (!tpl) {
    return [
      {
        id: uuidv4(),
        title: "Overview",
        order: 0,
        fields: [],
      },
    ];
  }
  return tpl.sections.map((s, i) => ({
    id: uuidv4(),
    title: s.title ?? "Section",
    order: s.order ?? i,
    fields: [],
  }));
}

export async function createEntity(input: {
  type: EntityType;
  displayName: string;
  slug?: string;
}) {
  const settings = await getSettings();
  if (!isValidEntityTypeId(input.type)) {
    throw new Error("Invalid entity type id.");
  }
  if (!isEntityTypeEnabled(input.type, settings)) {
    throw new Error(
      `Entity type "${input.type}" is disabled in Settings. Enable it under Entity types.`,
    );
  }
  const now = new Date().toISOString();
  const entity: Entity = {
    id: uuidv4(),
    type: input.type,
    displayName: input.displayName.trim(),
    slug: input.slug?.trim() || slugify(input.displayName),
    aliases: [],
    tags: [],
    caseIds: [],
    groupIds: [],
    sections: sectionsFromTemplate(input.type, settings.entityTemplates),
    ...defaultEntityRecord(),
    gallery: [],
    attachments: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveEntity(entity);
  await logActivity({
    action: "create",
    targetType: "entity",
    targetId: entity.id,
    summary: `Created ${entity.type} "${entity.displayName}"`,
  });
  return entity;
}

export async function appendToEntityField(
  entityId: string,
  sectionId: string,
  fieldId: string,
  text: string,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const section = entity.sections.find((s) => s.id === sectionId);
  const field = section?.fields.find((f) => f.id === fieldId);
  if (!field) throw new Error("Field not found");

  const chunk = text.trim();
  if (!chunk) return entity;

  const appendable = [
    "shortText",
    "longText",
    "richMarkdown",
    "obsidianMarkdown",
    "url",
    "email",
    "phone",
  ];
  if (!appendable.includes(field.type)) {
    throw new Error(`Cannot append to field type ${field.type}`);
  }

  const prev =
    typeof field.value.data === "string" ? field.value.data : "";
  field.value.data = prev ? `${prev}\n\n---\n\n${chunk}` : chunk;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entity.id,
    summary: `Appended inbox note to "${entity.displayName}"`,
  });
  return entity;
}

async function syncEntityMembershipIds(entity: Entity): Promise<Entity> {
  const [cases, groups] = await Promise.all([getCases(), getGroups()]);
  const caseIds = new Set(entity.caseIds ?? []);
  for (const c of cases) {
    if (c.entityIds.includes(entity.id)) caseIds.add(c.id);
  }
  const groupIds = new Set(entity.groupIds ?? []);
  for (const g of groups) {
    if (g.entityIds.includes(entity.id)) groupIds.add(g.id);
  }
  return {
    ...entity,
    caseIds: [...caseIds],
    groupIds: [...groupIds],
  };
}

export async function updateEntity(entity: Entity) {
  const withMembership = await syncEntityMembershipIds(entity);
  const normalized = normalizeEntity(withMembership);
  normalized.updatedAt = new Date().toISOString();
  await saveEntity(normalized);
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: normalized.id,
    summary: `Updated "${normalized.displayName}"`,
  });
  return normalized;
}

export async function patchEntityField(
  entityId: string,
  sectionId: string,
  field: Field,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const section = entity.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error("Section not found");
  const idx = section.fields.findIndex((f) => f.id === field.id);
  if (idx < 0) throw new Error("Field not found");
  section.fields[idx] = field;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entity.id,
    summary: `Updated field "${field.label}" on "${entity.displayName}"`,
  });
  return entity;
}

export async function patchEntityInvestigationRecord(
  entityId: string,
  record: {
    provenance?: Provenance;
    contextEntries?: ContextEntry[];
    noteEntries?: NoteEntry[];
  },
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  if (record.provenance !== undefined) entity.provenance = record.provenance;
  if (record.contextEntries !== undefined) {
    entity.contextEntries = record.contextEntries;
  }
  if (record.noteEntries !== undefined) entity.noteEntries = record.noteEntries;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  await logActivity({
    action: "update",
    targetType: "entity",
    targetId: entity.id,
    summary: `Updated investigation record on "${entity.displayName}"`,
  });
  return entity;
}

export async function patchEntityGalleryItem(
  entityId: string,
  item: GalleryImage,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  const idx = entity.gallery.findIndex((g) => g.id === item.id);
  if (idx < 0) throw new Error("Gallery item not found");
  entity.gallery[idx] = item;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  return entity;
}

export async function patchEntityAttachment(
  entityId: string,
  item: Attachment,
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  entity.attachments = entity.attachments ?? [];
  const idx = entity.attachments.findIndex((a) => a.id === item.id);
  if (idx < 0) throw new Error("Attachment not found");
  entity.attachments[idx] = item;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  return entity;
}

export async function patchEntityGallery(
  entityId: string,
  gallery: GalleryImage[],
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  entity.gallery = gallery;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  return entity;
}

export async function patchEntityAttachments(
  entityId: string,
  attachments: Attachment[],
) {
  const entity = await getEntity(entityId);
  if (!entity) throw new Error("Entity not found");
  entity.attachments = attachments;
  entity.updatedAt = new Date().toISOString();
  await saveEntity(normalizeEntity(entity));
  return entity;
}

export async function deleteEntity(id: string) {
  const entity = await getEntity(id);
  if (!entity) return;
  await saveEntitySnapshot(entity, "before-delete");
  await moveEntityToTrash(id, entity.displayName);
  await logActivity({
    action: "delete",
    targetType: "entity",
    targetId: id,
    summary: `Moved "${entity.displayName}" to trash`,
  });
}
