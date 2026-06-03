import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GALLERY_PREVIEW_SIZE,
  galleryPreviewLayout,
  readGalleryPreviewSize,
} from "@/lib/ui/gallery-preview-size";

describe("galleryPreviewLayout", () => {
  it("returns tighter grid for small previews", () => {
    const layout = galleryPreviewLayout("small");
    assert.match(layout.gridClass, /minmax\(6\.5rem/);
  });

  it("returns wider grid for large previews", () => {
    const layout = galleryPreviewLayout("large");
    assert.match(layout.gridClass, /minmax\(17rem/);
  });

  it("expands card toolbar for medium and large previews", () => {
    assert.equal(galleryPreviewLayout("small").toolbarExpanded, false);
    assert.equal(galleryPreviewLayout("medium").toolbarExpanded, true);
    assert.equal(galleryPreviewLayout("large").toolbarExpanded, true);
  });
});

describe("gallery preview size persistence", () => {
  it("defaults to medium when localStorage is unavailable", () => {
    assert.equal(readGalleryPreviewSize(), DEFAULT_GALLERY_PREVIEW_SIZE);
  });
});
