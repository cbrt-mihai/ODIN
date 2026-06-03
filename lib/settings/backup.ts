import { DEFAULT_SETTINGS } from "@/lib/defaults/settings";
import {
  isValidEntityTypeId,
  mergeEntityTypeDefinitions,
} from "@/lib/entities/entity-types";
import type { Settings } from "@/lib/types";

const SETTINGS_EXPORT_VERSION = 1;

export type SettingsExportFile = Settings & {
  exportVersion?: number;
  exportedAt?: string;
};

export function buildSettingsExport(settings: Settings): SettingsExportFile {
  return {
    ...settings,
    exportVersion: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
  };
}

export function settingsExportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `blacklist-settings-${stamp}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTheme(
  value: unknown,
): value is Settings["theme"] & { fontScale?: number } {
  if (!isRecord(value)) return false;
  const mode = value.mode;
  return (
    (mode === "light" || mode === "dark" || mode === "system") &&
    typeof value.accent === "string" &&
    typeof value.radius === "string"
  );
}

/** Parse and validate a settings JSON file for import. */
export function parseSettingsImport(raw: unknown): Settings {
  if (!isRecord(raw)) {
    throw new Error("Settings file must be a JSON object.");
  }

  if (!isTheme(raw.theme)) {
    throw new Error("Invalid or missing theme block.");
  }
  const theme = raw.theme;

  if (!Array.isArray(raw.fieldTypes) || raw.fieldTypes.length === 0) {
    throw new Error("Invalid or missing fieldTypes array.");
  }

  if (!Array.isArray(raw.confidenceTypes) || raw.confidenceTypes.length === 0) {
    throw new Error("Invalid or missing confidenceTypes array.");
  }

  const rawEntityTypes = Array.isArray(raw.entityTypes)
    ? (raw.entityTypes as Settings["entityTypes"]).filter((d) =>
        isValidEntityTypeId(d.id),
      )
    : undefined;
  const entityTypes = mergeEntityTypeDefinitions(rawEntityTypes);

  const relationshipTypes = Array.isArray(raw.relationshipTypes)
    ? raw.relationshipTypes
    : DEFAULT_SETTINGS.relationshipTypes;

  const eventTypes = Array.isArray(raw.eventTypes)
    ? raw.eventTypes.filter((x): x is string => typeof x === "string")
    : DEFAULT_SETTINGS.eventTypes;

  const entityTemplates = Array.isArray(raw.entityTemplates)
    ? raw.entityTemplates
    : DEFAULT_SETTINGS.entityTemplates;

  const sectionTemplates = Array.isArray(raw.sectionTemplates)
    ? raw.sectionTemplates
    : DEFAULT_SETTINGS.sectionTemplates;

  const categories = isRecord(raw.categories)
    ? {
        tools: Array.isArray(raw.categories.tools)
          ? raw.categories.tools.filter((x): x is string => typeof x === "string")
          : [],
        resources: Array.isArray(raw.categories.resources)
          ? raw.categories.resources.filter(
              (x): x is string => typeof x === "string",
            )
          : [],
      }
    : DEFAULT_SETTINGS.categories;

  return {
    theme: {
      mode: theme.mode,
      accent: theme.accent,
      radius: theme.radius,
      fontScale:
        typeof theme.fontScale === "number" ? theme.fontScale : undefined,
    },
    entityTypes,
    fieldTypes: raw.fieldTypes as Settings["fieldTypes"],
    confidenceTypes: raw.confidenceTypes as Settings["confidenceTypes"],
    sectionTemplates: sectionTemplates as Settings["sectionTemplates"],
    entityTemplates: entityTemplates as Settings["entityTemplates"],
    relationshipTypes: relationshipTypes as Settings["relationshipTypes"],
    eventTypes,
    categories,
  };
}
