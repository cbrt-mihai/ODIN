"use client";

import dynamic from "next/dynamic";

export const EntityGraphLazy = dynamic(
  () =>
    import("@/components/relationships/entity-graph").then((m) => m.EntityGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center text-sm text-zinc-500">
        Loading graph…
      </div>
    ),
  },
);
