"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TypedEntryList } from "@/components/entities/typed-entry-list";
import {
  addContextEntry,
  addNoteEntry,
  removeContextEntry,
  removeNoteEntry,
  reorderContextEntries,
  reorderNoteEntries,
  updateContextEntry,
  updateNoteEntry,
} from "@/lib/entries/helpers";
import {
  CONTEXT_ENTRY_KINDS,
  NOTE_ENTRY_KINDS,
  type ContextEntry,
  type ContextEntryKind,
  type Entity,
  type NoteEntry,
  type NoteEntryKind,
} from "@/lib/types";

type SubTab = "context" | "notes";

export function ContextNotesEditor({
  contextEntries,
  noteEntries,
  onContextChange,
  onNotesChange,
  readOnly,
  entities = [],
  defaultSubTab = "context",
}: {
  contextEntries: ContextEntry[];
  noteEntries: NoteEntry[];
  onContextChange: (entries: ContextEntry[]) => void;
  onNotesChange: (entries: NoteEntry[]) => void;
  readOnly?: boolean;
  entities?: Entity[];
  defaultSubTab?: SubTab;
}) {
  const [subTab, setSubTab] = useState<SubTab>(defaultSubTab);
  const contextCount = contextEntries.length;
  const noteCount = noteEntries.length;

  if (readOnly && contextCount === 0 && noteCount === 0) return null;

  const body =
    subTab === "context" ? (
      <TypedEntryList<ContextEntry>
        entries={contextEntries}
        onChange={onContextChange}
        kinds={CONTEXT_ENTRY_KINDS}
        defaultKind="overview"
        onAdd={addContextEntry}
        onUpdate={updateContextEntry}
        onRemove={removeContextEntry}
        onReorder={reorderContextEntries}
        readOnly={readOnly}
        entities={entities}
        emptyHint="Add context entries to capture background, hypotheses, caveats, and more."
        addLabel="Add context"
      />
    ) : (
      <TypedEntryList<NoteEntry>
        entries={noteEntries}
        onChange={onNotesChange}
        kinds={NOTE_ENTRY_KINDS}
        defaultKind="investigation"
        onAdd={addNoteEntry}
        onUpdate={updateNoteEntry}
        onRemove={removeNoteEntry}
        onReorder={reorderNoteEntries}
        readOnly={readOnly}
        entities={entities}
        emptyHint="Add notes as your investigation progresses — interviews, open questions, internal reminders."
        addLabel="Add note"
      />
    );

  if (readOnly) {
    return (
      <div className="space-y-4">
        {contextCount > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
              Context
            </p>
            <TypedEntryList<ContextEntry>
              entries={contextEntries}
              onChange={() => {}}
              kinds={CONTEXT_ENTRY_KINDS}
              defaultKind="overview"
              onAdd={addContextEntry}
              onUpdate={updateContextEntry}
              onRemove={removeContextEntry}
              onReorder={reorderContextEntries}
              readOnly
              entities={entities}
              emptyHint=""
            />
          </div>
        )}
        {noteCount > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
              Notes
            </p>
            <TypedEntryList<NoteEntry>
              entries={noteEntries}
              onChange={() => {}}
              kinds={NOTE_ENTRY_KINDS}
              defaultKind="investigation"
              onAdd={addNoteEntry}
              onUpdate={updateNoteEntry}
              onRemove={removeNoteEntry}
              onReorder={reorderNoteEntries}
              readOnly
              entities={entities}
              emptyHint=""
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SegmentedControl<SubTab>
        value={subTab}
        onChange={setSubTab}
        options={[
          {
            value: "context",
            label:
              contextCount > 0 ? `Context (${contextCount})` : "Context",
          },
          {
            value: "notes",
            label: noteCount > 0 ? `Notes (${noteCount})` : "Notes",
          },
        ]}
      />
      {body}
    </div>
  );
}

// useState import missing!