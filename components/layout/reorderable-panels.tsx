"use client";

import { useCallback, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { SortableList } from "@/components/ui/sortable-list";
import { Button } from "@/components/ui/button";
import {
  distributePanelsToColumns,
  readPanelColumnCount,
  writePanelColumnCount,
  type PanelColumnCount,
} from "@/lib/ui/panel-columns";
import {
  mergePanelOrder,
  readPanelOrder,
  writePanelOrder,
  type PanelScope,
} from "@/lib/ui/panel-order";
import { cn } from "@/lib/utils";

const columnGridClass: Record<PanelColumnCount, string> = {
  1: "",
  2: "grid w-full grid-cols-1 items-start gap-6 md:grid-cols-2",
  3: "grid w-full grid-cols-1 items-start gap-6 md:grid-cols-3",
  4: "grid w-full grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4",
};

/** Keeps panel content scoped to its column (timelines, graphs, nested grids). */
const panelSlotClass =
  "@container/panel w-full min-w-0 max-w-full overflow-hidden break-words";

export type PanelDef = {
  id: string;
  node: React.ReactNode;
  defaultOpen?: boolean;
};

export function ReorderablePanels({
  scope,
  panels,
  className,
}: {
  scope: PanelScope;
  panels: PanelDef[];
  className?: string;
}) {
  const panelMap = useMemo(
    () => new Map(panels.map((p) => [p.id, p.node])),
    [panels],
  );

  const defaultOrder = useMemo(() => panels.map((p) => p.id), [panels]);

  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultOrder;
    return mergePanelOrder(scope, readPanelOrder(scope)).filter((id) =>
      panelMap.has(id),
    );
  });

  const [columnCount, setColumnCount] = useState<PanelColumnCount>(() =>
    readPanelColumnCount(scope),
  );
  const [customize, setCustomize] = useState(false);

  const setColumns = useCallback(
    (count: PanelColumnCount) => {
      setColumnCount(count);
      writePanelColumnCount(scope, count);
    },
    [scope],
  );

  const persistOrder = useCallback(
    (ids: string[]) => {
      const merged = mergePanelOrder(scope, ids).filter((id) =>
        panelMap.has(id),
      );
      setOrder(merged);
      writePanelOrder(scope, merged);
    },
    [scope, panelMap],
  );

  const orderedIds = useMemo(() => {
    const merged = mergePanelOrder(scope, order).filter((id) =>
      panelMap.has(id),
    );
    for (const id of defaultOrder) {
      if (!merged.includes(id)) merged.push(id);
    }
    return merged;
  }, [scope, order, panelMap, defaultOrder]);

  const columns = useMemo(
    () => distributePanelsToColumns(orderedIds, columnCount),
    [orderedIds, columnCount],
  );

  if (orderedIds.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!customize && (
          <div
            className="flex rounded-lg border border-zinc-800 p-0.5"
            role="group"
            aria-label="Column count"
          >
            {([1, 2, 3, 4] as const).map((n) => (
              <Button
                key={n}
                type="button"
                variant={columnCount === n ? "secondary" : "ghost"}
                size="sm"
                className="min-w-9 px-2"
                onClick={() => setColumns(n)}
                title={`${n} column${n === 1 ? "" : "s"}`}
              >
                {n}
              </Button>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant={customize ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setCustomize((v) => !v)}
        >
          <LayoutGrid className="h-4 w-4" />
          {customize ? "Done customizing" : "Customize layout"}
        </Button>
      </div>
      {customize ? (
        <SortableList
          ids={orderedIds}
          onReorder={persistOrder}
          className="space-y-3"
        >
          {(id, handle) => (
            <div
              key={id}
              className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 p-2"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                {handle}
                <span className="capitalize">{id.replace(/-/g, " ")}</span>
              </div>
              {panelMap.get(id)}
            </div>
          )}
        </SortableList>
      ) : columnCount === 1 ? (
        <div className="space-y-6">
          {orderedIds.map((id) => (
            <div key={id} className={panelSlotClass}>
              {panelMap.get(id)}
            </div>
          ))}
        </div>
      ) : (
        <div className={columnGridClass[columnCount]}>
          {columns.map((colPanelIds, colIndex) => (
            <div
              key={colIndex}
              className="flex w-full min-w-0 flex-col gap-6 self-start"
            >
              {colPanelIds.map((id) => (
                <div key={id} className={panelSlotClass}>
                  {panelMap.get(id)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
