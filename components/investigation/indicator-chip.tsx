"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IndicatorSource } from "@/lib/osint/extract-indicators";

export function IndicatorChip({
  value,
  sources,
  className,
}: {
  value: string;
  sources: IndicatorSource[];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = sources.length > 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const sourceSummary = sources.map((s) => s.displayName).join(", ");

  return (
    <div className={cn("group/chip relative inline-flex max-w-full align-top", className)}>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex max-w-full items-start gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/80 py-1 text-left text-xs font-mono text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800",
          hasSources ? "rounded-r-none border-r-0 pl-2 pr-1.5" : "px-2",
        )}
        title={
          hasSources
            ? `Click to copy · From: ${sourceSummary}`
            : "Click to copy"
        }
      >
        <span className="break-all">{value}</span>
        {copied ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover/chip:opacity-100" />
        )}
      </button>

      {hasSources && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSourcesOpen((o) => !o);
          }}
          className={cn(
            "inline-flex items-center rounded-r-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-1 transition-colors hover:border-zinc-600 hover:bg-zinc-800",
            sourcesOpen
              ? "border-zinc-600 bg-zinc-800 text-zinc-300"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          title={`Found in ${sources.length} entit${sources.length === 1 ? "y" : "ies"}. Click to ${sourcesOpen ? "hide" : "show"}.`}
          aria-label="Toggle source entities"
          aria-expanded={sourcesOpen}
        >
          <Users className="h-3 w-3" />
          <span className="sr-only">{sources.length}</span>
        </button>
      )}

      {hasSources && (
        <div
          hidden={!sourcesOpen}
          className="absolute left-0 top-full z-20 mt-1 min-w-[12rem] max-w-xs rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-lg"
        >
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Found in
          </p>
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.entityId}>
                <Link
                  href={`/entities/${source.entityId}`}
                  className="block break-words text-xs text-sky-400 hover:text-sky-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {source.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
