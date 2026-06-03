"use client";

import { User, Briefcase, FolderOpen } from "lucide-react";
import { profileImageHref } from "@/lib/profile/image";
import { cn } from "@/lib/utils";
import type { EntityType, ProfileImage } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  person: "bg-blue-600",
  organization: "bg-purple-600",
  domain: "bg-emerald-600",
  general: "bg-zinc-600",
  email: "bg-pink-600",
  phone: "bg-sky-600",
};

function avatarColorClass(entityType?: EntityType): string {
  if (!entityType) return TYPE_COLORS.general ?? "bg-zinc-600";
  return TYPE_COLORS[entityType] ?? "bg-zinc-600";
}

export function ProfileAvatar({
  profileImage,
  entityType,
  kind = "entity",
  groupColor,
  size = "md",
  className,
}: {
  profileImage?: ProfileImage;
  entityType?: EntityType;
  kind?: "entity" | "case" | "group";
  groupColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const href = profileImageHref(profileImage);
  const dim =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-10 w-10";

  if (href) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={href}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-zinc-700",
          dim,
          className,
        )}
      />
    );
  }

  const fallbackClass =
    kind === "group" && groupColor
      ? ""
      : entityType
        ? avatarColorClass(entityType)
        : kind === "case"
          ? "bg-amber-700"
          : kind === "group"
            ? "bg-indigo-600"
            : "bg-zinc-700";

  const Icon =
    kind === "case" ? Briefcase : kind === "group" ? FolderOpen : User;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-zinc-200 ring-1 ring-zinc-700",
        dim,
        fallbackClass,
        className,
      )}
      style={
        kind === "group" && groupColor ? { backgroundColor: groupColor } : undefined
      }
    >
      <Icon
        className={
          size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5"
        }
      />
    </span>
  );
}
