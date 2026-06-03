"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickEditButton({
  onClick,
  label = "Edit",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 shrink-0 gap-1 px-2 text-xs text-zinc-500 hover:text-zinc-300",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
    >
      <Pencil className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
