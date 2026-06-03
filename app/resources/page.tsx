import { Suspense } from "react";
import { ReferenceIndex } from "@/components/reference/reference-index";
import { listResources } from "@/lib/actions/resources";
import { parseListParams } from "@/lib/list-filter/url-state";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const resources = await listResources();

  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
      }
    >
    <ReferenceIndex
      items={resources}
      variant="resource"
      title="Resources"
      subtitle="Guides, documentation, and reference material."
      initialFilters={parseListParams(params)}
    />
    </Suspense>
  );
}
