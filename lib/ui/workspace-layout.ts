const STORAGE_KEY = "theblacklist:wide-workspace";

export function readWideWorkspace(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeWideWorkspace(wide: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, wide ? "1" : "0");
  } catch {
    // ignore
  }
}
