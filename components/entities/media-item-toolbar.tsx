"use client";

import {
  ChevronDown,
  Copy,
  FolderInput,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import {
  mediaItemCopyUrl,
  toAbsoluteMediaUrl,
} from "@/lib/media/item-ops";
import { cn } from "@/lib/utils";
import type { Attachment, GalleryFolder, GalleryImage } from "@/lib/types";

type MediaItem = GalleryImage | Attachment;

const iconBtnClass =
  "h-6 w-6 rounded bg-black/50 text-zinc-300 hover:bg-black/70 hover:text-zinc-100";

export function MediaItemToolbar({
  item,
  folders,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
  className,
  expanded = false,
}: {
  item: MediaItem;
  folders?: GalleryFolder[];
  onEdit: () => void;
  onDuplicate: () => void;
  onMove: (folderId: string | undefined) => void;
  onDelete: () => void;
  className?: string;
  /** Show actions inline in a row instead of a chevron dropdown. */
  expanded?: boolean;
  /** @deprecated use `expanded` */
  compact?: boolean;
}) {
  const toast = useToast();

  async function copyLink() {
    const href = mediaItemCopyUrl(item);
    if (!href) {
      toast.error("Nothing to copy for this item");
      return;
    }
    try {
      await navigator.clipboard.writeText(toAbsoluteMediaUrl(href));
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  if (expanded) {
    return (
      <div
        className={cn(
          "flex items-center gap-0.5 rounded bg-black/50 p-0.5",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          title="Edit"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          title="Copy link"
          onClick={() => void copyLink()}
        >
          <Link2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          title="Duplicate"
          onClick={onDuplicate}
        >
          <Copy className="h-3 w-3" />
        </Button>
        {folders !== undefined && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={iconBtnClass}
                title="Move to…"
              >
                <FolderInput className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onMove(undefined)}>
                Root (no folder)
              </DropdownMenuItem>
              {folders.map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => onMove(f.id)}>
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconBtnClass, "text-red-400 hover:text-red-300")}
          title="Delete"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="group h-6 w-6 rounded bg-black/50 text-zinc-300 hover:bg-black/70 hover:text-zinc-100 data-[state=open]:bg-black/70"
            title="Actions"
          >
            <ChevronDown className="h-3 w-3 transition-transform duration-150 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copyLink()}>
            <Link2 className="h-3.5 w-3.5 text-zinc-400" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy className="h-3.5 w-3.5 text-zinc-400" />
            Duplicate
          </DropdownMenuItem>
          {folders !== undefined && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="h-3.5 w-3.5 text-zinc-400" />
                Move to…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => onMove(undefined)}>
                  Root (no folder)
                </DropdownMenuItem>
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onSelect={() => onMove(f.id)}>
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400 focus:text-red-300"
            onSelect={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
