import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { getDocPageNav } from "@/lib/docs/registry";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = getDocPageNav();

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <aside className="lg:w-56 shrink-0">
        <div className="lg:sticky lg:top-8">
          <DocsSidebar pages={pages} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
