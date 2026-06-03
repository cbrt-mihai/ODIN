"use client";

import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SortableList } from "@/components/ui/sortable-list";
import { sortedEntityTypeDefinitions } from "@/lib/entities/entity-types";
import type { EntityType, Settings } from "@/lib/types";

export function AdvancedSettings({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  const confirmDialog = useConfirm();
  const [newRelLabel, setNewRelLabel] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [templateEntityType, setTemplateEntityType] =
    useState<EntityType>("person");

  const tpl = settings.entityTemplates.find(
    (t) => t.entityType === templateEntityType,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relationship types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            {settings.relationshipTypes.map((rt) => (
              <li key={rt.id} className="flex items-center gap-3">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-zinc-500">Outgoing</Label>
                    <Input
                      value={rt.label}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          relationshipTypes: settings.relationshipTypes.map(
                            (x) =>
                              x.id === rt.id
                                ? { ...x, label: e.target.value }
                                : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">
                      Incoming (target page)
                    </Label>
                    <Input
                      value={rt.inverseLabel ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          relationshipTypes: settings.relationshipTypes.map(
                            (x) =>
                              x.id === rt.id
                                ? {
                                    ...x,
                                    inverseLabel:
                                      e.target.value.trim() || undefined,
                                  }
                                : x,
                          ),
                        })
                      }
                      placeholder="e.g. Owned by, Employs"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-red-400"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Remove relationship type",
                      description: `Remove relationship type "${rt.label}"?`,
                      confirmLabel: "Remove",
                      destructive: true,
                    });
                    if (!ok) return;
                    onChange({
                      ...settings,
                      relationshipTypes: settings.relationshipTypes.filter(
                        (x) => x.id !== rt.id,
                      ),
                    });
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder='e.g. Girlfriend of, Works for'
              value={newRelLabel}
              onChange={(e) => setNewRelLabel(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!newRelLabel.trim()) return;
                const id = newRelLabel.trim().toLowerCase().replace(/\s+/g, "_");
                if (settings.relationshipTypes.some((x) => x.id === id)) return;
                onChange({
                  ...settings,
                  relationshipTypes: [
                    ...settings.relationshipTypes,
                    {
                      id,
                      label: newRelLabel.trim(),
                      fromTypes: [
                        "person",
                        "organization",
                        "domain",
                        "general",
                      ],
                      toTypes: [
                        "person",
                        "organization",
                        "domain",
                        "general",
                      ],
                    },
                  ],
                });
                setNewRelLabel("");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline event types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="flex flex-wrap gap-2">
            {settings.eventTypes.map((et) => (
              <li
                key={et}
                className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs"
              >
                {et}
                <button
                  type="button"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() =>
                    onChange({
                      ...settings,
                      eventTypes: settings.eventTypes.filter((x) => x !== et),
                    })
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. observation"
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const v = newEventType.trim().toLowerCase();
                if (!v || settings.eventTypes.includes(v)) return;
                onChange({
                  ...settings,
                  eventTypes: [...settings.eventTypes, v],
                });
                setNewEventType("");
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entity templates (sections)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <Label>Entity type</Label>
            <Select
              value={templateEntityType}
              onValueChange={(v) => setTemplateEntityType(v as EntityType)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedEntityTypeDefinitions(settings.entityTypes).map(
                  (d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          {!tpl ? (
            <p className="text-zinc-500">No template for this type.</p>
          ) : (
            <SortableList
              ids={tpl.sections.map((_, idx) => String(idx))}
              onReorder={(ids) => {
                const reordered = ids.map((id, order) => ({
                  ...tpl.sections[Number(id)]!,
                  order,
                }));
                onChange({
                  ...settings,
                  entityTemplates: settings.entityTemplates.map((t) =>
                    t.entityType === templateEntityType
                      ? { ...t, sections: reordered }
                      : t,
                  ),
                });
              }}
              className="space-y-2"
            >
              {(idxStr, handle) => {
                const idx = Number(idxStr);
                const sec = tpl.sections[idx];
                if (!sec) return null;
                return (
                <div key={idxStr} className="flex items-center gap-2">
                  {handle}
                  <Input
                    value={sec.title ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        entityTemplates: settings.entityTemplates.map((t) =>
                          t.entityType === templateEntityType
                            ? {
                                ...t,
                                sections: t.sections.map((s, i) =>
                                  i === idx
                                    ? { ...s, title: e.target.value }
                                    : s,
                                ),
                              }
                            : t,
                        ),
                      })
                    }
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-400"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: "Remove template section",
                        description: `Remove section "${sec.title ?? "Untitled"}" from template?`,
                        confirmLabel: "Remove",
                        destructive: true,
                      });
                      if (!ok) return;
                      onChange({
                        ...settings,
                        entityTemplates: settings.entityTemplates.map((t) =>
                          t.entityType === templateEntityType
                            ? {
                                ...t,
                                sections: t.sections
                                  .filter((_, i) => i !== idx)
                                  .map((s, order) => ({ ...s, order })),
                              }
                            : t,
                        ),
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
                );
              }}
            </SortableList>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="New section title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!tpl}
              onClick={() => {
                if (!newSectionTitle.trim() || !tpl) return;
                onChange({
                  ...settings,
                  entityTemplates: settings.entityTemplates.map((t) =>
                    t.entityType === templateEntityType
                      ? {
                          ...t,
                          sections: [
                            ...t.sections,
                            {
                              title: newSectionTitle.trim(),
                              order: t.sections.length,
                              fields: [],
                            },
                          ],
                        }
                      : t,
                  ),
                });
                setNewSectionTitle("");
              }}
            >
              Add section
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
