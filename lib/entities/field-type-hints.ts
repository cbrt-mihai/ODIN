import type { FieldTypeId } from "@/lib/types";

/** Short helper text for the add-field type picker (describes data shape, not the field name). */
export const FIELD_TYPE_HINTS: Partial<Record<FieldTypeId, string>> = {
  shortText: "Single line — names, handles, IDs",
  longText: "Multiple lines of plain text",
  richMarkdown: "Formatted notes with links",
  obsidianMarkdown: "Obsidian-style markdown",
  url: "Web link",
  email: "Email address",
  phone: "Phone number",
  number: "Numeric value",
  date: "Calendar date",
  datetime: "Date and time",
  dateRange: "Start and end dates",
  dates: "Several related dates",
  location: "Place or coordinates",
  boolean: "Yes / no flag",
  dropdown: "Pick one option",
  checklist: "Pick multiple options",
  tags: "Comma-separated labels",
  image: "Image URL",
  entityLink: "Link to another entity",
};
