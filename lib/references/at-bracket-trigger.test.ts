import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldOpenReferenceWizard,
  stripAtBracketReferenceTrigger,
} from "./at-bracket-trigger";

describe("at-bracket reference trigger", () => {
  it("detects @[ at cursor", () => {
    assert.equal(shouldOpenReferenceWizard("See @[", 6), true);
    assert.equal(shouldOpenReferenceWizard("See @", 5), false);
    assert.equal(shouldOpenReferenceWizard("user@domain.com", 15), false);
  });

  it("strips @[ before cursor", () => {
    assert.deepEqual(stripAtBracketReferenceTrigger("Note @[", 7), {
      nextValue: "Note ",
      nextCursor: 5,
    });
  });
});
