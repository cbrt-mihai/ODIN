"use client";

import { useState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ArchiveToggleButton({
  archived,
  onToggle,
  disabled,
}: {
  archived: boolean;
  onToggle: (archived: boolean) => Promise<void>;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onToggle(!archived);
        } finally {
          setLoading(false);
        }
      }}
    >
      {archived ? (
        <ArchiveRestore className="h-4 w-4" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
      {loading ? "Saving…" : archived ? "Unarchive" : "Archive"}
    </Button>
  );
}
