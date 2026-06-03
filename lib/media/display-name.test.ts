import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultMediaDisplayName,
  mediaDisplayName,
} from "@/lib/media/display-name";

describe("defaultMediaDisplayName", () => {
  it("humanizes filenames", () => {
    assert.equal(
      defaultMediaDisplayName("linkedin_headshot-2024.jpg"),
      "linkedin headshot 2024",
    );
  });

  it("uses URL leaf names", () => {
    assert.equal(
      defaultMediaDisplayName("https://cdn.example.com/photo.png?v=1"),
      "photo",
    );
  });
});

describe("mediaDisplayName", () => {
  it("prefers caption over filename", () => {
    assert.equal(
      mediaDisplayName({
        caption: "Conference photo",
        filename: "img.jpg",
      }),
      "Conference photo",
    );
  });
});
