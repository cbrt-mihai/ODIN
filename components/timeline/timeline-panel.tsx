"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  HorizontalTimelineView,
  timelinePositionStyle,
  useHorizontalTimelineLayout,
} from "@/components/timeline/horizontal-timeline-view";
import { cn, formatDate } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

interface TimelinePanelProps {
  storageKey?: string;
  events: TimelineEvent[];
  onAdd: (input: {
    title: string;
    description?: string;
    occurredAt: string;
    endAt?: string;
    type?: string;
  }) => Promise<void>;
  onUpdate?: (
    eventId: string,
    input: {
      title: string;
      description?: string;
      occurredAt: string;
      endAt?: string;
      type?: string;
    },
  ) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  eventTypes?: string[];
}

export function TimelinePanel({
  storageKey = "timeline",
  events,
  onAdd,
  onUpdate,
  onDelete,
  eventTypes = [],
}: TimelinePanelProps) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [endAt, setEndAt] = useState("");
  const [type, setType] = useState(eventTypes[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editType, setEditType] = useState("");

  const layout = useHorizontalTimelineLayout(events);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        occurredAt: new Date(occurredAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        type: type || undefined,
      });
      setTitle("");
      setDescription("");
      setEndAt("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(ev: TimelineEvent) {
    setEditingId(ev.id);
    setEditTitle(ev.title);
    setEditDescription(ev.description ?? "");
    setEditOccurredAt(ev.occurredAt.slice(0, 16));
    setEditEndAt(ev.endAt?.slice(0, 16) ?? "");
    setEditType(ev.type ?? "");
  }

  async function saveEdit(eventId: string) {
    if (!onUpdate || !editTitle.trim()) return;
    setLoading(true);
    try {
      await onUpdate(eventId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        occurredAt: new Date(editOccurredAt).toISOString(),
        endAt: editEndAt ? new Date(editEndAt).toISOString() : undefined,
        type: editType || undefined,
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollapsibleCard
      id={storageKey}
      title="Timeline"
      contentClassName="space-y-6"
    >
      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-lg border border-zinc-800 p-4"
      >
        <div className="grid grid-cols-1 gap-3 @md/panel:grid-cols-2">
          <div className="space-y-1 @md/panel:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>End (optional)</Label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
          {eventTypes.length > 0 && (
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          Add event
        </Button>
      </form>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">No events yet.</p>
      ) : !layout ? null : (
        <HorizontalTimelineView
          laneCount={layout.laneCount}
          trackHeightRem={layout.trackHeightRem}
          trackMinWidthPx={layout.trackMinWidthPx}
          minLabel={layout.minLabel}
          maxLabel={layout.maxLabel}
        >
          {layout.items.map((ev) => {
            const pos = timelinePositionStyle(
              ev.startPct,
              ev.endPct,
              ev.lane,
              ev.stack,
              layout.stackCount,
              layout.laneHeightsRem,
              ev.isRange,
              ev.offsetPx,
            );

            if (editingId === ev.id && onUpdate) {
              return (
                <div
                  key={ev.id}
                  className="absolute z-20 w-56 space-y-2 rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-lg"
                  style={pos}
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    value={editOccurredAt}
                    onChange={(e) => setEditOccurredAt(e.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    value={editEndAt}
                    onChange={(e) => setEditEndAt(e.target.value)}
                    placeholder="End (optional)"
                  />
                  {eventTypes.length > 0 && (
                    <Select
                      value={editType || "_none"}
                      onValueChange={(v) =>
                        setEditType(v === "_none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">—</SelectItem>
                        {eventTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(ev.id)}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ev.id}
                className={cn(
                  "absolute z-10 rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1.5 text-xs shadow-sm",
                  ev.isRange
                    ? "min-w-[3rem] border-blue-800/60 bg-blue-950/40"
                    : "w-[11.5rem] shrink-0",
                )}
                style={pos}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">
                      {ev.title}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {formatDate(ev.occurredAt)}
                      {ev.endAt && ` – ${formatDate(ev.endAt)}`}
                      {ev.type && ` · ${ev.type}`}
                    </p>
                    {ev.description && (
                      <p className="mt-0.5 line-clamp-2 text-zinc-400">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {onUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEdit(ev)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: "Delete event",
                          description: `Remove timeline event "${ev.title}"?`,
                          confirmLabel: "Remove",
                          destructive: true,
                        });
                        if (!ok) return;
                        await onDelete(ev.id);
                        router.refresh();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </HorizontalTimelineView>
      )}
    </CollapsibleCard>
  );
}
