import path from "path";
import { dataPath } from "@/lib/storage/paths";

export type EntityUploadSub = "images" | "attachments" | "proofs" | "profile";

export type ProfileScope = "entity" | "case" | "group";

export function entityUploadDir(entityId: string, sub: EntityUploadSub) {
  return dataPath("uploads", entityId, sub);
}

export function profileUploadDir(scope: ProfileScope, id: string) {
  if (scope === "entity") {
    return dataPath("uploads", id, "profile");
  }
  return dataPath("uploads", scope, id, "profile");
}

export function relativeUploadPath(
  entityId: string,
  sub: EntityUploadSub,
  filename: string,
) {
  return `uploads/${entityId}/${sub}/${filename}`;
}

export function relativeProfilePath(
  scope: ProfileScope,
  id: string,
  filename: string,
) {
  if (scope === "entity") {
    return `uploads/${id}/profile/${filename}`;
  }
  return `uploads/${scope}/${id}/profile/${filename}`;
}

export function resolveUploadPath(relative: string): string | null {
  const parts = relative.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts[0] !== "uploads" || parts.includes("..")) return null;
  if (parts.length < 2) return null;
  const scope = parts[1];
  if (scope === "cases" || scope === "groups") {
    if (parts.length < 5 || parts[3] !== "profile") return null;
    return dataPath(...parts);
  }
  return dataPath(...parts);
}
