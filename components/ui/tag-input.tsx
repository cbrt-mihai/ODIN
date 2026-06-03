"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag…",
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
          >
            {tag}
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-zinc-500">No tags</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-0.5 text-xs text-indigo-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-indigo-200"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(draft);
          }
          if (e.key === "Backspace" && !draft && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        onBlur={() => {
          if (draft.trim()) addTag(draft);
        }}
        placeholder={placeholder}
        className="max-w-md"
      />
      <p className="text-xs text-zinc-500">Press Enter or comma to add a tag.</p>
    </div>
  );
}

export function TagList({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
