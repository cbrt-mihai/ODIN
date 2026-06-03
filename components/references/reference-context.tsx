"use client";

import { createContext, useContext } from "react";
import type { Case, Entity } from "@/lib/types";

export type ReferenceCatalog = {
  entities: Entity[];
  cases: Case[];
};

const ReferenceCatalogContext = createContext<ReferenceCatalog | null>(null);

export function ReferenceProvider({
  entities,
  cases,
  children,
}: ReferenceCatalog & { children: React.ReactNode }) {
  return (
    <ReferenceCatalogContext.Provider value={{ entities, cases }}>
      {children}
    </ReferenceCatalogContext.Provider>
  );
}

export function useReferenceCatalog(
  fallback?: Partial<ReferenceCatalog>,
): ReferenceCatalog {
  const ctx = useContext(ReferenceCatalogContext);
  return {
    entities: fallback?.entities ?? ctx?.entities ?? [],
    cases: fallback?.cases ?? ctx?.cases ?? [],
  };
}
