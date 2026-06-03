const STORAGE_KEY = "theblacklist:wide-workspace";

export type WorkspaceWidthMode = "standard" | "wide" | "widest";

const MODES: WorkspaceWidthMode[] = ["standard", "wide", "widest"];

export function readWorkspaceWidth(): WorkspaceWidthMode {
  if (typeof window === "undefined") return "standard";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "2" || raw === "widest") return "widest";
    if (raw === "1" || raw === "wide") return "wide";
    return "standard";
  } catch {
    return "standard";
  }
}

/** @deprecated Use readWorkspaceWidth */
export function readWideWorkspace(): boolean {
  return readWorkspaceWidth() !== "standard";
}

export function writeWorkspaceWidth(mode: WorkspaceWidthMode) {
  if (typeof window === "undefined") return;
  try {
    const value =
      mode === "widest" ? "2" : mode === "wide" ? "1" : "0";
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

/** @deprecated Use writeWorkspaceWidth */
export function writeWideWorkspace(wide: boolean) {
  writeWorkspaceWidth(wide ? "wide" : "standard");
}

export function cycleWorkspaceWidth(
  current: WorkspaceWidthMode,
): WorkspaceWidthMode {
  const index = MODES.indexOf(current);
  return MODES[(index + 1) % MODES.length];
}

export function workspaceWidthShellClass(mode: WorkspaceWidthMode): string {
  switch (mode) {
    case "widest":
      return "mx-auto min-h-full w-full max-w-none px-3 py-6 md:px-4 md:py-8 lg:px-5 lg:py-10";
    case "wide":
      return "mx-auto min-h-full p-6 md:p-8 lg:p-10 max-w-[min(100%,96rem)]";
    default:
      return "mx-auto min-h-full p-6 md:p-8 lg:p-10 max-w-6xl";
  }
}

export function workspaceWidthLabel(mode: WorkspaceWidthMode): string {
  switch (mode) {
    case "widest":
      return "Widest workspace";
    case "wide":
      return "Wide workspace";
    default:
      return "Standard width";
  }
}

export function workspaceWidthNextHint(mode: WorkspaceWidthMode): string {
  switch (mode) {
    case "widest":
      return "Use standard page width";
    case "wide":
      return "Use widest workspace";
    default:
      return "Use wide workspace";
  }
}
