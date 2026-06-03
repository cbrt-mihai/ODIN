"use client";

import { useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileImageFromGallery } from "@/lib/profile/image";
import type { EntityType, GalleryImage, ProfileImage } from "@/lib/types";
import type { ProfileScope } from "@/lib/uploads/paths";

export function ProfileImageField({
  scope,
  recordId,
  value,
  onChange,
  entityType,
  groupColor,
  gallery,
  disabled,
  layout = "inline",
}: {
  scope: ProfileScope;
  recordId: string;
  value?: ProfileImage;
  onChange: (next: ProfileImage | undefined) => void;
  entityType?: EntityType;
  groupColor?: string;
  /** Entity only: pick from gallery */
  gallery?: GalleryImage[];
  disabled?: boolean;
  /** inline = avatar beside controls; compact = narrow column for page headers */
  layout?: "inline" | "compact";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(value?.source === "url" ? value.url ?? "" : "");
  const [busy, setBusy] = useState(false);

  const uploadPath =
    scope === "entity"
      ? `/api/entities/${recordId}/upload`
      : scope === "case"
        ? `/api/cases/${recordId}/profile`
        : `/api/groups/${recordId}/profile`;

  async function uploadFile(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (scope === "entity") form.append("kind", "profile");
      const res = await fetch(uploadPath, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.profileImage as ProfileImage);
      setUrl("");
    } finally {
      setBusy(false);
    }
  }

  async function applyUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (scope === "entity") {
      setBusy(true);
      try {
        const form = new FormData();
        form.append("kind", "profile-url");
        form.append("url", trimmed);
        const res = await fetch(uploadPath, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        onChange(data.profileImage as ProfileImage);
      } finally {
        setBusy(false);
      }
      return;
    }
    onChange({ source: "url", url: trimmed });
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(uploadPath, {
        method: "DELETE",
        ...(scope === "entity"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "profile" }),
            }
          : {}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
    } finally {
      setBusy(false);
    }
    onChange(undefined);
    setUrl("");
  }

  const controls = (
      <div
        className={
          layout === "compact"
            ? "w-full min-w-0 space-y-2"
            : "min-w-[200px] flex-1 space-y-3"
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
          >
            Upload image
          </Button>
          {value && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || busy}
              onClick={remove}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Image URL"
            disabled={disabled || busy}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || busy || !url.trim()}
            onClick={() => void applyUrl()}
          >
            Use URL
          </Button>
        </div>
        {scope === "entity" && gallery && gallery.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">From gallery</Label>
            <div className="flex flex-wrap gap-1">
              {gallery.slice(0, 8).map((img) => (
                <button
                  key={img.id}
                  type="button"
                  disabled={disabled || busy}
                  className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  onClick={() => onChange(profileImageFromGallery(img))}
                >
                  {img.caption?.slice(0, 24) ?? "Image"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
  );

  if (layout === "compact") {
    return (
      <div className="w-full max-w-[11rem] shrink-0 space-y-3">
        <ProfileAvatar
          profileImage={value}
          entityType={entityType}
          kind={scope === "entity" ? "entity" : scope}
          groupColor={groupColor}
          size="lg"
          className="mx-auto"
        />
        {controls}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <ProfileAvatar
        profileImage={value}
        entityType={entityType}
        kind={scope === "entity" ? "entity" : scope}
        groupColor={groupColor}
        size="lg"
      />
      {controls}
    </div>
  );
}
