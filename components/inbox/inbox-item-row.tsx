"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  archiveInboxItem,
  deleteInboxItem,
  triageInboxItem,
  triageInboxToNewEntity,
} from "@/lib/actions/inbox";
import { APPENDABLE_INBOX_FIELD_TYPE_IDS } from "@/lib/inbox/appendable-field-types";
import type {
  Entity,
  EntityType,
  FieldTypeDefinition,
  FieldTypeId,
  InboxItem,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

type FieldMode = "existing" | "new";

export function InboxItemRow({
  item,
  entities,
  appendableFieldTypes,
  highlighted = false,
}: {
  item: InboxItem;
  entities: Entity[];
  appendableFieldTypes: FieldTypeDefinition[];
  highlighted?: boolean;
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [open, setOpen] = useState(false);
  const [entityId, setEntityId] = useState(item.suggestedEntityId ?? "");
  const [sectionId, setSectionId] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [fieldMode, setFieldMode] = useState<FieldMode>("existing");
  const [fieldLabel, setFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldTypeId>("longText");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<EntityType>("person");

  const triagedEntity = item.triagedTo?.entityId
    ? entities.find((e) => e.id === item.triagedTo?.entityId)
    : undefined;

  const entity = entities.find((e) => e.id === entityId);
  const sections = entity?.sections ?? [];
  const section = sections.find((s) => s.id === sectionId);
  const fields = (section?.fields ?? []).filter((f) =>
    APPENDABLE_INBOX_FIELD_TYPE_IDS.has(f.type),
  );

  const fieldOptions = useMemo(() => fields, [fields]);
  const selectedField = fieldOptions.find((f) => f.id === fieldId);

  useEffect(() => {
    if (fieldMode === "existing" && selectedField) {
      setFieldLabel(selectedField.label);
    }
  }, [fieldMode, selectedField?.id, selectedField?.label]);

  useEffect(() => {
    if (!sectionId) return;
    if (fieldOptions.length === 0) {
      setFieldMode("new");
      setFieldId("");
    } else if (fieldMode === "existing" && !fieldId) {
      setFieldId(fieldOptions[0].id);
    }
  }, [sectionId, fieldOptions, fieldMode, fieldId]);

  const canTriageExisting =
    !!entityId && !!sectionId && !!fieldId && !!fieldLabel.trim();
  const canTriageNew =
    !!entityId && !!sectionId && !!newFieldLabel.trim();

  async function triage() {
    if (!entityId || !sectionId) return;
    setLoading(true);
    try {
      if (fieldMode === "new") {
        await triageInboxItem(item.id, {
          entityId,
          sectionId,
          newField: { type: newFieldType, label: newFieldLabel.trim() },
        });
      } else {
        await triageInboxItem(item.id, {
          entityId,
          sectionId,
          fieldId,
          fieldLabel: fieldLabel.trim(),
        });
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <li
      id={`inbox-item-${item.id}`}
      className={`px-4 py-3${highlighted ? " bg-blue-950/30 ring-1 ring-inset ring-blue-800/50" : ""}`}
    >
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{formatDate(item.capturedAt)}</span>
      </div>
      <p className="mt-1 text-sm break-all">{item.content}</p>
      {item.notes && (
        <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>
      )}
      {triagedEntity && (
        <p className="mt-1 text-xs text-emerald-600">
          Triaged to{" "}
          <Link
            href={`/entities/${triagedEntity.id}`}
            className="underline hover:text-emerald-500"
          >
            {triagedEntity.displayName}
          </Link>
        </p>
      )}

      {item.status !== "pending" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {triagedEntity && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/entities/${triagedEntity.id}`}>View entity</Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400"
            onClick={async () => {
              const ok = await confirmDialog({
                title: "Delete inbox item",
                description: "Delete this inbox item?",
                confirmLabel: "Delete",
                destructive: true,
              });
              if (!ok) return;
              await deleteInboxItem(item.id);
              router.refresh();
            }}
          >
            Delete
          </Button>
        </div>
      )}

      {item.status === "pending" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
            {open ? "Cancel" : "Triage to field"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setCreateOpen(!createOpen);
              setOpen(false);
            }}
          >
            {createOpen ? "Cancel" : "New entity"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await archiveInboxItem(item.id);
              router.refresh();
            }}
          >
            Archive
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400"
            onClick={async () => {
              const ok = await confirmDialog({
                title: "Delete inbox item",
                description: "Delete this inbox item?",
                confirmLabel: "Delete",
                destructive: true,
              });
              if (!ok) return;
              await deleteInboxItem(item.id);
              router.refresh();
            }}
          >
            Delete
          </Button>
        </div>
      )}

      {createOpen && (
        <div className="mt-4 grid gap-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-4 max-w-lg">
          <div className="space-y-1">
            <Label>Display name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Entity name"
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={newType}
              onValueChange={(v) => setNewType(v as EntityType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={loading || !newName.trim()}
            onClick={async () => {
              setLoading(true);
              try {
                const ent = await triageInboxToNewEntity(item.id, {
                  type: newType,
                  displayName: newName.trim(),
                });
                setCreateOpen(false);
                router.push(`/entities/${ent.id}`);
                router.refresh();
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Creating…" : "Create & triage"}
          </Button>
        </div>
      )}

      {open && (
        <div className="mt-4 grid gap-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-4 max-w-lg">
          <div className="space-y-1">
            <Label>Entity</Label>
            <Select
              value={entityId}
              onValueChange={(v) => {
                setEntityId(v);
                setSectionId("");
                setFieldId("");
                setFieldMode("existing");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity…" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    [{e.type}] {e.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {entity && (
            <div className="space-y-1">
              <Label>Section</Label>
              <Select
                value={sectionId}
                onValueChange={(v) => {
                  setSectionId(v);
                  setFieldId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section…" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {section && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={fieldMode === "existing" ? "secondary" : "outline"}
                  disabled={fieldOptions.length === 0}
                  onClick={() => setFieldMode("existing")}
                >
                  Existing field
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={fieldMode === "new" ? "secondary" : "outline"}
                  onClick={() => {
                    setFieldMode("new");
                    setFieldId("");
                  }}
                >
                  New field
                </Button>
              </div>

              {fieldMode === "existing" ? (
                <>
                  <div className="space-y-1">
                    <Label>Field</Label>
                    <Select
                      value={fieldId}
                      onValueChange={(v) => {
                        setFieldId(v);
                        const f = fieldOptions.find((x) => x.id === v);
                        if (f) setFieldLabel(f.label);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label} ({f.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldId && (
                    <div className="space-y-1">
                      <Label>Field label</Label>
                      <Input
                        value={fieldLabel}
                        onChange={(e) => setFieldLabel(e.target.value)}
                        placeholder="Field name"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label>Field type</Label>
                    <Select
                      value={newFieldType}
                      onValueChange={(v) =>
                        setNewFieldType(v as FieldTypeId)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {appendableFieldTypes.map((ft) => (
                          <SelectItem key={ft.id} value={ft.id}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Field label</Label>
                    <Input
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. Research notes"
                    />
                  </div>
                </>
              )}
            </>
          )}
          <Button
            size="sm"
            onClick={triage}
            disabled={
              loading ||
              (fieldMode === "existing" ? !canTriageExisting : !canTriageNew)
            }
          >
            {loading ? "Appending…" : "Append to field"}
          </Button>
        </div>
      )}
    </li>
  );
}
