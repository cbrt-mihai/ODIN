import { Suspense } from "react";
import { ReferenceIndex } from "@/components/reference/reference-index";
import { listTools } from "@/lib/actions/tools";
import { parseListParams } from "@/lib/list-filter/url-state";

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tools = await listTools();

  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
      }
    >
    <ReferenceIndex
      items={tools}
      variant="tool"
      title="Tools"
      subtitle="External links and internal reference pages for your investigations."
      initialFilters={parseListParams(params)}
    />
    </Suspense>
  );
}
