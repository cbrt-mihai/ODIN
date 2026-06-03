import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  augmentEntityTypesWithInUse,
  enabledEntityTypes,
  mergeEntityTypeDefinitions,
  slugFromEntityTypeLabel,
} from "./entity-types";
import { parseSettingsImport } from "@/lib/settings/backup";
import { DEFAULT_SETTINGS } from "@/lib/defaults/settings";

describe("mergeEntityTypeDefinitions", () => {
  it("returns defaults when stored list is empty", () => {
    const merged = mergeEntityTypeDefinitions([]);
    assert.ok(merged.some((d) => d.id === "person"));
  });

  it("does not re-add types the user removed from settings", () => {
    const withoutOrg = DEFAULT_SETTINGS.entityTypes.filter(
      (d) => d.id !== "organization",
    );
    const merged = mergeEntityTypeDefinitions(withoutOrg);
    assert.ok(!merged.some((d) => d.id === "organization"));
  });

  it("migrates email and phone when missing from legacy stored lists", () => {
    const legacy = DEFAULT_SETTINGS.entityTypes.filter(
      (d) => d.id !== "email" && d.id !== "phone",
    );
    const merged = mergeEntityTypeDefinitions(legacy);
    assert.ok(merged.some((d) => d.id === "email"));
    assert.ok(merged.some((d) => d.id === "phone"));
  });

  it("preserves custom types from stored settings", () => {
    const stored = [
      ...DEFAULT_SETTINGS.entityTypes,
      {
        id: "ip_address",
        label: "IP address",
        enabled: true,
        order: 99,
        color: "#fff",
      },
    ];
    const merged = mergeEntityTypeDefinitions(stored);
    assert.ok(merged.some((d) => d.id === "ip_address"));
  });
});

describe("augmentEntityTypesWithInUse", () => {
  it("adds retired definitions for types not in catalog", () => {
    const catalog = DEFAULT_SETTINGS.entityTypes.filter(
      (d) => d.id !== "organization",
    );
    const augmented = augmentEntityTypesWithInUse(catalog, ["organization"]);
    const org = augmented.find((d) => d.id === "organization");
    assert.ok(org?.retired);
    assert.equal(org?.enabled, false);
  });
});

describe("slugFromEntityTypeLabel", () => {
  it("produces valid ids", () => {
    assert.equal(slugFromEntityTypeLabel("IP Address"), "ip_address");
  });
});

describe("enabledEntityTypes", () => {
  it("omits disabled types", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      entityTypes: DEFAULT_SETTINGS.entityTypes.map((d) =>
        d.id === "organization" ? { ...d, enabled: false } : d,
      ),
    };
    assert.ok(!enabledEntityTypes(settings).includes("organization"));
    assert.ok(enabledEntityTypes(settings).includes("person"));
  });
});

describe("parseSettingsImport", () => {
  it("accepts export without entityTypes and merges defaults", () => {
    const { entityTypes: _e, ...rest } = DEFAULT_SETTINGS;
    const imported = parseSettingsImport(rest);
    assert.ok(imported.entityTypes.length >= 4);
    assert.ok(enabledEntityTypes(imported).length > 0);
  });
});
