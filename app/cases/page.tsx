import { Suspense } from "react";
import { CasesIndex } from "@/components/cases/cases-index";
import { listCases } from "@/lib/actions/cases";
import { parseListParams } from "@/lib/list-filter/url-state";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cases = await listCases();
  const initialFilters = parseListParams(params);

  return (
    <Suspense
      fallback={
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
      }
    >
      <CasesIndex cases={cases} initialFilters={initialFilters} />
    </Suspense>
  );
}
