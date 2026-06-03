import { cn } from "@/lib/utils";

export type BarChartItem = {
  label: string;
  value: number;
  color?: string;
  href?: string;
};

/** Fixed width so every row in a chart shares the same track length. */
const TRACK_CLASS =
  "h-2 w-44 max-w-full shrink-0 overflow-hidden rounded-full bg-zinc-800";

export function BarChart({
  items,
  className,
  emptyMessage = "No data.",
}: {
  items: BarChartItem[];
  className?: string;
  emptyMessage?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0);

  if (items.length === 0 || total === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  const labelNode = (item: BarChartItem) =>
    item.href ? (
      <a href={item.href} className="break-words hover:text-blue-400">
        {item.label}
      </a>
    ) : (
      <span className="break-words">{item.label}</span>
    );

  return (
    <ul
      className={cn(
        "grid w-fit max-w-full gap-x-3 gap-y-2.5",
        "[grid-template-columns:minmax(0,max-content)_auto]",
        className,
      )}
      role="list"
    >
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100);

        return (
          <li key={item.label} className="contents" role="listitem">
            <span
              className="min-w-0 self-center text-sm text-zinc-300"
              title={item.label}
            >
              {labelNode(item)}
            </span>
            <div className="flex items-center gap-1.5 self-center">
              <div className={TRACK_CLASS}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color ?? "#52525b",
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-zinc-400">
                {item.value}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
