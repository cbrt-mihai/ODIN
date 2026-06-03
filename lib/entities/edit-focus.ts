export type EntityEditFocus =
  | { target: "section"; sectionId: string }
  | {
      target: "field";
      sectionId: string;
      fieldId: string;
      metaTab?: "context" | "notes" | "proof";
    }
  | { target: "record"; tab?: "context" | "notes" | "proof" }
  | { target: "membership" };

export function editFocusElementId(focus: EntityEditFocus): string {
  switch (focus.target) {
    case "section":
      return `section-${focus.sectionId}`;
    case "field":
      return `field-${focus.fieldId}`;
    case "record":
      return "entity-record";
    case "membership":
      return "entity-membership";
  }
}

function paramValue(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export function parseEditFocusFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): EntityEditFocus | null {
  const field = paramValue(params, "field");
  const section = paramValue(params, "section");
  const focus = paramValue(params, "focus");
  const metaTab = paramValue(params, "metaTab");

  const validMetaTab =
    metaTab === "context" || metaTab === "notes" || metaTab === "proof"
      ? metaTab
      : undefined;

  if (field) {
    return {
      target: "field",
      sectionId: section ?? "",
      fieldId: field,
      metaTab: validMetaTab,
    };
  }

  if (section) {
    return { target: "section", sectionId: section };
  }

  if (focus === "membership") {
    return { target: "membership" };
  }

  if (focus === "record") {
    return { target: "record", tab: validMetaTab };
  }

  return null;
}
