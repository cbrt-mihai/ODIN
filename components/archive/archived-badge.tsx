import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ArchivedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-zinc-600 text-zinc-400", className)}
    >
      Archived
    </Badge>
  );
}
