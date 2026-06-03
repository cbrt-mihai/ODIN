"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
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
import { AdvancedSettings } from "@/components/settings/advanced-settings";
import { SettingsBackup } from "@/components/settings/settings-backup";
import { saveSettings } from "@/lib/actions/settings";
import {
  defaultEntityTemplateForType,
  hashEntityTypeColor,
  slugFromEntityTypeLabel,
  sortedEntityTypeDefinitions,
} from "@/lib/entities/entity-types";
import type { ConfidenceTypeDefinition, Settings } from "@/lib/types";

export function SettingsForm({ settings: initial }: { settings: Settings }) {
  const confirmDialog = useConfirm();
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [newConfLabel, setNewConfLabel] = useState("");
  const [newEntityTypeLabel, setNewEntityTypeLabel] = useState("");

  const sortedConfidence = [...settings.confidenceTypes].sort(
    (a, b) => a.order - b.order,
  );
  const confidenceIds = sortedConfidence.map((c) => c.id);

  function reorderConfidence(ids: string[]) {
    const byId = new Map(settings.confidenceTypes.map((c) => [c.id, c]));
    setSettings((s) => ({
      ...s,
      confidenceTypes: ids
        .map((id, order) => {
          const ct = byId.get(id);
          return ct ? { ...ct, order } : null;
        })
        .filter(Boolean) as ConfidenceTypeDefinition[],
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await saveSettings(settings);
    } finally {
      setSaving(false);
    }
  }

  function addConfidenceType() {
    if (!newConfLabel.trim()) return;
    const id = newConfLabel.trim().toLowerCase().replace(/\s+/g, "_");
    if (settings.confidenceTypes.some((c) => c.id === id)) return;
    const entry: ConfidenceTypeDefinition = {
      id,
      label: newConfLabel.trim(),
      color: "#94a3b8",
      order: settings.confidenceTypes.length,
    };
    setSettings((s) => ({
      ...s,
      confidenceTypes: [...s.confidenceTypes, entry],
    }));
    setNewConfLabel("");
  }

  function addEntityType() {
    const label = newEntityTypeLabel.trim();
    if (!label) return;
    let id = slugFromEntityTypeLabel(label);
    if (settings.entityTypes.some((d) => d.id === id)) {
      id = `${id}_${Date.now().toString(36).slice(-4)}`;
    }
    const order = settings.entityTypes.length;
    const entry = {
      id,
      label,
      enabled: true,
      order,
      color: hashEntityTypeColor(id),
    };
    setSettings((s) => ({
      ...s,
      entityTypes: [...s.entityTypes, entry],
      entityTemplates: [
        ...s.entityTemplates,
        defaultEntityTemplateForType(id, label),
      ],
    }));
    setNewEntityTypeLabel("");
  }

  async function removeEntityType(id: string, label: string) {
    const ok = await confirmDialog({
      title: "Remove entity type from catalog",
      description: `Remove "${label}" from settings? Existing entities keep this type; they will still display correctly.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setSettings((s) => ({
      ...s,
      entityTypes: s.entityTypes
        .filter((d) => d.id !== id)
        .map((d, order) => ({ ...d, order })),
    }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Mode</Label>
            <Select
              value={settings.theme.mode}
              onValueChange={(mode) =>
                setSettings((s) => ({
                  ...s,
                  theme: {
                    ...s.theme,
                    mode: mode as Settings["theme"]["mode"],
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entity types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-500">
            Add or remove types from your catalog. Disabled types are hidden from
            new-entity and filter pickers. Removing a type does not change
            existing entities — those profiles keep their type and still render
            with a generated label and color.
          </p>
          <ul className="space-y-2 text-sm">
            {sortedEntityTypeDefinitions(settings.entityTypes).map((et) => (
              <li
                key={et.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={et.enabled}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        entityTypes: s.entityTypes.map((x) =>
                          x.id === et.id
                            ? { ...x, enabled: e.target.checked }
                            : x,
                        ),
                      }))
                    }
                    aria-label={`Enable ${et.label}`}
                  />
                  <Input
                    value={et.label}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        entityTypes: s.entityTypes.map((x) =>
                          x.id === et.id ? { ...x, label: e.target.value } : x,
                        ),
                      }))
                    }
                    className="max-w-[160px]"
                  />
                  <input
                    type="color"
                    value={et.color ?? "#71717a"}
                    aria-label={`${et.label} color`}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        entityTypes: s.entityTypes.map((x) =>
                          x.id === et.id ? { ...x, color: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <span className="font-mono text-xs text-zinc-500">
                    {et.id}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-red-400"
                  onClick={() => removeEntityType(et.id, et.label)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="New type label (e.g. IP address)"
              value={newEntityTypeLabel}
              onChange={(e) => setNewEntityTypeLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEntityType();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addEntityType}
              disabled={!newEntityTypeLabel.trim()}
            >
              Add type
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Field types</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {settings.fieldTypes
              .sort((a, b) => a.order - b.order)
              .map((ft) => (
                <li key={ft.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={ft.enabled}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        fieldTypes: s.fieldTypes.map((x) =>
                          x.id === ft.id
                            ? { ...x, enabled: e.target.checked }
                            : x,
                        ),
                      }))
                    }
                  />
                  <span className="flex-1">{ft.label}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {ft.id}
                  </span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confidence types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-zinc-500">
            Drag to reorder. Order is used in proof panels and badges across the app.
          </p>
          <SortableList
            ids={confidenceIds}
            onReorder={reorderConfidence}
            className="space-y-2"
          >
            {(id, handle) => {
              const c = settings.confidenceTypes.find((x) => x.id === id)!;
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {handle}
                    <input
                      type="color"
                      value={c.color}
                      aria-label={`${c.label} color`}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          confidenceTypes: s.confidenceTypes.map((ct) =>
                            ct.id === c.id
                              ? { ...ct, color: e.target.value }
                              : ct,
                          ),
                        }))
                      }
                    />
                    <Input
                      value={c.label}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          confidenceTypes: s.confidenceTypes.map((ct) =>
                            ct.id === c.id
                              ? { ...ct, label: e.target.value }
                              : ct,
                          ),
                        }))
                      }
                      className="max-w-[140px]"
                    />
                    <span className="font-mono text-[10px] text-zinc-600">
                      {c.id}
                    </span>
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      <input
                        type="checkbox"
                        checked={c.isTerminal ?? false}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            confidenceTypes: s.confidenceTypes.map((ct) =>
                              ct.id === c.id
                                ? { ...ct, isTerminal: e.target.checked }
                                : ct,
                            ),
                          }))
                        }
                      />
                      Terminal
                    </label>
                    <Input
                      value={c.color}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          confidenceTypes: s.confidenceTypes.map((ct) =>
                            ct.id === c.id
                              ? { ...ct, color: e.target.value }
                              : ct,
                          ),
                        }))
                      }
                      className="max-w-[100px] font-mono text-xs"
                    />
                  </div>
                  {settings.confidenceTypes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-red-400"
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: "Remove confidence type",
                          description: `Remove "${c.label}"? Fields using it may show the raw id.`,
                          confirmLabel: "Remove",
                          destructive: true,
                        });
                        if (!ok) return;
                        setSettings((s) => ({
                          ...s,
                          confidenceTypes: s.confidenceTypes
                            .filter((ct) => ct.id !== c.id)
                            .map((ct, order) => ({ ...ct, order })),
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              );
            }}
          </SortableList>
          <div className="flex gap-2">
            <Input
              placeholder="New type label"
              value={newConfLabel}
              onChange={(e) => setNewConfLabel(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={addConfidenceType}>
              Add type
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdvancedSettings settings={settings} onChange={setSettings} />

      <SettingsBackup settings={settings} onImport={setSettings} />

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
