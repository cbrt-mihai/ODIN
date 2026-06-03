import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getEntity, saveEntity } from "@/lib/storage";
import { sha256Buffer } from "@/lib/uploads/hash";
import {
  entityUploadDir,
  profileUploadDir,
  relativeProfilePath,
  relativeUploadPath,
} from "@/lib/uploads/paths";
import type { ProfileImage } from "@/lib/types";
import {
  galleryUploadMaxBytes,
  isGalleryMediaMime,
} from "@/lib/media/preview";
import type { Attachment, GalleryImage } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PROOF_BYTES = 50 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const entity = await getEntity(id);
    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const form = await request.formData();
    const kind = form.get("kind") as string;
    const file = form.get("file");
    const url = form.get("url") as string | null;
    const caption = (form.get("caption") as string) || undefined;
    const folderId = (form.get("folderId") as string) || undefined;

    if (kind === "profile-url" && url?.trim()) {
      entity.profileImage = { source: "url", url: url.trim() };
      entity.updatedAt = new Date().toISOString();
      await saveEntity(entity);
      return NextResponse.json({ profileImage: entity.profileImage });
    }

    if (kind === "gallery-url" && url) {
      const img: GalleryImage = {
        id: uuidv4(),
        source: "url",
        url: url.trim(),
        caption,
        folderId,
        order: entity.gallery.length,
      };
      entity.gallery.push(img);
      entity.updatedAt = new Date().toISOString();
      await saveEntity(entity);
      return NextResponse.json({ gallery: img });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/octet-stream";
    const maxBytes =
      kind === "proof-file"
        ? MAX_PROOF_BYTES
        : kind === "gallery"
          ? galleryUploadMaxBytes(mime)
          : 10 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return NextResponse.json(
        {
          error: `File too large (max ${Math.round(maxBytes / (1024 * 1024))}MB)`,
        },
        { status: 400 },
      );
    }

    const hash = sha256Buffer(buffer);
    const origName = file instanceof File ? file.name : "upload";
    const filename = `${uuidv4()}-${safeName(origName)}`;

    if (kind === "profile" && mime.startsWith("image/")) {
      const dir = profileUploadDir("entity", id);
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, filename);
      await fs.writeFile(full, buffer);
      const profileImage: ProfileImage = {
        source: "upload",
        path: relativeProfilePath("entity", id, filename),
        filename: safeName(origName),
        mimeType: mime,
      };
      if (entity.profileImage?.source === "upload" && entity.profileImage.path) {
        const old = path.join(process.cwd(), "data", entity.profileImage.path);
        await fs.unlink(old).catch(() => {});
      }
      entity.profileImage = profileImage;
      entity.updatedAt = new Date().toISOString();
      await saveEntity(entity);
      return NextResponse.json({ profileImage });
    }

    if (kind === "gallery" && isGalleryMediaMime(mime)) {
      const dir = entityUploadDir(id, "images");
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, filename);
      await fs.writeFile(full, buffer);
      const img: GalleryImage = {
        id: uuidv4(),
        source: "upload",
        path: relativeUploadPath(id, "images", filename),
        filename: safeName(origName),
        mimeType: mime,
        caption,
        folderId,
        sha256: hash,
        order: entity.gallery.length,
      };
      entity.gallery.push(img);
      entity.updatedAt = new Date().toISOString();
      await saveEntity(entity);
      return NextResponse.json({ gallery: img });
    }

    if (kind === "proof-file") {
      const dir = entityUploadDir(id, "proofs");
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, filename);
      await fs.writeFile(full, buffer);
      return NextResponse.json({
        proofFile: {
          path: relativeUploadPath(id, "proofs", filename),
          filename: safeName(origName),
          mimeType: mime,
          sizeBytes: buffer.length,
          sha256: hash,
        },
      });
    }

    if (kind === "attachment") {
      const dir = entityUploadDir(id, "attachments");
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, filename);
      await fs.writeFile(full, buffer);
      const att: Attachment = {
        id: uuidv4(),
        filename: safeName(origName),
        mimeType: mime,
        path: relativeUploadPath(id, "attachments", filename),
        sha256: hash,
        sizeBytes: buffer.length,
        caption,
        order: (entity.attachments ?? []).length,
        uploadedAt: new Date().toISOString(),
      };
      entity.attachments = entity.attachments ?? [];
      entity.attachments.push(att);
      entity.updatedAt = new Date().toISOString();
      await saveEntity(entity);
      return NextResponse.json({ attachment: att });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entity = await getEntity(id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let bodyKind: string | undefined;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object" && "kind" in body) {
      bodyKind = String((body as { kind: string }).kind);
    }
  } catch {
    /* GET-style DELETE uses query only */
  }

  const { searchParams } = new URL(request.url);
  const galleryId = searchParams.get("galleryId");
  const attachmentId = searchParams.get("attachmentId");
  const proofPath = searchParams.get("proofPath");

  if (galleryId) {
    const item = entity.gallery.find((g) => g.id === galleryId);
    entity.gallery = entity.gallery.filter((g) => g.id !== galleryId);
    if (item?.source === "upload" && item.path) {
      const full = path.join(process.cwd(), "data", item.path);
      await fs.unlink(full).catch(() => {});
    }
  }

  if (attachmentId) {
    const item = (entity.attachments ?? []).find((a) => a.id === attachmentId);
    entity.attachments = (entity.attachments ?? []).filter(
      (a) => a.id !== attachmentId,
    );
    if (item?.path) {
      const full = path.join(process.cwd(), "data", item.path);
      await fs.unlink(full).catch(() => {});
    }
  }

  if (bodyKind === "profile" || searchParams.get("kind") === "profile") {
    if (entity.profileImage?.source === "upload" && entity.profileImage.path) {
      const full = path.join(process.cwd(), "data", entity.profileImage.path);
      await fs.unlink(full).catch(() => {});
    }
    entity.profileImage = undefined;
    entity.updatedAt = new Date().toISOString();
    await saveEntity(entity);
    return NextResponse.json({ ok: true });
  }

  if (proofPath) {
    const safe = proofPath.replace(/\\/g, "/");
    if (safe.startsWith(`uploads/${id}/proofs/`) && !safe.includes("..")) {
      const full = path.join(process.cwd(), "data", safe);
      await fs.unlink(full).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  entity.updatedAt = new Date().toISOString();
  await saveEntity(entity);
  return NextResponse.json({ ok: true });
}
