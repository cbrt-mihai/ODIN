import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMediaUploadFolderId } from "@/lib/media/upload-destination";

describe("resolveMediaUploadFolderId", () => {
  it("uses current folder when inside a folder", async () => {
    const id = await resolveMediaUploadFolderId(
      "folder-a",
      { mode: "root", newFolderName: "" },
      [],
      async () => {},
    );
    assert.equal(id, "folder-a");
  });

  it("creates a new folder when mode is new", async () => {
    let saved: unknown;
    const id = await resolveMediaUploadFolderId(
      undefined,
      { mode: "new", newFolderName: "Evidence" },
      [],
      async (folders) => {
        saved = folders;
      },
    );
    assert.ok(id);
    assert.equal((saved as { name: string }[])[0].name, "Evidence");
  });
});
