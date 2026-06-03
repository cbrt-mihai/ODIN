"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyChip({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-left text-xs font-mono text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800",
        className,
      )}
      title="Click to copy"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}
