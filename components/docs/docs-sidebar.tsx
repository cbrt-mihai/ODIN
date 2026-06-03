"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DocPageMeta } from "@/lib/docs/registry";

function docHref(slug: string) {
  return slug === "overview" ? "/docs" : `/docs/${slug}`;
}

export function DocsSidebar({ pages }: { pages: DocPageMeta[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        User guide
      </p>
      {pages.map((page) => {
        const href = docHref(page.slug);
        const active =
          pathname === href ||
          (page.slug === "overview" && pathname === "/docs");
        return (
          <Link
            key={page.slug}
            href={href}
            className={cn(
              "block rounded-md px-2 py-2 text-sm transition-colors",
              active
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
            )}
          >
            <span className="font-medium">{page.title}</span>
            <span className="mt-0.5 block text-xs text-zinc-500 line-clamp-2">
              {page.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
