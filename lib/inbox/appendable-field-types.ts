import type { FieldTypeId } from "@/lib/types";

export const APPENDABLE_INBOX_FIELD_TYPES: FieldTypeId[] = [
  "shortText",
  "longText",
  "richMarkdown",
  "obsidianMarkdown",
  "url",
  "email",
  "phone",
];

export const APPENDABLE_INBOX_FIELD_TYPE_IDS = new Set(
  APPENDABLE_INBOX_FIELD_TYPES,
);
