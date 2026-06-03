"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function InboxItemHighlight() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) return;
    const el = document.getElementById(`inbox-item-${itemId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams]);

  return null;
}
