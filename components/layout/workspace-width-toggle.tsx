"use client";

import { useEffect, useState } from "react";
import { Expand, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cycleWorkspaceWidth,
  readWorkspaceWidth,
  workspaceWidthLabel,
  workspaceWidthNextHint,
  writeWorkspaceWidth,
  type WorkspaceWidthMode,
} from "@/lib/ui/workspace-layout";

function WidthIcon({ mode }: { mode: WorkspaceWidthMode }) {
  switch (mode) {
    case "widest":
      return <Expand className="h-4 w-4" />;
    case "wide":
      return <Maximize2 className="h-4 w-4" />;
    default:
      return <Minimize2 className="h-4 w-4" />;
  }
}

export function WorkspaceWidthToggle() {
  const [mode, setMode] = useState<WorkspaceWidthMode>("standard");

  useEffect(() => {
    setMode(readWorkspaceWidth());
    const onStorage = () => setMode(readWorkspaceWidth());
    window.addEventListener("storage", onStorage);
    window.addEventListener("theblacklist:workspace-width", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theblacklist:workspace-width", onStorage);
    };
  }, []);

  function cycle() {
    const next = cycleWorkspaceWidth(mode);
    setMode(next);
    writeWorkspaceWidth(next);
    window.dispatchEvent(new Event("theblacklist:workspace-width"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      title={workspaceWidthNextHint(mode)}
      className="text-zinc-400"
    >
      <WidthIcon mode={mode} />
      <span className="sr-only md:not-sr-only md:ml-2">
        {workspaceWidthLabel(mode)}
      </span>
    </Button>
  );
}
