import { Suspense } from "react";
import { EntitiesIndex } from "@/components/entities/entities-index";
import { listEntities } from "@/lib/actions/entities";
import { parseListParams } from "@/lib/list-filter/url-state";
import { getSettings } from "@/lib/storage";

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [entities, settings] = await Promise.all([
    listEntities(),
    getSettings(),
  ]);
  const initialFilters = parseListParams(params);

  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
      }
    >
      <EntitiesIndex
        entities={entities}
        initialFilters={initialFilters}
        settings={settings}
      />
    </Suspense>
  );
}
