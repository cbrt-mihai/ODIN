import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatIncomingLink,
  formatOutgoingLink,
  inferInverseRelationshipLabel,
  relationshipInverseDisplayLabel,
  type RelationshipTypeOption,
} from "./helpers";
import { invertRoleOfLabel, isSymmetricActionLabel } from "./inverse-labels";
import type { Entity, Relationship } from "@/lib/types";

const types: RelationshipTypeOption[] = [
  {
    id: "owns",
    label: "Owns",
    inverseLabel: "Owned by",
    fromTypes: ["person", "organization"],
    toTypes: ["domain"],
  },
  {
    id: "employed_by",
    label: "Employed by",
    inverseLabel: "Employs",
    fromTypes: ["person"],
    toTypes: ["organization"],
  },
  {
    id: "associated_with",
    label: "Associated with",
    inverseLabel: "Associated with",
    fromTypes: ["person", "domain"],
    toTypes: ["person", "domain"],
  },
];

const elena: Entity = {
  id: "p1",
  type: "person",
  displayName: "Elena V. Vasquez",
  slug: "elena-vasquez",
  sections: [],
  events: [],
  gallery: [],
  createdAt: "",
  updatedAt: "",
};

const domain: Entity = {
  id: "d1",
  type: "domain",
  displayName: "elena.dev",
  slug: "elena-dev",
  sections: [],
  events: [],
  gallery: [],
  createdAt: "",
  updatedAt: "",
};

const james: Entity = {
  id: "p2",
  type: "person",
  displayName: "James Chen",
  slug: "james-chen",
  sections: [],
  events: [],
  gallery: [],
  createdAt: "",
  updatedAt: "",
};

const robbedRel: Relationship = {
  id: "r-rob",
  fromEntityId: elena.id,
  toEntityId: james.id,
  fromType: "person",
  toType: "person",
  type: "robbed",
  label: "Robbed",
  createdAt: "",
  updatedAt: "",
};

const girlfriendRel: Relationship = {
  id: "r-gf",
  fromEntityId: elena.id,
  toEntityId: james.id,
  fromType: "person",
  toType: "person",
  type: "girlfriend_of",
  label: "Girlfriend of",
  createdAt: "",
  updatedAt: "",
};

const ownsRel: Relationship = {
  id: "r1",
  fromEntityId: elena.id,
  toEntityId: domain.id,
  fromType: "person",
  toType: "domain",
  type: "owns",
  createdAt: "",
  updatedAt: "",
};

describe("inferInverseRelationshipLabel", () => {
  it("maps common verbs", () => {
    assert.equal(inferInverseRelationshipLabel("Owns"), "Owned by");
    assert.equal(inferInverseRelationshipLabel("Employed by"), "Employs");
  });

  it("inverts romantic role-of phrases", () => {
    assert.equal(inferInverseRelationshipLabel("Girlfriend of"), "Boyfriend of");
    assert.equal(inferInverseRelationshipLabel("Boyfriend of"), "Girlfriend of");
    assert.equal(inferInverseRelationshipLabel("Ex-girlfriend of"), "Ex-boyfriend of");
  });

  it("keeps symmetric friend-of phrases", () => {
    assert.equal(inferInverseRelationshipLabel("Friend of"), "Friend of");
  });

  it("uses neutral fallback for unknown role-of", () => {
    assert.equal(inferInverseRelationshipLabel("Scout of"), "Related to");
  });

  it("uses passive by for harm verbs on the target page", () => {
    assert.equal(inferInverseRelationshipLabel("Killed"), "Killed by");
    assert.equal(inferInverseRelationshipLabel("Robbed"), "Robbed by");
    assert.equal(inferInverseRelationshipLabel("Beaten"), "Beaten by");
    assert.equal(inferInverseRelationshipLabel("Stabbed"), "Stabbed by");
  });

  it("keeps neutral event verbs the same on both pages", () => {
    assert.equal(inferInverseRelationshipLabel("Met"), "Met");
  });

  it("does not treat role nouns as symmetric actions", () => {
    assert.equal(isSymmetricActionLabel("Girlfriend"), false);
    assert.equal(isSymmetricActionLabel("Employed"), false);
  });

  it("infers inverse from per-link custom label even when type inverse is wrong", () => {
    const typesWithBadInverse: RelationshipTypeOption[] = [
      {
        id: "girlfriend_of",
        label: "Girlfriend of",
        inverseLabel: "Girlfriend of",
        fromTypes: ["person"],
        toTypes: ["person"],
      },
    ];
    assert.equal(
      relationshipInverseDisplayLabel("girlfriend_of", typesWithBadInverse, {
        outgoingOverride: "Girlfriend of",
      }),
      "Boyfriend of",
    );
  });

  it("infers custom label without a settings type entry", () => {
    assert.equal(
      relationshipInverseDisplayLabel("boss_of", [], {
        outgoingOverride: "Boss of",
      }),
      "Reports to",
    );
  });

  it("replaces stored Related to when a better inverse is known", () => {
    assert.equal(
      relationshipInverseDisplayLabel("attorney_of", [], {
        outgoingOverride: "Attorney of",
        inverseOverride: "Related to",
      }),
      "Represented by",
    );
  });
});

describe("invertRoleOfLabel", () => {
  it("parses role-of suffix", () => {
    assert.equal(invertRoleOfLabel("Parent of"), "Child of");
    assert.equal(invertRoleOfLabel("Child of"), "Parent of");
  });

  it("inverts family role-of phrases", () => {
    assert.equal(invertRoleOfLabel("Grandmother of"), "Grandchild of");
    assert.equal(invertRoleOfLabel("Grandchild of"), "Grandparent of");
    assert.equal(invertRoleOfLabel("Cousin of"), "Cousin of");
    assert.equal(invertRoleOfLabel("Stepmother of"), "Stepchild of");
  });

  it("inverts workplace role-of phrases", () => {
    assert.equal(invertRoleOfLabel("Boss of"), "Reports to");
    assert.equal(invertRoleOfLabel("Colleague of"), "Colleague of");
    assert.equal(invertRoleOfLabel("Secretary of"), "Assisted by");
    assert.equal(invertRoleOfLabel("Manager of"), "Reports to");
  });

  it("inverts professional representative role-of phrases", () => {
    assert.equal(invertRoleOfLabel("Attorney of"), "Represented by");
    assert.equal(invertRoleOfLabel("Lawyer of"), "Represented by");
    assert.equal(invertRoleOfLabel("Counsel of"), "Represented by");
  });
});

describe("bidirectional relationship copy", () => {
  it("shows Owns on owner page and Owned by on asset page", () => {
    assert.equal(
      formatOutgoingLink(ownsRel, domain, types),
      "Owns elena.dev",
    );
    assert.equal(
      formatIncomingLink(ownsRel, elena, types),
      "Owned by Elena V. Vasquez",
    );
  });

  it("uses configured inverse labels", () => {
    assert.equal(
      relationshipInverseDisplayLabel("employed_by", types),
      "Employs",
    );
  });

  it("shows passive phrasing on the target page for harm verbs", () => {
    assert.equal(
      formatOutgoingLink(robbedRel, james, types),
      "Robbed James Chen",
    );
    assert.equal(
      formatIncomingLink(robbedRel, elena, types),
      "Robbed by Elena V. Vasquez",
    );
  });

  it("shows Boyfriend of on partner page for Girlfriend of link", () => {
    assert.equal(
      formatOutgoingLink(girlfriendRel, james, types),
      "Girlfriend of James Chen",
    );
    assert.equal(
      formatIncomingLink(girlfriendRel, elena, types),
      "Boyfriend of Elena V. Vasquez",
    );
  });
});
