"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { purgeTrashItem, restoreTrashItem } from "@/lib/actions/trash";
import type { TrashItemType } from "@/lib/types";

export function RestoreTrashButton({
  id,
  itemType,
}: {
  id: string;
  itemType: TrashItemType;
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await restoreTrashItem(id, itemType);
          router.refresh();
        }}
      >
        Restore
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={async () => {
          const ok = await confirmDialog({
            title: "Delete permanently",
            description: "Permanently delete? This cannot be undone.",
            confirmLabel: "Delete forever",
            destructive: true,
          });
          if (!ok) return;
          await purgeTrashItem(id, itemType);
          router.refresh();
        }}
      >
        Delete forever
      </Button>
    </div>
  );
}
