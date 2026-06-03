"use client";

import { cn } from "@/lib/utils";
import { normalizeTextFlavor } from "@/lib/markdown/flavor";
import { TEXT_FLAVOR_TOGGLE, type TextFlavor } from "@/lib/types";

export function TextFlavorToggle({
  value,
  onChange,
  className,
}: {
  value?: TextFlavor;
  onChange: (v: TextFlavor) => void;
  className?: string;
}) {
  const current = normalizeTextFlavor(value);
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-zinc-800/80 bg-zinc-950/60 p-0.5",
        className,
      )}
      title="Plain text or Markdown (GFM + Obsidian features)"
    >
      {TEXT_FLAVOR_TOGGLE.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
            current === f.id
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          title={f.id === "markdown" ? "GFM + [[wikilinks]] + #tags + callouts" : f.label}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
