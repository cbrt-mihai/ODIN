import path from "path";

export function getDataDir() {
  return path.join(process.cwd(), "data");
}

export const DATA_PATHS = {
  settings: "settings.json",
  tools: "tools.json",
  resources: "resources.json",
  relationships: "relationships.json",
  inbox: "inbox.json",
  playbooks: "playbooks.json",
  activity: "activity.json",
  savedViews: "saved-views.json",
  entitiesDir: "entities",
  casesDir: "cases",
  groupsDir: "groups",
  uploadsDir: "uploads",
  snapshotsDir: "snapshots",
  trashDir: "trash",
  runsDir: "runs",
} as const;

export function dataPath(...segments: string[]) {
  return path.join(getDataDir(), ...segments);
}
