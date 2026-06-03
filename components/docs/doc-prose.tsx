import { cn } from "@/lib/utils";

export function DocProse({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "doc-prose max-w-none text-sm text-zinc-300 leading-relaxed",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h2:first-child]:mt-0",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-200",
        "[&_p]:mb-3",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
        "[&_li]:text-zinc-400",
        "[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-300",
        "[&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-zinc-200",
        "[&_strong]:text-zinc-100 [&_strong]:font-medium",
        "[&_table]:w-full [&_table]:mb-4 [&_table]:text-xs [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-zinc-700 [&_th]:bg-zinc-900 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-zinc-300",
        "[&_td]:border [&_td]:border-zinc-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-zinc-400",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function DocLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href}>
      {children}
    </a>
  );
}
