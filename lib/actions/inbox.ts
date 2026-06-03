"use server";

import { v4 as uuidv4 } from "uuid";
import {
  appendToEntityField,
  createEntity,
} from "@/lib/actions/entities";
import { createEmptyField } from "@/lib/entities/helpers";
import { APPENDABLE_INBOX_FIELD_TYPES } from "@/lib/inbox/appendable-field-types";
import { saveEntity, getEntity } from "@/lib/storage";
import type { EntityType, FieldTypeId } from "@/lib/types";
import { logActivity } from "@/lib/storage/activity";
import { getInbox, saveInbox } from "@/lib/storage";
import type { InboxItem } from "@/lib/types";

export async function listInboxItems() {
  const { items } = await getInbox();
  return items.sort(
    (a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );
}

export async function addInboxItem(input: {
  contentType: InboxItem["contentType"];
  content: string;
  notes?: string;
}) {
  const { items } = await getInbox();
  const item: InboxItem = {
    id: uuidv4(),
    status: "pending",
    capturedAt: new Date().toISOString(),
    contentType: input.contentType,
    content: input.content.trim(),
    notes: input.notes,
  };
  items.unshift(item);
  await saveInbox({ items });
  return item;
}

export async function updateInboxItem(item: InboxItem) {
  const { items } = await getInbox();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx === -1) return;
  items[idx] = item;
  await saveInbox({ items });
}

export async function deleteInboxItem(id: string) {
  const { items } = await getInbox();
  await saveInbox({ items: items.filter((i) => i.id !== id) });
}

export async function triageInboxItem(
  itemId: string,
  target: {
    entityId: string;
    sectionId: string;
    fieldId?: string;
    newField?: { type: FieldTypeId; label: string };
    fieldLabel?: string;
  },
) {
  const { items } = await getInbox();
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error("Inbox item not found");

  const entity = await getEntity(target.entityId);
  if (!entity) throw new Error("Entity not found");
  const section = entity.sections.find((s) => s.id === target.sectionId);
  if (!section) throw new Error("Section not found");

  let fieldId = target.fieldId;
  if (target.newField) {
    if (!APPENDABLE_INBOX_FIELD_TYPES.includes(target.newField.type)) {
      throw new Error(`Cannot create appendable field of type ${target.newField.type}`);
    }
    const label = target.newField.label.trim();
    if (!label) throw new Error("Field label is required");
    const field = createEmptyField(target.newField.type, label);
    field.order = section.fields.length;
    section.fields.push(field);
    fieldId = field.id;
    entity.updatedAt = new Date().toISOString();
    await saveEntity(entity);
  }

  if (!fieldId) throw new Error("Field is required");

  const field = section.fields.find((f) => f.id === fieldId);
  if (!field) throw new Error("Field not found");

  const label = target.fieldLabel?.trim();
  if (label && label !== field.label) {
    field.label = label;
    entity.updatedAt = new Date().toISOString();
    await saveEntity(entity);
  }

  const body = [item.content, item.notes].filter(Boolean).join("\n\n");
  await appendToEntityField(
    target.entityId,
    target.sectionId,
    fieldId,
    body,
  );

  item.status = "triaged";
  item.triagedTo = {
    entityId: target.entityId,
    sectionId: target.sectionId,
    fieldId,
  };
  await saveInbox({ items });
  await logActivity({
    action: "update",
    targetType: "inbox",
    targetId: itemId,
    summary: "Triaged inbox item to entity field",
  });
}

export async function triageInboxToNewEntity(
  itemId: string,
  input: { type: EntityType; displayName: string },
) {
  const { items } = await getInbox();
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error("Inbox item not found");

  const entity = await createEntity({
    type: input.type,
    displayName: input.displayName,
  });

  const body = [item.content, item.notes].filter(Boolean).join("\n\n");
  let section = entity.sections.find((s) =>
    s.fields.some((f) =>
      ["longText", "obsidianMarkdown", "richMarkdown", "shortText"].includes(
        f.type,
      ),
    ),
  );
  if (!section) {
    section = entity.sections[0] ?? {
      id: uuidv4(),
      title: "Notes",
      order: 0,
      fields: [],
    };
    if (!entity.sections.includes(section)) {
      entity.sections.push(section);
    }
  }
  let field = section.fields.find((f) =>
    ["longText", "obsidianMarkdown", "richMarkdown", "shortText"].includes(
      f.type,
    ),
  );
  if (!field) {
    field = createEmptyField("longText", "Captured notes");
    field.order = section.fields.length;
    section.fields.push(field);
    const full = await getEntity(entity.id);
    if (full) {
      full.sections = entity.sections;
      await saveEntity(full);
    }
  }

  await appendToEntityField(entity.id, section.id, field.id, body);

  item.status = "triaged";
  item.triagedTo = {
    entityId: entity.id,
    sectionId: section.id,
    fieldId: field.id,
  };
  await saveInbox({ items });
  await logActivity({
    action: "update",
    targetType: "inbox",
    targetId: itemId,
    summary: `Created entity "${entity.displayName}" from inbox`,
  });
  return entity;
}

export async function archiveInboxItem(itemId: string) {
  const { items } = await getInbox();
  const item = items.find((i) => i.id === itemId);
  if (!item) return;
  item.status = "archived";
  await saveInbox({ items });
}
