import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  scopeEntityEgoGraph,
  scopeMembershipGraph,
  scopeWorkspaceGraph,
} from "./graph-scope";
import type { Relationship } from "@/lib/types";

function rel(
  id: string,
  from: string,
  to: string,
  type = "associated_with",
): Relationship {
  return {
    id,
    fromEntityId: from,
    toEntityId: to,
    fromType: "person",
    toType: "person",
    type,
    createdAt: "",
    updatedAt: "",
  };
}

describe("scopeEntityEgoGraph", () => {
  it("includes only center neighborhood", () => {
    const relationships = [
      rel("r1", "a", "b"),
      rel("r2", "b", "c"),
      rel("r3", "x", "y"),
    ];
    const scoped = scopeEntityEgoGraph("a", relationships);
    assert.deepEqual(scoped.entityIds.sort(), ["a", "b"]);
    assert.equal(scoped.relationships.length, 1);
    assert.equal(scoped.relationships[0]?.id, "r1");
  });

  it("includes links between neighbors", () => {
    const relationships = [
      rel("r1", "a", "b"),
      rel("r2", "b", "c"),
      rel("r3", "a", "c"),
    ];
    const scoped = scopeEntityEgoGraph("a", relationships);
    assert.equal(scoped.entityIds.length, 3);
    assert.equal(scoped.relationships.length, 3);
  });
});

describe("scopeMembershipGraph", () => {
  it("keeps only intra-member edges", () => {
    const scoped = scopeMembershipGraph(
      ["a", "b"],
      [rel("r1", "a", "b"), rel("r2", "b", "c")],
    );
    assert.equal(scoped.relationships.length, 1);
    assert.equal(scoped.relationships[0]?.id, "r1");
  });
});

describe("scopeWorkspaceGraph", () => {
  it("returns all relationships between known entities", () => {
    const scoped = scopeWorkspaceGraph(
      ["a", "b", "c"],
      [rel("r1", "a", "b"), rel("r2", "b", "c"), rel("r3", "a", "x")],
    );
    assert.equal(scoped.relationships.length, 2);
  });
});
