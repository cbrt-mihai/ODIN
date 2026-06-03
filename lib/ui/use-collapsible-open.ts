"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readCollapsibleOpen,
  writeCollapsibleOpen,
} from "@/lib/ui/collapsible-persistence";

export function useCollapsibleOpen({
  storageKey,
  defaultOpen,
  forceOpen = false,
}: {
  storageKey?: string;
  defaultOpen: boolean;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!storageKey) return;
    const stored = readCollapsibleOpen(storageKey);
    if (stored !== undefined) setOpen(stored);
  }, [storageKey]);

  const setOpenPersisted = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setOpen((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (storageKey) writeCollapsibleOpen(storageKey, value);
        return value;
      });
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setOpenPersisted((prev) => !(forceOpen || prev));
  }, [forceOpen, setOpenPersisted]);

  return {
    open: forceOpen || open,
    setOpen: setOpenPersisted,
    toggle,
  };
}
