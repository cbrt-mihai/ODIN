import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  rewireTextForSlugChange,
  slugChangeRoots,
} from "@/lib/entities/rewire-slug";
import type { Entity } from "@/lib/types";

describe("rewireTextForSlugChange", () => {
  it("rewires bare @ paths and wikilinks", () => {
    const text =
      "See @elena-vasquez.contact.email and [[elena-vasquez|@elena-vasquez.notes]]";
    const next = rewireTextForSlugChange(
      text,
      "elena-vasquez",
      "elena-v",
    );
    assert.equal(
      next,
      "See @elena-v.contact.email and [[elena-vasquez|@elena-v.notes]]",
    );
  });

  it("rewires nested dot paths", () => {
    const next = rewireTextForSlugChange(
      "Link @elena-vasquez.overview",
      "elena-vasquez",
      "elena-v",
    );
    assert.equal(next, "Link @elena-v.overview");
  });
});

describe("slugChangeRoots", () => {
  it("detects slug changes via entityRootSlug", () => {
    const before: Entity = {
      id: "1",
      type: "person",
      displayName: "Elena Vasquez",
      slug: "elena-vasquez",
      sections: [],
      gallery: [],
      attachments: [],
      events: [],
      createdAt: "",
      updatedAt: "",
    };
    const after = { ...before, slug: "elena-v" };
    assert.deepEqual(slugChangeRoots(before, after), {
      oldRoot: "elena-vasquez",
      newRoot: "elena-v",
    });
  });
});
