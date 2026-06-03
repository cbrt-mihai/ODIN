export type ImportScope = "platform" | "case";

export type ConflictKind =
  | "file"
  | "entity"
  | "case"
  | "group"
  | "aggregate"
  | "aggregate_record"
  | "upload"
  | "warning";

export type ConflictAction =
  | "skip"
  | "overwrite"
  | "import_as_copy"
  | "keep_local";

export interface ImportManifest {
  version: number;
  scope?: ImportScope;
  caseId?: string;
  entityIds?: string[];
  relationshipIds?: string[];
  exportedAt?: string;
  app?: string;
}

export interface ConflictItem {
  id: string;
  kind: ConflictKind;
  path: string;
  label: string;
  localSummary?: string;
  incomingSummary?: string;
  requiresChoice: boolean;
  defaultAction: ConflictAction;
  allowedActions: ConflictAction[];
  recordId?: string;
  aggregateFile?: string;
}

export interface ImportAnalysisReport {
  manifest: ImportManifest;
  scope: ImportScope;
  conflicts: ConflictItem[];
  newItems: { path: string; label: string }[];
  warnings: string[];
  stats: {
    totalEntries: number;
    conflictCount: number;
    newCount: number;
  };
}

export interface ConflictResolution {
  conflictId: string;
  action: ConflictAction;
}

export interface ImportResult {
  filesWritten: number;
  entitiesImported: number;
  casesImported: number;
  idMap: Record<string, string>;
  warnings: string[];
}

export const AGGREGATE_FILES = [
  "settings.json",
  "tools.json",
  "resources.json",
  "relationships.json",
  "inbox.json",
  "playbooks.json",
  "activity.json",
  "saved-views.json",
] as const;

export type AggregateFileName = (typeof AGGREGATE_FILES)[number];
