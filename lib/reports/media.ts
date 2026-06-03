import fs from "fs/promises";
import path from "path";
import { buildFolderPath } from "@/lib/media/folders";
import { mediaDisplayName } from "@/lib/media/display-name";
import { mediaPreviewKind } from "@/lib/media/preview";
import { resolveUploadPath } from "@/lib/uploads/paths";
import type { Attachment, Entity, GalleryFolder, GalleryImage, ProfileImage } from "@/lib/types";

export type ReportMediaMode = "embed" | "relative";

export interface ReportMediaContext {
  mode: ReportMediaMode;
  /** Root folder for relative paths inside a zip report, e.g. "media". */
  mediaRoot?: string;
}

const PDF_IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png"]);

export function safeReportPathSegment(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

export function entityReportDir(entity: Entity): string {
  return safeReportPathSegment(
    entity.displayName,
    `entity-${entity.id.slice(0, 8)}`,
  );
}

export function recordReportDir(label: string, id: string): string {
  return safeReportPathSegment(label, `record-${id.slice(0, 8)}`);
}

export function buildFolderRelSegments(
  folders: GalleryFolder[],
  folderId: string | undefined,
): string[] {
  return buildFolderPath(folders, folderId).map((f) =>
    safeReportPathSegment(f.name, f.id.slice(0, 8)),
  );
}

function leafFileName(
  item: { path?: string; filename?: string; id: string },
  fallbackExt = "bin",
): string {
  const fromPath = item.path?.split("/").pop();
  const raw = item.filename?.trim() || fromPath || `${item.id}.${fallbackExt}`;
  return safeReportPathSegment(raw, `${item.id}.${fallbackExt}`);
}

export function entityGalleryZipPath(
  entity: Entity,
  item: GalleryImage,
  mediaRoot = "media",
): string {
  const entityDir = entityReportDir(entity);
  const folderParts = buildFolderRelSegments(
    entity.galleryFolders ?? [],
    item.folderId,
  );
  const fileName = leafFileName(item, "jpg");
  return [mediaRoot, "entities", entityDir, "gallery", ...folderParts, fileName]
    .filter(Boolean)
    .join("/");
}

export function entityAttachmentZipPath(
  entity: Entity,
  item: Attachment,
  mediaRoot = "media",
): string {
  const entityDir = entityReportDir(entity);
  const folderParts = buildFolderRelSegments(
    entity.attachmentFolders ?? [],
    item.folderId,
  );
  const fileName = leafFileName(item, "bin");
  return [mediaRoot, "entities", entityDir, "files", ...folderParts, fileName]
    .filter(Boolean)
    .join("/");
}

export function entityProfileZipPath(
  entity: Entity,
  profile: ProfileImage,
  mediaRoot = "media",
): string {
  const entityDir = entityReportDir(entity);
  const fileName = leafFileName(
    {
      path: profile.path,
      filename: profile.filename,
      id: entity.id,
    },
    "jpg",
  );
  return [mediaRoot, "entities", entityDir, fileName].join("/");
}

export function scopeProfileZipPath(
  scope: "case" | "group",
  label: string,
  id: string,
  profile: ProfileImage,
  mediaRoot = "media",
): string {
  const scopeDir = recordReportDir(label, id);
  const fileName = leafFileName(
    {
      path: profile.path,
      filename: profile.filename,
      id,
    },
    "jpg",
  );
  return [mediaRoot, scope, scopeDir, fileName].join("/");
}

export async function readUploadBuffer(relativePath: string): Promise<Buffer | null> {
  const full = resolveUploadPath(relativePath.replace(/^\//, ""));
  if (!full) return null;
  try {
    return await fs.readFile(full);
  } catch {
    return null;
  }
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function guessMimeType(input: {
  mimeType?: string;
  path?: string;
  filename?: string;
}): string {
  if (input.mimeType?.trim()) return input.mimeType.trim();
  const name = input.filename ?? input.path ?? "";
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function resolveReportMediaSrc(
  ctx: ReportMediaContext,
  input: {
    path?: string;
    url?: string;
    mimeType?: string;
    filename?: string;
  },
  relativePath: string,
): Promise<string | null> {
  if (input.url?.trim()) return input.url.trim();
  if (!input.path?.trim()) return null;

  if (ctx.mode === "relative") {
    const root = ctx.mediaRoot ?? "media";
    return relativePath.startsWith(root)
      ? relativePath
      : `${root}/${relativePath.replace(/^\/+/, "")}`;
  }

  const buffer = await readUploadBuffer(input.path);
  if (!buffer) return null;
  return bufferToDataUrl(buffer, guessMimeType(input));
}

export async function resolveProfileImageSrc(
  ctx: ReportMediaContext,
  profile: ProfileImage | undefined,
  relativePath: string,
): Promise<string | null> {
  if (!profile) return null;
  return resolveReportMediaSrc(ctx, profile, relativePath);
}

export async function resolveGalleryImageSrc(
  ctx: ReportMediaContext,
  entity: Entity,
  item: GalleryImage,
): Promise<string | null> {
  return resolveReportMediaSrc(
    ctx,
    item,
    entityGalleryZipPath(entity, item, ctx.mediaRoot ?? "media"),
  );
}

export function isPdfEmbeddableImage(mimeType?: string, filename?: string): boolean {
  const mime = guessMimeType({ mimeType, filename });
  return PDF_IMAGE_MIMES.has(mime.toLowerCase());
}

export async function loadPdfImageSrc(input: {
  path?: string;
  url?: string;
  mimeType?: string;
  filename?: string;
}): Promise<string | null> {
  if (input.url?.trim()) {
    if (!isPdfEmbeddableImage(input.mimeType, input.filename ?? input.url)) {
      return null;
    }
    return input.url.trim();
  }
  if (!input.path?.trim()) return null;
  if (!isPdfEmbeddableImage(input.mimeType, input.filename ?? input.path)) {
    return null;
  }
  const buffer = await readUploadBuffer(input.path);
  if (!buffer) return null;
  return bufferToDataUrl(buffer, guessMimeType(input));
}

function pdfImageFromBuffer(
  buffers: Map<string, Buffer>,
  input: {
    path?: string;
    url?: string;
    mimeType?: string;
    filename?: string;
  },
): string | null {
  if (input.url?.trim()) {
    if (!isPdfEmbeddableImage(input.mimeType, input.filename ?? input.url)) {
      return null;
    }
    return input.url.trim();
  }
  if (!input.path?.trim()) return null;
  if (!isPdfEmbeddableImage(input.mimeType, input.filename ?? input.path)) {
    return null;
  }
  const buffer = buffers.get(input.path);
  if (!buffer) return null;
  return bufferToDataUrl(buffer, guessMimeType(input));
}

export async function readMediaBuffers(
  diskPaths: string[],
): Promise<Map<string, Buffer>> {
  const unique = [...new Set(diskPaths.filter(Boolean))];
  const pairs = await Promise.all(
    unique.map(async (diskPath) => {
      const data = await readUploadBuffer(diskPath);
      return data ? ([diskPath, data] as const) : null;
    }),
  );
  return new Map(pairs.filter((entry): entry is [string, Buffer] => entry !== null));
}

export function buildPdfImageMapFromBuffers(input: {
  buffers: Map<string, Buffer>;
  entities: Entity[];
  caseProfile?: ProfileImage;
  caseId?: string;
  groupProfile?: ProfileImage;
  groupId?: string;
}): Map<string, string> {
  const map = new Map<string, string>();

  if (input.caseProfile && input.caseId) {
    const src = pdfImageFromBuffer(input.buffers, input.caseProfile);
    if (src) map.set(`profile:case:${input.caseId}`, src);
  }
  if (input.groupProfile && input.groupId) {
    const src = pdfImageFromBuffer(input.buffers, input.groupProfile);
    if (src) map.set(`profile:group:${input.groupId}`, src);
  }

  for (const entity of input.entities) {
    if (entity.profileImage) {
      const src = pdfImageFromBuffer(input.buffers, entity.profileImage);
      if (src) map.set(`profile:${entity.id}`, src);
    }
    for (const item of entity.gallery) {
      const src = pdfImageFromBuffer(input.buffers, item);
      if (src) map.set(`gallery:${item.id}`, src);
    }
  }

  return map;
}

export async function loadEntityPdfImages(
  entity: Entity,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const tasks: Promise<void>[] = [];

  if (entity.profileImage) {
    tasks.push(
      loadPdfImageSrc(entity.profileImage).then((src) => {
        if (src) map.set(`profile:${entity.id}`, src);
      }),
    );
  }

  for (const item of entity.gallery) {
    tasks.push(
      loadPdfImageSrc(item).then((src) => {
        if (src) map.set(`gallery:${item.id}`, src);
      }),
    );
  }

  await Promise.all(tasks);
  return map;
}

export async function loadScopePdfImages(input: {
  entities: Entity[];
  caseProfile?: ProfileImage;
  caseId?: string;
  groupProfile?: ProfileImage;
  groupId?: string;
}): Promise<Map<string, string>> {
  const pdfImages = new Map<string, string>();
  const [profileMaps, entityMaps] = await Promise.all([
    Promise.all([
      input.caseProfile && input.caseId
        ? loadProfilePdfImage(input.caseProfile, `profile:case:${input.caseId}`)
        : Promise.resolve(new Map<string, string>()),
      input.groupProfile && input.groupId
        ? loadProfilePdfImage(
            input.groupProfile,
            `profile:group:${input.groupId}`,
          )
        : Promise.resolve(new Map<string, string>()),
    ]),
    Promise.all(input.entities.map((entity) => loadEntityPdfImages(entity))),
  ]);

  for (const profileMap of profileMaps) {
    for (const [key, value] of profileMap) pdfImages.set(key, value);
  }
  for (const entityMap of entityMaps) {
    for (const [key, value] of entityMap) pdfImages.set(key, value);
  }
  return pdfImages;
}

export async function loadProfilePdfImage(
  profile: ProfileImage | undefined,
  key: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!profile) return map;
  const src = await loadPdfImageSrc(profile);
  if (src) map.set(key, src);
  return map;
}

export function galleryItemLabel(item: GalleryImage): string {
  return mediaDisplayName(item);
}

export function galleryPreviewKind(item: GalleryImage) {
  return mediaPreviewKind({
    mimeType: item.mimeType,
    filename: item.filename,
    url: item.url,
    path: item.path,
  });
}

export function collectEntityMediaFiles(
  entity: Entity,
  mediaRoot = "media",
): { zipPath: string; diskPath: string }[] {
  const files: { zipPath: string; diskPath: string }[] = [];

  if (entity.profileImage?.source === "upload" && entity.profileImage.path) {
    const zipPath = entityProfileZipPath(entity, entity.profileImage, mediaRoot);
    files.push({ zipPath, diskPath: entity.profileImage.path });
  }

  for (const item of entity.gallery) {
    if (item.source !== "upload" || !item.path) continue;
    files.push({
      zipPath: entityGalleryZipPath(entity, item, mediaRoot),
      diskPath: item.path,
    });
  }

  for (const item of entity.attachments ?? []) {
    if (!item.path) continue;
    files.push({
      zipPath: entityAttachmentZipPath(entity, item, mediaRoot),
      diskPath: item.path,
    });
  }

  return files;
}

export function collectProfileMediaFile(
  scope: "case" | "group",
  label: string,
  id: string,
  profile: ProfileImage | undefined,
  mediaRoot = "media",
): { zipPath: string; diskPath: string } | null {
  if (profile?.source !== "upload" || !profile.path) return null;
  return {
    zipPath: scopeProfileZipPath(scope, label, id, profile, mediaRoot),
    diskPath: profile.path,
  };
}

export function addMediaEntriesToZip(
  zip: { addFile: (path: string, data: Buffer) => void },
  entries: { zipPath: string; diskPath: string }[],
  buffers: Map<string, Buffer>,
) {
  for (const entry of entries) {
    const data = buffers.get(entry.diskPath);
    if (data) zip.addFile(entry.zipPath, data);
  }
}
