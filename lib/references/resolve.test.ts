import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReferenceIndex } from "./path";
import { resolveInternalRef } from "./resolve";
import type { Case, Entity } from "@/lib/types";

const entity: Entity = {
  id: "ent-1",
  type: "person",
  displayName: "Elena Vasquez",
  slug: "elena-vasquez",
  aliases: [],
  tags: [],
  caseIds: [],
  groupIds: [],
  sections: [
    {
      id: "sec-1",
      title: "Contact",
      order: 0,
      fields: [
        {
          id: "fld-1",
          label: "Work email",
          type: "email",
          order: 0,
          value: { type: "email", data: "elena@example.com" },
          provenance: { confidence: "sure" },
        },
      ],
    },
  ],
  gallery: [],
  attachments: [],
  events: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const caseData: Case = {
  id: "case-1",
  title: "Operation Glass Desk",
  slug: "operation-glass-desk",
  status: "active",
  entityIds: ["ent-1"],
  events: [],
  playbookProgress: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("resolveInternalRef", () => {
  const ctx = {
    entities: [entity],
    cases: [caseData],
    index: buildReferenceIndex([entity], [caseData]),
  };

  it("resolves entity dot path", () => {
    const r = resolveInternalRef("@elena-vasquez", ctx);
    assert.equal(r?.kind, "entity");
    assert.equal(r?.href, "/entities/ent-1");
  });

  it("resolves field dot path", () => {
    const r = resolveInternalRef("@elena-vasquez.contact.work-email", ctx);
    assert.equal(r?.kind, "field");
    assert.match(r?.href ?? "", /field=fld-1/);
  });

  it("resolves case dot path", () => {
    const r = resolveInternalRef("@operation-glass-desk", ctx);
    assert.equal(r?.kind, "case");
    assert.equal(r?.href, "/cases/case-1");
  });
});
