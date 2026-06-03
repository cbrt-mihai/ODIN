import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-700 text-zinc-100",
        outline: "border-zinc-600 text-zinc-300",
        person: "border-blue-800/50 bg-blue-950/50 text-blue-200",
        organization:
          "border-purple-800/50 bg-purple-950/50 text-purple-200",
        domain: "border-emerald-800/50 bg-emerald-950/50 text-emerald-200",
        general: "border-zinc-600 bg-zinc-800 text-zinc-300",
        email: "border-pink-800/50 bg-pink-950/50 text-pink-200",
        phone: "border-sky-800/50 bg-sky-950/50 text-sky-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
