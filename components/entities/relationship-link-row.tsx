"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import { RelationshipDeleteButton } from "@/components/entities/relationship-delete-button";
import { updateRelationship } from "@/lib/actions/relationships";
import { confidenceBadgeStyle } from "@/lib/confidence";
import {
  effectiveRelationshipOutgoingLabel,
  inferInverseRelationshipLabel,
  relationshipMetaParts,
  relationshipValidity,
  type RelationshipTypeOption,
} from "@/lib/relationships/helpers";
import type {
  ConfidenceTypeDefinition,
  Entity,
  Relationship,
} from "@/lib/types";
import { defaultDateRangesValue } from "@/lib/types/dates";
import { migrateDateRangesValue } from "@/lib/date-range/migrate";

export function RelationshipLinkRow({
  relationship,
  viewerEntityId,
  viewerName,
  label,
  other,
  confidenceTypes,
  relationshipTypes,
}: {
  relationship: Relationship;
  viewerEntityId: string;
  viewerName: string;
  label: string;
  other: Entity | undefined;
  confidenceTypes: ConfidenceTypeDefinition[];
  relationshipTypes: RelationshipTypeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validity, setValidity] = useState(
    () => relationshipValidity(relationship) ?? defaultDateRangesValue(),
  );
  const [confidence, setConfidence] = useState(
    relationship.confidence ??
      relationship.provenance?.confidence ??
      "unsure",
  );
  const [outgoingLabel, setOutgoingLabel] = useState(
    () => relationship.label ?? "",
  );
  const [inverseLabel, setInverseLabel] = useState(
    () => relationship.inverseLabel ?? "",
  );

  const meta = relationshipMetaParts(relationship, confidenceTypes);
  const name = other?.displayName ?? "Unknown";
  const isOutgoing = relationship.fromEntityId === viewerEntityId;

  const typeDefaultOutgoing = useMemo(
    () =>
      effectiveRelationshipOutgoingLabel(
        relationship.type,
        relationshipTypes,
      ),
    [relationship.type, relationshipTypes],
  );

  const effectiveOutgoing =
    outgoingLabel.trim() || typeDefaultOutgoing;

  const suggestedInverse = useMemo(
    () => inferInverseRelationshipLabel(effectiveOutgoing),
    [effectiveOutgoing],
  );

  const resolvedInverse = inverseLabel.trim() || suggestedInverse;

  const outgoingPreview = isOutgoing
    ? `${effectiveOutgoing} ${name}`.replace(/\s+/g, " ").trim()
    : `${effectiveOutgoing} ${name}`.replace(/\s+/g, " ").trim();

  const inversePreview = (
    isOutgoing
      ? `${resolvedInverse} ${viewerName}`
      : `${resolvedInverse} ${name}`
  )
    .replace(/\s+/g, " ")
    .trim();

  function resetFormState() {
    setValidity(
      relationshipValidity(relationship) ??
        migrateDateRangesValue(relationship.validity),
    );
    setConfidence(
      relationship.confidence ??
        relationship.provenance?.confidence ??
        "unsure",
    );
    setOutgoingLabel(relationship.label ?? "");
    setInverseLabel(relationship.inverseLabel ?? "");
  }

  async function save() {
    setSaving(true);
    try {
      await updateRelationship(relationship.id, {
        validity,
        confidence,
        label: outgoingLabel,
        inverseLabel,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <span className="text-zinc-200">
          <span className="text-zinc-300">{label}</span>{" "}
          {other ? (
            <Link
              href={`/entities/${other.id}`}
              className="font-medium text-blue-400 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span>{name}</span>
          )}
        </span>
        {(meta.date || meta.confidenceLabel) && (
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {meta.date && <span>{meta.date}</span>}
            {meta.confidenceId && meta.confidenceLabel && (
              <span
                className="rounded px-1.5 py-0.5 font-medium"
                style={confidenceBadgeStyle(
                  meta.confidenceId,
                  confidenceTypes,
                )}
              >
                {meta.confidenceLabel}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) resetFormState();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-zinc-500">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-xs font-medium text-zinc-400">Wording</p>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">
                    Source profile (outgoing)
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    value={outgoingLabel}
                    onChange={(e) => setOutgoingLabel(e.target.value)}
                    placeholder={typeDefaultOutgoing}
                  />
                  <p className="text-xs text-zinc-600">
                    Empty = type default. Reads as:{" "}
                    <span className="text-zinc-400">{outgoingPreview}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-zinc-500">
                      Target profile (incoming)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-zinc-500"
                      onClick={() => setInverseLabel(suggestedInverse)}
                    >
                      Use suggested
                    </Button>
                  </div>
                  <Input
                    className="h-8 text-sm"
                    value={inverseLabel}
                    onChange={(e) => setInverseLabel(e.target.value)}
                    placeholder={suggestedInverse}
                  />
                  <p className="text-xs text-zinc-600">
                    Empty = suggested. Reads as:{" "}
                    <span className="text-zinc-400">{inversePreview}</span>
                  </p>
                </div>
              </div>
              <ConfidenceSelect
                value={confidence}
                onChange={setConfidence}
                confidenceTypes={confidenceTypes}
              />
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  When (date range)
                </p>
                <DateRangesFieldEditor
                  value={validity}
                  onChange={setValidity}
                  confidenceTypes={confidenceTypes}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" disabled={saving} onClick={save}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <RelationshipDeleteButton id={relationship.id} />
      </div>
    </li>
  );
}
