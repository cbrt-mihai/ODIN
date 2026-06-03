import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMergeSelections } from "./merge-apply";
import {
  analyzeEntityMerge,
  defaultMergeSelections,
  fieldSideKey,
} from "./merge-analysis";
import type { Entity, Field, Section } from "@/lib/types";

function section(title: string, fields: Field[]): Section {
  return { id: title, title, order: 0, fields };
}

function emailField(id: string, label: string, data: string, order: number): Field {
  return {
    id,
    label,
    type: "email",
    value: { type: "email", data },
    order,
    provenance: { confidence: "sure", proofs: [] },
  };
}

function phoneField(id: string, label: string, data: string, order: number): Field {
  return {
    id,
    label,
    type: "phone",
    value: { type: "phone", data },
    order,
    provenance: { confidence: "sure", proofs: [] },
  };
}

function minimalEntity(id: string, sections: Section[]): Entity {
  return {
    id,
    type: "person",
    displayName: "Test",
    sections,
    gallery: [],
    attachments: [],
    events: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("analyzeEntityMerge field pairing", () => {
  it("pairs email/phone fields with different labels but same value", () => {
    const primary = minimalEntity("p1", [
      section("Contact", [
        emailField("e1", "Work email", "a@example.com", 0),
        phoneField("p1", "Mobile", "+1-555-0100", 1),
      ]),
    ]);
    const secondary = minimalEntity("s1", [
      section("Contact", [
        emailField("e2", "Email", "a@example.com", 0),
        phoneField("p2", "Phone", "+1-555-0100", 1),
      ]),
    ]);

    const analysis = analyzeEntityMerge(primary, secondary);
    const contact = analysis.sections.find((s) => s.title === "Contact");
    assert.equal(contact?.fields.length, 2);
    assert.equal(contact?.fields[0]?.status, "both_same");
    assert.match(contact?.fields[0]?.label ?? "", /Work email/);
    assert.match(contact?.fields[0]?.label ?? "", /Email/);
    assert.equal(contact?.fields[1]?.status, "both_same");
  });

  it("keeps both fields with renamed duplicate labels", () => {
    const primary = minimalEntity("p1", [
      section("Contact", [
        emailField("e1", "Email", "a@example.com", 0),
      ]),
    ]);
    const secondary = minimalEntity("s1", [
      section("Contact", [
        emailField("e2", "Email", "b@example.com", 0),
      ]),
    ]);

    const analysis = analyzeEntityMerge(primary, secondary);
    const selections = defaultMergeSelections(analysis);
    const row = analysis.sections[0]!.fields[0]!;
    selections.fieldChoices[row.id] = "both";
    selections.fieldLabels[fieldSideKey("secondary", "e2")] =
      "Email (duplicate)";

    const merged = applyMergeSelections(
      primary,
      secondary,
      analysis,
      selections,
    );
    const fields = merged.sections[0]!.fields;
    assert.equal(fields.length, 2);
    assert.equal(fields[0]!.label, "Email");
    assert.equal(fields[1]!.label, "Email (duplicate)");
  });
});
