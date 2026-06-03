"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntityItemSaveButton({
  dirty,
  onSave,
  className,
  label = "Save",
}: {
  dirty: boolean;
  onSave: () => Promise<void>;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn("h-7 gap-1.5 text-xs", className)}
      disabled={!dirty || saving}
      onClick={async () => {
        setSaving(true);
        try {
          await onSave();
          router.refresh();
        } finally {
          setSaving(false);
        }
      }}
    >
      <Save className="h-3 w-3" />
      {saving ? "Saving…" : label}
    </Button>
  );
}
