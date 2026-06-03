import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  galleryUploadMaxBytes,
  isGalleryMediaMime,
  mediaPreviewKind,
} from "./preview";

describe("mediaPreviewKind", () => {
  it("detects mime types", () => {
    assert.equal(mediaPreviewKind({ mimeType: "image/png" }), "image");
    assert.equal(mediaPreviewKind({ mimeType: "video/mp4" }), "video");
    assert.equal(mediaPreviewKind({ mimeType: "audio/mpeg" }), "audio");
    assert.equal(mediaPreviewKind({ mimeType: "application/pdf" }), "pdf");
  });

  it("detects extensions from filename and url", () => {
    assert.equal(
      mediaPreviewKind({
        filename: "clip.MP4",
        mimeType: "application/octet-stream",
      }),
      "video",
    );
    assert.equal(
      mediaPreviewKind({ url: "https://x.test/recording.wav" }),
      "audio",
    );
  });

  it("falls back to image for screenshot proofs with a path", () => {
    assert.equal(
      mediaPreviewKind({
        path: "uploads/e1/proofs/abc.png",
        fallbackScreenshot: true,
      }),
      "image",
    );
  });
});

describe("gallery media helpers", () => {
  it("accepts gallery mime families", () => {
    assert.equal(isGalleryMediaMime("video/mp4"), true);
    assert.equal(isGalleryMediaMime("audio/wav"), true);
    assert.equal(isGalleryMediaMime("application/zip"), false);
  });

  it("uses higher size limit for video and audio", () => {
    assert.ok(
      galleryUploadMaxBytes("video/mp4") >
        galleryUploadMaxBytes("image/png"),
    );
    assert.ok(
      galleryUploadMaxBytes("audio/mpeg") >
        galleryUploadMaxBytes("image/jpeg"),
    );
  });
});
