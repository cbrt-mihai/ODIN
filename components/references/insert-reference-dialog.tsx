"use client";

import { useMemo, useState } from "react";
import { AtSign, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EntityRefLabel } from "@/components/entities/entity-ref-label";
import {
  buildReferenceIndex,
  formatAliasedWikilink,
  formatDefaultEntityWikilink,
  type CaseSectionKey,
} from "@/lib/references";
import type { Case, Entity } from "@/lib/types";

type RefTab = "entity" | "case" | "field";

const RECENT_REFS_KEY = "theblacklist.recent-refs";
const MAX_RECENT = 10;

function loadRecentRefs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_REFS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function saveRecentRef(path: string) {
  const normalized = path.startsWith("@") ? path : `@${path}`;
  const existing = loadRecentRefs().filter((p) => p !== normalized);
  existing.unshift(normalized);
  window.localStorage.setItem(
    RECENT_REFS_KEY,
    JSON.stringify(existing.slice(0, MAX_RECENT)),
  );
}

function matchesSearch(query: string, ...parts: string[]): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return parts.some((part) => part.toLowerCase().includes(q));
}

export function InsertReferenceDialog({
  entities,
  cases,
  onInsert,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  entities: Entity[];
  cases: Case[];
  onInsert: (text: string) => void;
  trigger?: React.ReactNode;
  /** Controlled open state (e.g. opened by typing @[ in an editor). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const [tab, setTab] = useState<RefTab>("entity");
  const [search, setSearch] = useState("");
  const [entityId, setEntityId] = useState("");
  const [sectionPath, setSectionPath] = useState("");
  const [fieldPath, setFieldPath] = useState("");
  const [caseId, setCaseId] = useState("");
  const [caseSection, setCaseSection] = useState<CaseSectionKey | "">("");
  const [recentRefs, setRecentRefs] = useState<string[]>([]);

  const index = useMemo(
    () => buildReferenceIndex(entities, cases),
    [entities, cases],
  );

  const filteredEntities = useMemo(
    () =>
      index.entities.filter((entry) =>
        matchesSearch(
          search,
          entry.displayName,
          entry.qualifiedName,
          entry.disambiguator,
          entry.slug,
          entry.path,
          entry.searchText,
        ),
      ),
    [index.entities, search],
  );

  const filteredCases = useMemo(
    () =>
      index.cases.filter((entry) =>
        matchesSearch(search, entry.title, entry.slug, entry.path),
      ),
    [index.cases, search],
  );

  const selectedEntity = index.entities.find((e) => e.entityId === entityId);
  const selectedSection = selectedEntity?.sections.find(
    (s) => s.path === sectionPath,
  );
  const selectedField = selectedSection?.fields.find((f) => f.path === fieldPath);
  const selectedCase = index.cases.find((c) => c.caseId === caseId);

  const previewPath = useMemo(() => {
    if (tab === "entity" && selectedEntity) {
      return `@${selectedEntity.path}`;
    }
    if (tab === "case" && selectedCase) {
      if (caseSection) return `@${selectedCase.slug}.${caseSection}`;
      return `@${selectedCase.path}`;
    }
    if (tab === "field" && selectedField) {
      return `@${selectedField.path}`;
    }
    return "";
  }, [tab, selectedEntity, selectedCase, selectedField, caseSection]);

  const previewLabel = useMemo(() => {
    if (tab === "entity" && selectedEntity) {
      return selectedEntity.isHomonym
        ? selectedEntity.qualifiedName
        : selectedEntity.displayName;
    }
    if (tab === "case" && selectedCase) {
      if (caseSection) {
        const section = selectedCase.sections.find((s) => s.key === caseSection);
        return section?.label ?? selectedCase.title;
      }
      return selectedCase.title;
    }
    if (tab === "field" && selectedField) return selectedField.label;
    return "";
  }, [tab, selectedEntity, selectedCase, selectedField, caseSection]);

  const previewWikilink = useMemo(() => {
    if (tab === "entity" && selectedEntity) {
      return formatDefaultEntityWikilink(selectedEntity);
    }
    if (previewPath && previewLabel) {
      return formatAliasedWikilink(previewLabel, previewPath);
    }
    return "";
  }, [tab, selectedEntity, previewPath, previewLabel]);

  function resetState() {
    setSearch("");
    setTab("entity");
    setEntityId("");
    setSectionPath("");
    setFieldPath("");
    setCaseId("");
    setCaseSection("");
    setRecentRefs(loadRecentRefs());
  }

  function handleOpenChange(next: boolean) {
    if (onOpenChangeProp) onOpenChangeProp(next);
    else setUncontrolledOpen(next);
    if (next) resetState();
  }

  function insertText(text: string, path?: string) {
    onInsert(text);
    if (path) saveRecentRef(path);
    handleOpenChange(false);
  }

  function handleInsertLink() {
    if (!previewWikilink || !previewPath) return;
    insertText(previewWikilink, previewPath);
  }

  function handleInsertBarePath() {
    if (!previewPath) return;
    insertText(previewPath, previewPath);
  }

  async function handleCopyPath() {
    if (!previewPath) return;
    await navigator.clipboard.writeText(previewPath);
  }

  async function handleCopyStableId() {
    if (tab === "entity" && selectedEntity) {
      await navigator.clipboard.writeText(`entity:${selectedEntity.entityId}`);
      return;
    }
    if (tab === "case" && selectedCase) {
      await navigator.clipboard.writeText(`case:${selectedCase.caseId}`);
      return;
    }
    if (tab === "field" && selectedField && selectedEntity) {
      await navigator.clipboard.writeText(
        `field:${selectedEntity.entityId}/${selectedField.fieldId}`,
      );
    }
  }

  const canInsert = Boolean(previewPath);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <AtSign className="h-4 w-4" />
            Insert reference
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert reference</DialogTitle>
          <DialogDescription>
            Pick an entity, case, or field. Same-name records show a
            disambiguator and use @ paths so links stay unambiguous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ref-search">Search</Label>
            <Input
              id="ref-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or path…"
            />
          </div>

          <SegmentedControl<RefTab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "entity", label: "Entity" },
              { value: "case", label: "Case" },
              { value: "field", label: "Field" },
            ]}
          />

          {tab === "entity" && (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
              {filteredEntities.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">No entities match.</p>
              ) : (
                filteredEntities.map((entry) => (
                  <button
                    key={entry.entityId}
                    type="button"
                    onClick={() => setEntityId(entry.entityId)}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                      entityId === entry.entityId
                        ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                        : "hover:bg-zinc-800/60"
                    }`}
                  >
                    <EntityRefLabel
                      displayName={entry.displayName}
                      qualifiedName={entry.qualifiedName}
                      disambiguator={entry.disambiguator}
                      referenceSlug={entry.slug}
                      type={entry.type}
                      isHomonym={entry.isHomonym}
                      monoPath
                    />
                  </button>
                ))
              )}
            </div>
          )}

          {tab === "case" && (
            <div className="space-y-3">
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
                {filteredCases.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-zinc-500">No cases match.</p>
                ) : (
                  filteredCases.map((entry) => (
                    <button
                      key={entry.caseId}
                      type="button"
                      onClick={() => {
                        setCaseId(entry.caseId);
                        setCaseSection("");
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                        caseId === entry.caseId
                          ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                          : "hover:bg-zinc-800/60"
                      }`}
                    >
                      <span className="font-medium text-zinc-100">{entry.title}</span>
                      <span className="mt-0.5 block font-mono text-xs text-zinc-500">
                        @{entry.path}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selectedCase && (
                <div className="space-y-2">
                  <Label>Case section (optional)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCase.sections.map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() =>
                          setCaseSection((prev) =>
                            prev === section.key ? "" : (section.key as CaseSectionKey),
                          )
                        }
                        className={`rounded-md px-2.5 py-1 text-xs ${
                          caseSection === section.key
                            ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40"
                            : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "field" && (
            <div className="space-y-3">
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
                {filteredEntities.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-zinc-500">No entities match.</p>
                ) : (
                  filteredEntities.map((entry) => (
                    <button
                      key={entry.entityId}
                      type="button"
                      onClick={() => {
                        setEntityId(entry.entityId);
                        setSectionPath("");
                        setFieldPath("");
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                        entityId === entry.entityId
                          ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                          : "hover:bg-zinc-800/60"
                      }`}
                    >
                      <EntityRefLabel
                        displayName={entry.displayName}
                        qualifiedName={entry.qualifiedName}
                        disambiguator={entry.disambiguator}
                        referenceSlug={entry.slug}
                        type={entry.type}
                        isHomonym={entry.isHomonym}
                        monoPath
                      />
                    </button>
                  ))
                )}
              </div>
              {selectedEntity && (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
                  {selectedEntity.sections.map((section) => (
                    <button
                      key={section.sectionId}
                      type="button"
                      onClick={() => {
                        setSectionPath(section.path);
                        setFieldPath("");
                      }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                        sectionPath === section.path
                          ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                          : "hover:bg-zinc-800/60"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              )}
              {selectedSection && (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-1">
                  {selectedSection.fields.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-zinc-500">No fields.</p>
                  ) : (
                    selectedSection.fields
                      .filter((field) =>
                        matchesSearch(search, field.label, field.path),
                      )
                      .map((field) => (
                        <button
                          key={field.fieldId}
                          type="button"
                          onClick={() => setFieldPath(field.path)}
                          className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                            fieldPath === field.path
                              ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                              : "hover:bg-zinc-800/60"
                          }`}
                        >
                          <span className="font-medium text-zinc-100">
                            {field.label}
                          </span>
                          <span className="mt-0.5 block font-mono text-xs text-zinc-500">
                            @{field.path}
                          </span>
                        </button>
                      ))
                  )}
                </div>
              )}
              {selectedField && selectedEntity && (
                <p className="font-mono text-xs text-zinc-500">
                  {selectedEntity.slug} › {selectedSection?.slug} ›{" "}
                  {selectedField.slug}
                </p>
              )}
            </div>
          )}

          {recentRefs.length > 0 && (
            <div className="space-y-2">
              <Label>Recent</Label>
              <div className="flex flex-wrap gap-1.5">
                {recentRefs.map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => insertText(path, path)}
                    className="rounded-md bg-zinc-800/60 px-2 py-1 font-mono text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Preview</p>
            <p className="mt-1 font-mono text-sm text-emerald-400/90">
              {previewPath || "Select a target…"}
            </p>
            {previewWikilink ? (
              <p className="mt-2 font-mono text-xs text-zinc-500">{previewWikilink}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!previewPath}
              onClick={handleCopyPath}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy @path
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canInsert}
              onClick={handleCopyStableId}
            >
              Copy stable ID
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!canInsert}
              onClick={handleInsertBarePath}
            >
              Insert bare @path
            </Button>
            <Button type="button" disabled={!canInsert} onClick={handleInsertLink}>
              Insert link
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
