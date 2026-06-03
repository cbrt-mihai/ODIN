import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  badge,
  actions,
  className,
}: {
  backHref?: string;
  backLabel?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {backHref && backLabel && (
          <nav className="flex items-center gap-1 text-sm text-zinc-500">
            <Link
              href={backHref}
              className="transition-colors hover:text-zinc-200"
            >
              {backLabel}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="truncate text-zinc-400">Current</span>
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
