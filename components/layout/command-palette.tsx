"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  entity: "Entities",
  case: "Cases",
  group: "Groups",
  tool: "Tools",
  resource: "Resources",
  inbox: "Inbox",
  playbook: "Playbooks",
};

const TYPE_ORDER: SearchResult["type"][] = [
  "entity",
  "case",
  "group",
  "playbook",
  "tool",
  "resource",
  "inbox",
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const r = await globalSearch(q);
      setResults(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, open, search]);

  const groupedResults = useMemo(() => {
    const groups = new Map<SearchResult["type"], SearchResult[]>();
    for (const type of TYPE_ORDER) {
      groups.set(type, []);
    }
    for (const result of results) {
      groups.get(result.type)?.push(result);
    }
    return TYPE_ORDER.map((type) => ({
      type,
      items: groups.get(type) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [results]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 shadow-lg hover:border-zinc-500 hover:text-zinc-200"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="rounded border border-zinc-600 px-1.5 text-xs">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] p-4"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-zinc-800 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search entities, cases, tools…"
            className="flex h-12 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
        </div>
        <Command.List className="max-h-80 overflow-auto p-2">
          {loading && (
            <p className="px-2 py-4 text-sm text-zinc-500">Searching…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="px-2 py-4 text-sm text-zinc-500">No results.</p>
          )}
          {!query && (
            <Command.Group heading="Quick">
              <Command.Item
                onSelect={() => navigate("/entities")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Entities
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/cases")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Cases
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/graph")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Relationship graph (workspace)
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/groups")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Groups
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/entities?new=1")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                New entity…
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/cases?new=1")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                New case…
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/duplicates")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Review duplicates
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/inbox")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Inbox
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/import-export")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                Import / Export
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/docs")}
                className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
              >
                User guide
              </Command.Item>
            </Command.Group>
          )}
          {groupedResults.map(({ type, items }) => (
            <Command.Group key={type} heading={TYPE_LABELS[type]}>
              {items.map((r) => (
                <Command.Item
                  key={`${r.type}-${r.id}`}
                  value={`${r.title} ${r.subtitle ?? ""}`}
                  onSelect={() => navigate(r.href)}
                  className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-zinc-800"
                >
                  <span className="font-medium">{r.title}</span>
                  {r.subtitle && (
                    <span className="ml-2 text-xs text-zinc-500 capitalize">
                      {r.subtitle}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
