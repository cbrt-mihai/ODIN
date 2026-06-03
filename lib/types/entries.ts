import type { TextFlavor } from "./annotations";

export type ContextEntryKind =
  | "overview"
  | "background"
  | "relationship"
  | "timeline"
  | "hypothesis"
  | "caveat"
  | "other";

export type NoteEntryKind =
  | "investigation"
  | "interview"
  | "open_question"
  | "internal"
  | "other";

export interface ContextEntry {
  id: string;
  title: string;
  kind: ContextEntryKind;
  body: string;
  bodyFlavor?: TextFlavor;
  tags?: string[];
  order: number;
}

export interface NoteEntry {
  id: string;
  title: string;
  kind: NoteEntryKind;
  body: string;
  bodyFlavor?: TextFlavor;
  tags?: string[];
  order: number;
}

export const CONTEXT_ENTRY_KINDS: { id: ContextEntryKind; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "background", label: "Background" },
  { id: "relationship", label: "Relationship context" },
  { id: "timeline", label: "Timeline / chronology" },
  { id: "hypothesis", label: "Hypothesis" },
  { id: "caveat", label: "Caveat / limitation" },
  { id: "other", label: "Other" },
];

export const NOTE_ENTRY_KINDS: { id: NoteEntryKind; label: string }[] = [
  { id: "investigation", label: "Investigation note" },
  { id: "interview", label: "Interview / contact" },
  { id: "open_question", label: "Open question" },
  { id: "internal", label: "Internal / workflow" },
  { id: "other", label: "Other" },
];
