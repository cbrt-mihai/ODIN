"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { deleteRelationship } from "@/lib/actions/relationships";

export function RelationshipDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-zinc-500"
      onClick={async () => {
        const ok = await confirmDialog({
          title: "Remove relationship",
          description: "Remove this relationship?",
          confirmLabel: "Remove",
          destructive: true,
        });
        if (!ok) return;
        await deleteRelationship(id);
        router.refresh();
      }}
    >
      Remove
    </Button>
  );
}
