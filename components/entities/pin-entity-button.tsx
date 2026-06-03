"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveView } from "@/lib/actions/saved-views";

export function PinEntityButton({
  entityId,
  displayName,
  initialPinned = false,
}: {
  entityId: string;
  displayName: string;
  initialPinned?: boolean;
}) {
  const router = useRouter();
  const [pinned, setPinned] = useState(initialPinned);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPinned(initialPinned);
  }, [initialPinned]);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const next = !pinned;
          await saveView({
            name: displayName,
            page: "entities",
            filters: { entityId },
            pinned: next,
          });
          setPinned(next);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Star
        className={`h-4 w-4 ${pinned ? "fill-current text-amber-400" : ""}`}
      />
      {pinned ? "Unpin from dashboard" : "Pin to dashboard"}
    </Button>
  );
}
