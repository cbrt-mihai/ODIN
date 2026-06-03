import type { SavedViewsFile } from "@/lib/types";
import { DATA_PATHS, dataPath } from "./paths";
import { readJsonFile, writeJsonFile } from "./index";

export async function getSavedViewsFile(): Promise<SavedViewsFile> {
  return (
    (await readJsonFile<SavedViewsFile>(dataPath(DATA_PATHS.savedViews))) ?? {
      views: [],
    }
  );
}

export async function saveSavedViewsFile(data: SavedViewsFile) {
  await writeJsonFile(dataPath(DATA_PATHS.savedViews), data);
}
