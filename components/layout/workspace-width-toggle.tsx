"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  readWideWorkspace,
  writeWideWorkspace,
} from "@/lib/ui/workspace-layout";

export function WorkspaceWidthToggle() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    setWide(readWideWorkspace());
    const onStorage = () => setWide(readWideWorkspace());
    window.addEventListener("storage", onStorage);
    window.addEventListener("theblacklist:workspace-width", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theblacklist:workspace-width", onStorage);
    };
  }, []);

  function toggle() {
    const next = !wide;
    setWide(next);
    writeWideWorkspace(next);
    window.dispatchEvent(new Event("theblacklist:workspace-width"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      title={wide ? "Use standard page width" : "Use wide workspace"}
      className="text-zinc-400"
    >
      {wide ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
      <span className="sr-only md:not-sr-only md:ml-2">
        {wide ? "Standard width" : "Wide workspace"}
      </span>
    </Button>
  );
}
