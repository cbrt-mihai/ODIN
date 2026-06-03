"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollapsibleOpen } from "@/lib/ui/use-collapsible-open";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Full-width clickable header for native `<details>` elements. */
export const collapsibleSummaryClass =
  "flex w-full min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-left [&::-webkit-details-marker]:hidden";

/** Standalone toggle button (field details, etc.). */
export const collapsibleToggleButtonClass =
  "flex w-full min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/40";

export function CollapsibleCard({
  title,
  actions,
  children,
  defaultOpen = true,
  forceOpen = false,
  className,
  contentClassName,
  id,
  storageKey,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** When true, the card stays expanded (e.g. edit focus) without clearing saved preference. */
  forceOpen?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  /** Persists open/closed in localStorage. Falls back to `id` when omitted. */
  storageKey?: string;
}) {
  const persistKey = storageKey ?? id;
  const { open, toggle } = useCollapsibleOpen({
    storageKey: persistKey,
    defaultOpen,
    forceOpen,
  });

  const displayOpen = forceOpen || open;

  return (
    <Card
      id={id}
      className={cn("w-full min-w-0 overflow-hidden", className)}
    >
      <CardHeader className="flex flex-row items-stretch gap-0 space-y-0 p-0">
        <div
          className={cn(
            "flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 px-6 py-4 text-left",
            "transition-colors hover:bg-zinc-800/40",
          )}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!forceOpen) toggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!forceOpen) toggle();
            }
          }}
          aria-expanded={displayOpen}
          aria-label={displayOpen ? "Collapse section" : "Expand section"}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
              !displayOpen && "-rotate-90",
            )}
          />
          <span className="min-w-0 flex-1 text-base font-semibold leading-snug tracking-tight text-zinc-100">
            {title}
          </span>
        </div>
        {actions ? (
          <div
            className="flex shrink-0 items-center gap-2 self-stretch px-4 py-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </CardHeader>
      {displayOpen ? (
        <CardContent className={cn("min-w-0 space-y-4", contentClassName)}>
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}
