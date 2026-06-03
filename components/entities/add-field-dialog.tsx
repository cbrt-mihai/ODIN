"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import { FieldMetaPanel } from "@/components/entities/field-meta-panel";
import { FieldRenderer } from "@/components/entities/field-renderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmptyField } from "@/lib/entities/helpers";
import { FIELD_TYPE_HINTS } from "@/lib/entities/field-type-hints";
import { cn } from "@/lib/utils";
import type {
  ConfidenceTypeDefinition,
  Entity,
  Field,
  FieldTypeDefinition,
  FieldTypeId,
} from "@/lib/types";

export function AddFieldDialog({
  fieldTypes,
  confidenceTypes,
  entities,
  onAdd,
}: {
  fieldTypes: FieldTypeDefinition[];
  confidenceTypes: ConfidenceTypeDefinition[];
  entities: Entity[];
  onAdd: (field: Field) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FieldTypeId>("shortText");
  const [draft, setDraft] = useState<Field>(() => createEmptyField("shortText", ""));

  useEffect(() => {
    if (!open) return;
    setType("shortText");
    setDraft(createEmptyField("shortText", ""));
  }, [open]);

  function selectType(next: FieldTypeId) {
    setType(next);
    setDraft((prev) => {
      const label = prev.label;
      const nextField = createEmptyField(next, label);
      const ft = fieldTypes.find((f) => f.id === next);
      if (ft?.defaultTypeConfig) {
        nextField.typeConfig = ft.defaultTypeConfig;
      }
      return nextField;
    });
  }

  function handleAdd() {
    const label = draft.label.trim();
    if (!label) return;
    onAdd({ ...draft, label });
    setOpen(false);
  }

  const canAdd = draft.label.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Add field
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add field</DialogTitle>
          <DialogDescription>
            Choose what kind of data to store, give the field a name, then fill
            in the value and any evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Data type</Label>
            <p className="text-xs text-zinc-500">
              Describes the shape of the value — not the field name.
            </p>
            <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-lg border border-zinc-800/80 p-1.5 sm:grid-cols-2">
              {fieldTypes.map((ft) => {
                const selected = type === ft.id;
                const hint = FIELD_TYPE_HINTS[ft.id];
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => selectType(ft.id)}
                    className={cn(
                      "rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                        : "hover:bg-zinc-800/60",
                    )}
                  >
                    <span className="font-medium text-zinc-200">{ft.label}</span>
                    {hint && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                        {hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-field-name">Field name</Label>
            <Input
              id="add-field-name"
              value={draft.label}
              onChange={(e) =>
                setDraft((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="e.g. Work email, Last known address, Alias"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
              <FieldRenderer
                field={draft}
                entities={entities}
                onChange={setDraft}
                confidenceTypes={confidenceTypes}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Confidence</Label>
              <ConfidenceSelect
                value={draft.provenance.confidence}
                confidenceTypes={confidenceTypes}
                onChange={(confidence) =>
                  setDraft((f) => ({
                    ...f,
                    provenance: { ...f.provenance, confidence },
                  }))
                }
              />
            </div>
          </div>

          <FieldMetaPanel
            field={draft}
            onChange={setDraft}
            confidenceTypes={confidenceTypes}
            entities={entities}
            defaultExpanded
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canAdd}>
            Add field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
