"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function reorderIds(ids: string[], activeId: string, overId: string) {
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return ids;
  return arrayMove(ids, oldIndex, newIndex);
}

export function SortableList({
  ids,
  onReorder,
  disabled,
  children,
  className,
}: {
  ids: string[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  children: (id: string, handle: React.ReactNode) => React.ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(reorderIds(ids, String(active.id), String(over.id)));
  }

  if (disabled) {
    return <div className={className}>{ids.map((id) => children(id, null))}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ids.map((id) => (
            <SortableRow key={id} id={id}>
              {(handle) => children(id, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handle = (
    <span
      className="inline-flex cursor-grab touch-none rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </span>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-60")}
    >
      {children(handle)}
    </div>
  );
}
