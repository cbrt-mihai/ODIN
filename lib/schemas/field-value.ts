import { z } from "zod";

const fieldTypeIds = [
  "shortText",
  "longText",
  "richMarkdown",
  "obsidianMarkdown",
  "url",
  "email",
  "phone",
  "number",
  "date",
  "datetime",
  "dateRange",
  "dates",
  "location",
  "boolean",
  "dropdown",
  "checklist",
  "tags",
  "image",
  "entityLink",
] as const;

const dateBoundSchema = z.object({
  kind: z.enum(["known", "unknown", "present"]),
  value: z.string().optional(),
  precision: z.enum(["day", "month", "year"]).optional(),
  confidence: z.string().optional(),
});

const dateRangeDataSchema = z.object({
  start: dateBoundSchema,
  end: dateBoundSchema,
  knownMiddle: z
    .object({
      value: z.string(),
      precision: z.enum(["day", "month", "year"]).optional(),
      prefix: z.string().optional(),
      label: z.string().optional(),
      confidence: z.string().optional(),
    })
    .optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
});

const dateRangesDataSchema = z.object({
  entries: z.array(dateRangeDataSchema),
});

const datesDataSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      useDateTime: z.boolean().optional(),
      confidence: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

const locationDataSchema = z.object({
  label: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
  notes: z.string().optional(),
});

export const fieldTypeIdSchema = z.enum(fieldTypeIds);

export const fieldValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("shortText"), data: z.string() }),
  z.object({ type: z.literal("longText"), data: z.string() }),
  z.object({ type: z.literal("richMarkdown"), data: z.string() }),
  z.object({ type: z.literal("obsidianMarkdown"), data: z.string() }),
  z.object({ type: z.literal("url"), data: z.string() }),
  z.object({ type: z.literal("email"), data: z.string().email().or(z.literal("")) }),
  z.object({ type: z.literal("phone"), data: z.string() }),
  z.object({ type: z.literal("number"), data: z.number() }),
  z.object({ type: z.literal("date"), data: dateRangesDataSchema }),
  z.object({ type: z.literal("datetime"), data: dateRangesDataSchema }),
  z.object({ type: z.literal("dateRange"), data: dateRangesDataSchema }),
  z.object({ type: z.literal("dates"), data: datesDataSchema }),
  z.object({ type: z.literal("location"), data: locationDataSchema }),
  z.object({ type: z.literal("boolean"), data: z.boolean() }),
  z.object({ type: z.literal("dropdown"), data: z.string() }),
  z.object({ type: z.literal("checklist"), data: z.array(z.string()) }),
  z.object({ type: z.literal("tags"), data: z.array(z.string()) }),
  z.object({
    type: z.literal("image"),
    data: z.object({
      source: z.enum(["upload", "url"]),
      path: z.string().optional(),
      url: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("entityLink"),
    data: z.object({
      entityId: z.string(),
      entityType: z
        .string()
        .regex(/^[a-z][a-z0-9_]*$/, "Invalid entity type id"),
    }),
  }),
]);

export function parseFieldValue(raw: unknown) {
  return fieldValueSchema.safeParse(raw);
}
