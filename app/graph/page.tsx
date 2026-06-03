import { Suspense } from "react";
import { GraphPageContent } from "@/components/graph/graph-page-content";
import GraphLoading from "./loading";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<GraphLoading />}>
      <GraphPageContent searchParams={searchParams} />
    </Suspense>
  );
}
