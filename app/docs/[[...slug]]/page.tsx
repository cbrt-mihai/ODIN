import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DOC_PAGES, getDocPage } from "@/lib/docs/registry";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = getDocPage(slug?.[0]);
  if (!page) notFound();

  const ordered = [...DOC_PAGES].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((p) => p.slug === page.slug);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;

  const href = (s: string) => (s === "overview" ? "/docs" : `/docs/${s}`);

  const { Content } = page;

  return (
    <div>
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          User guide
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">
          {page.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{page.description}</p>
      </header>

      <Content />

      {(prev || next) && (
        <nav className="mt-12 flex flex-wrap gap-4 border-t border-zinc-800 pt-6">
          {prev ? (
            <Link
              href={href(prev.slug)}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <ChevronLeft className="h-4 w-4" />
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={href(next.slug)}
              className="ml-auto flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
            >
              {next.title}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
