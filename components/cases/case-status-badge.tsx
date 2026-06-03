import type { Case } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  Case["status"],
  { variant: "default" | "outline"; className?: string }
> = {
  active: {
    variant: "default",
    className: "border-emerald-800/50 bg-emerald-950/50 text-emerald-200",
  },
  archived: {
    variant: "outline",
    className: "border-zinc-600 text-zinc-400",
  },
  closed: {
    variant: "outline",
    className: "border-amber-800/50 bg-amber-950/40 text-amber-200",
  },
};

export function CaseStatusBadge({
  status,
  className,
}: {
  status: Case["status"];
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <Badge
      variant={style.variant}
      className={cn("capitalize", style.className, className)}
    >
      {status}
    </Badge>
  );
}
