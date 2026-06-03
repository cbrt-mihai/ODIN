import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duplicateGalleryItem } from "@/lib/media/item-ops";

describe("duplicateGalleryItem", () => {
  it("creates a new id and copy suffix", () => {
    const copy = duplicateGalleryItem(
      {
        id: "a",
        source: "upload",
        path: "uploads/e1/images/x.jpg",
        filename: "photo.jpg",
        caption: "Headshot",
        order: 0,
      },
      1,
    );
    assert.notEqual(copy.id, "a");
    assert.equal(copy.order, 1);
    assert.equal(copy.caption, "Headshot (copy)");
    assert.equal(copy.path, "uploads/e1/images/x.jpg");
  });
});
