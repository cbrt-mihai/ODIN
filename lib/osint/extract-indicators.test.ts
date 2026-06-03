import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractIndicatorsFromEntities } from "./extract-indicators";
import type { Entity } from "@/lib/types";

function entity(
  id: string,
  name: string,
  sections: Entity["sections"] = [],
): Entity {
  return {
    id,
    type: "general",
    displayName: name,
    sections,
    gallery: [],
    attachments: [],
    events: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function field(
  id: string,
  label: string,
  type: Entity["sections"][0]["fields"][0]["type"],
  data: string,
) {
  return {
    id,
    label,
    type,
    order: 0,
    value: { data },
    provenance: { confidence: "sure", proofs: [] },
  };
}

function values(indicators: ReturnType<typeof extractIndicatorsFromEntities>) {
  return {
    emails: indicators.emails.map((i) => i.value),
    urls: indicators.urls.map((i) => i.value),
    phones: indicators.phones.map((i) => i.value),
    domains: indicators.domains.map((i) => i.value),
  };
}

describe("extractIndicatorsFromEntities", () => {
  it("filters filename-like domains and email local-part noise", () => {
    const e = entity("1", "Kit", [
      {
        id: "s",
        title: "Files",
        order: 0,
        fields: [
          field(
            "f1",
            "Notes",
            "richMarkdown",
            [
              "Assets: config.json, login.html, nl-brand.css, v2.zip",
              "Contact: elena.vasquez@northline.io and j.chen@proton.me",
              "Portal: [app.northline.io](https://app.northline.io).",
            ].join("\n"),
          ),
        ],
      },
    ]);

    const out = values(extractIndicatorsFromEntities([e]));
    assert.ok(out.domains.includes("northline.io"));
    assert.ok(out.domains.includes("proton.me"));
    assert.equal(out.domains.includes("config.json"), false);
    assert.equal(out.domains.includes("login.html"), false);
    assert.equal(out.domains.includes("elena.vasquez"), false);
    assert.equal(out.domains.includes("j.chen"), false);
    assert.equal(out.urls.includes("https://app.northline.io)."), false);
    assert.ok(out.urls.some((u) => u === "https://app.northline.io"));
  });

  it("keeps structured phones and drops IPs, UUIDs, and junk numbers", () => {
    const e = entity("2", "Northline", [
      {
        id: "s",
        title: "Contact",
        order: 0,
        fields: [
          field("p1", "Mobile", "phone", "+1-415-555-0142"),
          field(
            "n1",
            "Notes",
            "longText",
            [
              "A record 104.21.32.55 and passive 185.220.101.42",
              "Entity id a1111111-1111-4111-8111-000000000001",
              "Noise 000000000003 and 000000000001 118",
            ].join(" "),
          ),
        ],
      },
    ]);

    const extracted = extractIndicatorsFromEntities([e]);
    const out = values(extracted);
    assert.deepEqual(out.phones, ["+1-415-555-0142"]);
    assert.equal(out.phones.includes("104.21.32.55"), false);
    assert.equal(out.phones.includes("185.220.101.42"), false);
    assert.equal(out.phones.includes("1111111-1111-4111-8111"), false);

    const phone = extracted.phones[0];
    assert.equal(phone?.sources[0]?.displayName, "Northline");
    assert.equal(phone?.sources[0]?.entityId, "2");
  });

  it("attributes indicators to the owning entity", () => {
    const a = entity("a", "Elena", [
      {
        id: "s",
        title: "Contact",
        order: 0,
        fields: [field("e1", "Email", "email", "elena@northline.io")],
      },
    ]);
    const b = entity("b", "James", [
      {
        id: "s",
        title: "Contact",
        order: 0,
        fields: [field("p1", "Phone", "phone", "+1-503-555-0148")],
      },
    ]);

    const extracted = extractIndicatorsFromEntities([a, b]);
    const elenaEmail = extracted.emails.find((i) => i.value === "elena@northline.io");
    const jamesPhone = extracted.phones.find(
      (i) => i.value === "+1-503-555-0148",
    );

    assert.equal(elenaEmail?.sources[0]?.displayName, "Elena");
    assert.equal(jamesPhone?.sources[0]?.displayName, "James");
  });
});
