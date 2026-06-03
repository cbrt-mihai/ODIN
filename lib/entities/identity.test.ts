import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEntityIdentityMap,
  formatQualifiedName,
  parseQualifiedDisplayName,
  resolveEntityByDisplayTarget,
} from "./identity";
import type { Entity } from "@/lib/types";

function person(
  id: string,
  name: string,
  extra?: Partial<Entity>,
): Entity {
  return {
    id,
    type: "person",
    displayName: name,
    sections: extra?.sections ?? [],
    gallery: [],
    attachments: [],
    events: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("entity identity", () => {
  it("assigns unique qualified names for homonyms", () => {
    const a = person("1", "Marcus Reed", {
      slug: "marcus-reed-portland",
      sections: [
        {
          id: "s",
          title: "Contact",
          order: 0,
          fields: [
            {
              id: "e",
              label: "Email",
              type: "email",
              order: 0,
              value: { type: "email", data: "marc.reed@example.com" },
              provenance: { confidence: "sure", proofs: [] },
            },
          ],
        },
      ],
    });
    const b = person("2", "Marcus Reed", {
      slug: "marcus-reed-austin",
      sections: [
        {
          id: "s",
          title: "Contact",
          order: 0,
          fields: [
            {
              id: "e",
              label: "Email",
              type: "email",
              order: 0,
              value: { type: "email", data: "m.reed@acme.corp" },
              provenance: { confidence: "sure", proofs: [] },
            },
          ],
        },
      ],
    });

    const map = buildEntityIdentityMap([a, b]);
    assert.equal(map.get("1")!.isHomonym, true);
    assert.equal(map.get("2")!.isHomonym, true);
    assert.equal(map.get("1")!.disambiguator, "marcus-reed-portland");
    assert.equal(map.get("2")!.disambiguator, "marcus-reed-austin");
    assert.notEqual(
      map.get("1")!.qualifiedName,
      map.get("2")!.qualifiedName,
    );
  });

  it("prefers slug over email for auto disambiguator", () => {
    const a = person("1", "Marcus Reed", {
      slug: "marcus-reed-portland",
      sections: [
        {
          id: "s",
          title: "Contact",
          order: 0,
          fields: [
            {
              id: "e",
              label: "Email",
              type: "email",
              order: 0,
              value: { type: "email", data: "marc.reed@example.com" },
              provenance: { confidence: "sure", proofs: [] },
            },
          ],
        },
      ],
    });
    const b = person("2", "Marcus Reed", {
      slug: "marcus-reed-austin",
    });
    const map = buildEntityIdentityMap([a, b]);
    assert.equal(map.get("1")!.disambiguator, "marcus-reed-portland");
    assert.equal(map.get("2")!.disambiguator, "marcus-reed-austin");
  });

  it("resolves qualified display targets", () => {
    const a = person("1", "Marcus Reed", {
      disambiguator: "marc.reed@example.com",
    });
    const b = person("2", "Marcus Reed", {
      disambiguator: "m.reed@acme.corp",
    });
    const map = buildEntityIdentityMap([a, b]);
    const parsed = parseQualifiedDisplayName(
      "Marcus Reed (marc.reed@example.com)",
    );
    assert.ok(parsed);
    const resolved = resolveEntityByDisplayTarget(
      "Marcus Reed (marc.reed@example.com)",
      [a, b],
      map,
    );
    assert.equal(resolved?.id, "1");
  });

  it("formatQualifiedName omits parens when not homonym", () => {
    assert.equal(formatQualifiedName("Elena", "x", false), "Elena");
    assert.equal(
      formatQualifiedName("Elena", "crm", true),
      "Elena (crm)",
    );
  });
});
