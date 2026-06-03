"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  CircleHelp,
  Copy,
  FolderOpen,
  Download,
  Inbox,
  LayoutDashboard,
  History,
  ListChecks,
  Network,
  Settings,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entities", label: "Entities", icon: Users },
  { href: "/duplicates", label: "Duplicates", icon: Copy },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/groups", label: "Groups", icon: FolderOpen },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/playbooks", label: "Playbooks", icon: ListChecks },
  { href: "/activity", label: "Activity", icon: History },
  { href: "/import-export", label: "Import / Export", icon: Download },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "User guide", icon: CircleHelp },
];

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-zinc-950/90 backdrop-blur-sm",
        className,
      )}
    >
      <div className="border-b border-zinc-800/80 px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-lg font-semibold tracking-tight text-zinc-100 transition-colors hover:text-white"
        >
          TheBlacklist
        </Link>
        <p className="mt-1 text-xs text-zinc-500">OSINT workspace</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-zinc-800/90 text-zinc-50 shadow-sm shadow-black/20"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active
                    ? "text-blue-400"
                    : "text-zinc-500 group-hover:text-zinc-300",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800/80 p-3">
        <p className="px-3 text-[10px] uppercase tracking-wider text-zinc-600">
          ⌘K Command palette
        </p>
      </div>
    </aside>
  );
}
