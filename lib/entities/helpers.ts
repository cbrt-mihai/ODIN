import { v4 as uuidv4 } from "uuid";
import { defaultProvenance } from "@/lib/proof/helpers";
import {
  defaultDateRangeValue,
  defaultDatesValue,
  defaultLocationValue,
} from "@/lib/types/dates";
import type { Field, FieldTypeId } from "@/lib/types";

export function createEmptyField(type: FieldTypeId, label: string): Field {
  const id = uuidv4();
  let data: unknown = "";
  if (type === "checklist" || type === "tags") data = [];
  if (type === "boolean") data = false;
  if (type === "number") data = 0;
  if (type === "date" || type === "datetime" || type === "dateRange") {
    data = defaultDateRangeValue();
  }
  if (type === "dates") data = defaultDatesValue();
  if (type === "location") data = defaultLocationValue();
  if (type === "entityLink") data = { entityId: "", entityType: "person" };
  if (type === "image") data = { source: "url", url: "" };
  return {
    id,
    label,
    type,
    value: { type, data },
    order: 0,
    provenance: defaultProvenance(),
  };
}
