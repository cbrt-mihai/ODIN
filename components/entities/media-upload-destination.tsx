"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { folderOptionLabel } from "@/lib/media/upload-destination";
import type { MediaUploadDestinationState } from "@/lib/media/upload-destination";
import type { GalleryFolder } from "@/lib/types";

export function MediaUploadDestination({
  folders,
  value,
  onChange,
  rootLabel = "Root (no folder)",
}: {
  folders: GalleryFolder[];
  value: MediaUploadDestinationState;
  onChange: (value: MediaUploadDestinationState) => void;
  rootLabel?: string;
}) {
  const sorted = [...folders].sort((a, b) =>
    folderOptionLabel(a, folders).localeCompare(folderOptionLabel(b, folders)),
  );

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-3">
      <Label className="text-xs text-zinc-500">Upload to</Label>
      <Select
        value={value.mode}
        onValueChange={(mode) =>
          onChange({
            ...value,
            mode: mode as MediaUploadDestinationState["mode"],
          })
        }
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="root">{rootLabel}</SelectItem>
          <SelectItem value="existing" disabled={sorted.length === 0}>
            Existing folder
          </SelectItem>
          <SelectItem value="new">New folder</SelectItem>
        </SelectContent>
      </Select>

      {value.mode === "existing" && sorted.length > 0 && (
        <Select
          value={value.existingFolderId ?? ""}
          onValueChange={(existingFolderId) =>
            onChange({ ...value, existingFolderId })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Choose folder…" />
          </SelectTrigger>
          <SelectContent>
            {sorted.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {folderOptionLabel(f, folders)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value.mode === "new" && (
        <Input
          className="h-8 text-sm"
          value={value.newFolderName}
          onChange={(e) =>
            onChange({ ...value, newFolderName: e.target.value })
          }
          placeholder="New folder name"
        />
      )}
    </div>
  );
}
