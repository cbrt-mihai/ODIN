"use server";

import { v4 as uuidv4 } from "uuid";
import type { ActivityEntry } from "@/lib/types";
import { getActivity, writeJsonFile } from "./index";
import { DATA_PATHS, dataPath } from "./paths";

export async function logActivity(
  entry: Omit<ActivityEntry, "id" | "at">,
) {
  const file = await getActivity();
  const newEntry: ActivityEntry = {
    id: uuidv4(),
    at: new Date().toISOString(),
    ...entry,
  };
  file.entries.unshift(newEntry);
  if (file.entries.length > 500) {
    file.entries = file.entries.slice(0, 500);
  }
  await writeJsonFile(dataPath(DATA_PATHS.activity), file);
  return newEntry;
}
