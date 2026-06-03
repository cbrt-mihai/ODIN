import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { sha256Buffer } from "@/lib/uploads/hash";
import {
  profileUploadDir,
  relativeProfilePath,
  type ProfileScope,
} from "@/lib/uploads/paths";
import type { ProfileImage } from "@/lib/types";

const MAX_PROFILE_BYTES = 10 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function saveProfileUpload(
  scope: ProfileScope,
  id: string,
  file: Blob,
  previous?: ProfileImage,
): Promise<ProfileImage> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }
  if (buffer.length > MAX_PROFILE_BYTES) {
    throw new Error("File too large (max 10MB)");
  }

  const origName = file instanceof File ? file.name : "upload";
  const filename = `${uuidv4()}-${safeName(origName)}`;
  const dir = profileUploadDir(scope, id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  sha256Buffer(buffer);

  if (previous?.source === "upload" && previous.path) {
    const old = path.join(process.cwd(), "data", previous.path);
    await fs.unlink(old).catch(() => {});
  }

  return {
    source: "upload",
    path: relativeProfilePath(scope, id, filename),
    filename: safeName(origName),
    mimeType: mime,
  };
}

export async function clearProfileFile(image?: ProfileImage) {
  if (image?.source === "upload" && image.path) {
    const full = path.join(process.cwd(), "data", image.path);
    await fs.unlink(full).catch(() => {});
  }
}
