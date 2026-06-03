"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildListQuery,
  parseListParams,
  type ListFilterState,
} from "@/lib/list-filter/url-state";

export function useListFilters(defaults: ListFilterState = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const parsed = parseListParams(searchParams);
    return { ...defaults, ...parsed };
  }, [searchParams, defaults]);

  const setState = useCallback(
    (patch: Partial<ListFilterState> | ListFilterState, replace = false) => {
      const next = replace ? { ...defaults, ...patch } : { ...state, ...patch };
      const cleaned: ListFilterState = {};
      for (const [k, v] of Object.entries(next)) {
        if (v !== undefined && v !== "") cleaned[k] = v;
      }
      router.push(`${pathname}${buildListQuery(cleaned)}`, { scroll: false });
    },
    [router, pathname, state, defaults],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (state.q?.trim()) n++;
    if (state.tags?.trim()) n++;
    if (state.type && state.type !== "all") n++;
    if (state.status && state.status !== "all") n++;
    if (state.kind && state.kind !== "all") n++;
    if (state.category?.trim()) n++;
    if (state.minEntities?.trim()) n++;
    return n;
  }, [state]);

  return { state, setState, clearFilters, activeFilterCount };
}
