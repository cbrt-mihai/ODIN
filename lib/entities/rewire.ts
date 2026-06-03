import type { Entity, Field } from "@/lib/types";

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const ENTITY_PREFIX = /^([a-z][a-z0-9_]*):([a-f0-9-]+)$/i;

function rewireFieldValue(
  field: Field,
  secondaryId: string,
  primaryId: string,
  primarySlug?: string,
  secondarySlug?: string,
  secondaryName?: string,
): Field {
  if (field.type === "entityLink") {
    const data = field.value.data as { entityId?: string };
    if (data?.entityId === secondaryId) {
      return {
        ...field,
        value: {
          ...field.value,
          data: { ...data, entityId: primaryId },
        },
      };
    }
    return field;
  }

  if (
    field.type !== "richMarkdown" &&
    field.type !== "obsidianMarkdown" &&
    field.type !== "longText" &&
    field.type !== "shortText"
  ) {
    return field;
  }

  if (typeof field.value.data !== "string") return field;
  let text = field.value.data;

  text = text.replace(WIKILINK_RE, (match, inner: string) => {
    const t = inner.trim();
    const prefixed = t.match(ENTITY_PREFIX);
    if (prefixed && prefixed[2] === secondaryId) {
      return `[[${prefixed[1]}:${primaryId}]]`;
    }
    if (t === secondaryId) return `[[${primaryId}]]`;
    if (secondarySlug && t.toLowerCase() === secondarySlug.toLowerCase()) {
      return primarySlug ? `[[${primarySlug}]]` : `[[${primaryId}]]`;
    }
    if (
      secondaryName &&
      t.toLowerCase() === secondaryName.toLowerCase()
    ) {
      return primarySlug ? `[[${primarySlug}]]` : `[[${primaryId}]]`;
    }
    return match;
  });

  if (text === field.value.data) return field;
  return { ...field, value: { ...field.value, data: text } };
}

export function rewireEntitiesAfterMerge(
  entities: Entity[],
  secondaryId: string,
  primary: Entity,
  secondary: Entity,
): Entity[] {
  return entities.map((ent) => {
    if (ent.id === secondaryId) return ent;
    let changed = false;
    const sections = ent.sections.map((sec) => ({
      ...sec,
      fields: sec.fields.map((f) => {
        const next = rewireFieldValue(
          f,
          secondaryId,
          primary.id,
          primary.slug,
          secondary.slug,
          secondary.displayName,
        );
        if (next !== f) changed = true;
        return next;
      }),
    }));
    return changed ? { ...ent, sections, updatedAt: new Date().toISOString() } : ent;
  });
}
