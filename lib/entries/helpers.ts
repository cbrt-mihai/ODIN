import { v4 as uuidv4 } from "uuid";
import type { EntryAnnotations, TextFlavor } from "@/lib/types/annotations";
import type {
  ContextEntry,
  ContextEntryKind,
  NoteEntry,
  NoteEntryKind,
} from "@/lib/types/entries";

export function defaultContextEntry(
  partial?: Partial<ContextEntry>,
): ContextEntry {
  return {
    id: uuidv4(),
    title: "New context",
    kind: "overview",
    body: "",
    bodyFlavor: "plain",
    tags: [],
    order: 0,
    ...partial,
  };
}

export function defaultNoteEntry(partial?: Partial<NoteEntry>): NoteEntry {
  return {
    id: uuidv4(),
    title: "New note",
    kind: "investigation",
    body: "",
    bodyFlavor: "plain",
    tags: [],
    order: 0,
    ...partial,
  };
}

export function addContextEntry(
  entries: ContextEntry[],
  kind: ContextEntryKind = "overview",
): ContextEntry[] {
  return [
    ...entries,
    defaultContextEntry({ kind, order: entries.length }),
  ];
}

export function addNoteEntry(
  entries: NoteEntry[],
  kind: NoteEntryKind = "investigation",
): NoteEntry[] {
  return [
    ...entries,
    defaultNoteEntry({ kind, order: entries.length }),
  ];
}

export function updateContextEntry(
  entries: ContextEntry[],
  id: string,
  patch: Partial<ContextEntry>,
): ContextEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

export function updateNoteEntry(
  entries: NoteEntry[],
  id: string,
  patch: Partial<NoteEntry>,
): NoteEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

export function removeContextEntry(
  entries: ContextEntry[],
  id: string,
): ContextEntry[] {
  return entries
    .filter((e) => e.id !== id)
    .map((e, order) => ({ ...e, order }));
}

export function removeNoteEntry(
  entries: NoteEntry[],
  id: string,
): NoteEntry[] {
  return entries
    .filter((e) => e.id !== id)
    .map((e, order) => ({ ...e, order }));
}

export function reorderContextEntries(
  entries: ContextEntry[],
  ids: string[],
): ContextEntry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return ids
    .map((id, order) => {
      const e = byId.get(id);
      return e ? { ...e, order } : null;
    })
    .filter(Boolean) as ContextEntry[];
}

export function reorderNoteEntries(
  entries: NoteEntry[],
  ids: string[],
): NoteEntry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return ids
    .map((id, order) => {
      const e = byId.get(id);
      return e ? { ...e, order } : null;
    })
    .filter(Boolean) as NoteEntry[];
}

/** Migrate legacy single description/notes into lists (non-destructive). */
export function migrateAnnotationsToLists<T extends EntryAnnotations & {
  contextEntries?: ContextEntry[];
  noteEntries?: NoteEntry[];
}>(item: T): { contextEntries: ContextEntry[]; noteEntries: NoteEntry[] } {
  const contextEntries = [...(item.contextEntries ?? [])];
  const noteEntries = [...(item.noteEntries ?? [])];

  if (
    contextEntries.length === 0 &&
    (item.description?.trim() || (item.tags?.length ?? 0) > 0)
  ) {
    contextEntries.push(
      defaultContextEntry({
        id: uuidv4(),
        title: "Description",
        kind: "overview",
        body: item.description ?? "",
        bodyFlavor: item.descriptionFlavor ?? "plain",
        tags: item.tags ?? [],
        order: 0,
      }),
    );
  }

  if (noteEntries.length === 0 && item.notes?.trim()) {
    noteEntries.push(
      defaultNoteEntry({
        id: uuidv4(),
        title: "Notes",
        kind: "investigation",
        body: item.notes,
        bodyFlavor: item.notesFlavor ?? "plain",
        order: 0,
      }),
    );
  }

  return { contextEntries, noteEntries };
}

export function entriesSearchText(
  contextEntries: ContextEntry[],
  noteEntries: NoteEntry[],
): string {
  const parts: string[] = [];
  for (const e of contextEntries) {
    parts.push(e.title, e.body, ...(e.tags ?? []));
  }
  for (const e of noteEntries) {
    parts.push(e.title, e.body, ...(e.tags ?? []));
  }
  return parts.join("\n");
}

export function kindLabel<T extends { id: string; label: string }>(
  kinds: T[],
  id: string,
): string {
  return kinds.find((k) => k.id === id)?.label ?? id;
}
