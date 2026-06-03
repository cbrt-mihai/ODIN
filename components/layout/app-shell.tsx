"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Providers } from "@/components/providers";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { WorkspaceWidthToggle } from "./workspace-width-toggle";
import {
  readWorkspaceWidth,
  workspaceWidthShellClass,
  type WorkspaceWidthMode,
} from "@/lib/ui/workspace-layout";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [widthMode, setWidthMode] = useState<WorkspaceWidthMode>("standard");

  useEffect(() => {
    setWidthMode(readWorkspaceWidth());
    const sync = () => setWidthMode(readWorkspaceWidth());
    window.addEventListener("storage", sync);
    window.addEventListener("theblacklist:workspace-width", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("theblacklist:workspace-width", sync);
    };
  }, []);

  return (
    <Providers>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-zinc-300 hover:bg-zinc-900"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-100">
            TheBlacklist
          </span>
          {mobileOpen && (
            <button
              type="button"
              className="ml-auto rounded-md p-2 text-zinc-400 hover:bg-zinc-900"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar
          onNavigate={() => setMobileOpen(false)}
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        />

        <main className="flex-1 overflow-auto bg-zinc-950 pt-14 md:pt-0">
          <div className={cn(workspaceWidthShellClass(widthMode))}>
            <div className="mb-4 hidden justify-end md:flex">
              <WorkspaceWidthToggle />
            </div>
            {children}
          </div>
        </main>
        <CommandPalette />
      </div>
    </Providers>
  );
}
