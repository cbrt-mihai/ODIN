"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { DateRangesFieldEditor } from "@/components/entities/date-ranges-field-editor";
import { ConfidenceSelect } from "@/components/entities/confidence-select";
import { createRelationship } from "@/lib/actions/relationships";
import { addRelationshipType } from "@/lib/actions/settings";
import {
  CUSTOM_RELATIONSHIP_VALUE,
  filterRelationshipTypes,
  inferInverseRelationshipLabel,
  previewInverseRelationshipPhrase,
  previewRelationshipPhrase,
  relationshipInverseDisplayLabel,
  slugFromRelationshipLabel,
  type RelationshipTypeOption,
} from "@/lib/relationships/helpers";
import {
  buildEntityIdentityMap,
  entityPickerLabel,
} from "@/lib/entities/identity";
import { defaultDateRangesValue } from "@/lib/types/dates";
import type {
  ConfidenceTypeDefinition,
  Entity,
  EntityType,
} from "@/lib/types";

export function AddRelationshipForm({
  entity,
  otherEntities,
  relationshipTypes,
  confidenceTypes,
}: {
  entity: Entity;
  otherEntities: Entity[];
  relationshipTypes: RelationshipTypeOption[];
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const router = useRouter();
  const [toId, setToId] = useState("");
  const [relType, setRelType] = useState(
    relationshipTypes[0]?.id ?? "associated_with",
  );
  const [customLabel, setCustomLabel] = useState("");
  const [customInverseLabel, setCustomInverseLabel] = useState("");
  const [overrideOutgoingLabel, setOverrideOutgoingLabel] = useState("");
  const [overrideInverseLabel, setOverrideInverseLabel] = useState("");
  const [customizeWording, setCustomizeWording] = useState(false);
  const [saveAsReusable, setSaveAsReusable] = useState(true);
  const [showWhen, setShowWhen] = useState(false);
  const [validity, setValidity] = useState(defaultDateRangesValue);
  const [confidence, setConfidence] = useState("unsure");
  const [loading, setLoading] = useState(false);

  const target = otherEntities.find((x) => x.id === toId);
  const isCustom = relType === CUSTOM_RELATIONSHIP_VALUE;

  const applicableTypes = useMemo(() => {
    if (!target) {
      return relationshipTypes.filter((t) =>
        t.fromTypes.includes(entity.type),
      );
    }
    return filterRelationshipTypes(
      relationshipTypes,
      entity.type,
      target.type as EntityType,
    );
  }, [relationshipTypes, entity.type, target]);

  const identityMap = useMemo(
    () => buildEntityIdentityMap([entity, ...otherEntities]),
    [entity, otherEntities],
  );

  const targetLabel = target
    ? (identityMap.get(target.id)?.qualifiedName ?? target.displayName)
    : undefined;

  const preview = previewRelationshipPhrase(
    relType,
    customLabel,
    relationshipTypes,
    targetLabel,
  );

  const presetOutgoingDefault = useMemo(() => {
    if (isCustom || !target) return "";
    return relationshipTypes.find((t) => t.id === relType)?.label ?? "";
  }, [isCustom, target, relType, relationshipTypes]);

  const presetSuggestedInverse = useMemo(() => {
    if (isCustom || !target) return "";
    const outgoing =
      overrideOutgoingLabel.trim() || presetOutgoingDefault;
    return inferInverseRelationshipLabel(outgoing);
  }, [
    isCustom,
    target,
    overrideOutgoingLabel,
    presetOutgoingDefault,
  ]);

  const inversePreview =
    target && relType !== CUSTOM_RELATIONSHIP_VALUE
      ? `${overrideInverseLabel.trim() || relationshipInverseDisplayLabel(relType, relationshipTypes, { outgoingOverride: overrideOutgoingLabel.trim() || undefined })} ${entity.displayName}`
          .replace(/\s+/g, " ")
          .trim()
      : target
        ? previewInverseRelationshipPhrase(
            relType,
            customLabel,
            customInverseLabel,
            relationshipTypes,
            entity.displayName,
          )
        : null;

  const suggestedInverse = useMemo(() => {
    if (!isCustom) {
      return relationshipInverseDisplayLabel(relType, relationshipTypes);
    }
    if (customInverseLabel.trim()) return customInverseLabel.trim();
    if (customLabel.trim()) return inferInverseRelationshipLabel(customLabel);
    return "";
  }, [
    isCustom,
    relType,
    relationshipTypes,
    customLabel,
    customInverseLabel,
  ]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!toId || !target) return;

    const labelText = isCustom ? customLabel.trim() : "";
    if (isCustom && !labelText) return;

    setLoading(true);
    try {
      let typeId = relType;
      let linkLabel: string | undefined;
      let linkInverseLabel: string | undefined;

      if (isCustom) {
        const inverse =
          customInverseLabel.trim() ||
          inferInverseRelationshipLabel(labelText);
        linkLabel = labelText;
        linkInverseLabel = inverse;
        if (saveAsReusable) {
          const added = await addRelationshipType({
            label: labelText,
            inverseLabel: inverse,
            fromTypes: [entity.type],
            toTypes: [target.type as EntityType],
          });
          typeId = added.id;
        } else {
          typeId = slugFromRelationshipLabel(labelText);
        }
      } else if (customizeWording) {
        if (overrideOutgoingLabel.trim()) {
          linkLabel = overrideOutgoingLabel.trim();
        }
        if (overrideInverseLabel.trim()) {
          linkInverseLabel = overrideInverseLabel.trim();
        } else if (overrideOutgoingLabel.trim()) {
          linkInverseLabel = inferInverseRelationshipLabel(
            overrideOutgoingLabel.trim(),
          );
        }
      }

      await createRelationship({
        fromEntityId: entity.id,
        toEntityId: target.id,
        fromType: entity.type,
        toType: target.type as EntityType,
        type: typeId,
        label: linkLabel,
        inverseLabel: linkInverseLabel,
        validity: showWhen ? validity : undefined,
        confidence,
      });

      setToId("");
      setCustomLabel("");
      setCustomInverseLabel("");
      setOverrideOutgoingLabel("");
      setOverrideInverseLabel("");
      setCustomizeWording(false);
      setValidity(defaultDateRangesValue());
      setConfidence("unsure");
      setShowWhen(false);
      setRelType(
        applicableTypes[0]?.id ??
          relationshipTypes[0]?.id ??
          "associated_with",
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[200px]">
          <Label>Relationship</Label>
          <Select
            value={relType}
            onValueChange={(v) => {
              setRelType(v);
              if (v !== CUSTOM_RELATIONSHIP_VALUE) {
                setCustomLabel("");
                setCustomInverseLabel("");
              }
              setOverrideOutgoingLabel("");
              setOverrideInverseLabel("");
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {applicableTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
              {applicableTypes.length === 0 &&
                relationshipTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              <SelectItem value={CUSTOM_RELATIONSHIP_VALUE}>
                Custom relationship…
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <>
            <div className="space-y-1 min-w-[200px] flex-1">
              <Label>Outgoing label</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder='e.g. Owns, Girlfriend of, Works for'
              />
            </div>
            <div className="space-y-1 min-w-[200px] flex-1">
              <Label>Incoming label (on their page)</Label>
              <Input
                value={customInverseLabel}
                onChange={(e) => setCustomInverseLabel(e.target.value)}
                placeholder={suggestedInverse || "e.g. Owned by, Employs"}
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label>Target entity</Label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select entity…" />
            </SelectTrigger>
            <SelectContent>
              {otherEntities.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {entityPickerLabel(e, identityMap)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || !toId || (isCustom && !customLabel.trim())}
        >
          Add link
        </Button>
      </div>

      {isCustom && (
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={saveAsReusable}
            onChange={(e) => setSaveAsReusable(e.target.checked)}
          />
          Save custom label as a reusable relationship type in Settings
        </label>
      )}

      {!isCustom && target && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={customizeWording}
              onChange={(e) => setCustomizeWording(e.target.checked)}
            />
            Customize wording for this link
          </label>
          {customizeWording && (
            <div className="grid gap-3 sm:grid-cols-2 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Outgoing label</Label>
                <Input
                  className="h-8 text-sm"
                  value={overrideOutgoingLabel}
                  onChange={(e) => setOverrideOutgoingLabel(e.target.value)}
                  placeholder={presetOutgoingDefault}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">
                  Incoming label (target page)
                </Label>
                <Input
                  className="h-8 text-sm"
                  value={overrideInverseLabel}
                  onChange={(e) => setOverrideInverseLabel(e.target.value)}
                  placeholder={presetSuggestedInverse}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={showWhen}
            onChange={(e) => setShowWhen(e.target.checked)}
          />
          Add date range and confirmation
        </label>
        {showWhen && (
          <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
            <ConfidenceSelect
              value={confidence}
              onChange={setConfidence}
              confidenceTypes={confidenceTypes}
            />
            <DateRangesFieldEditor
              value={validity}
              onChange={setValidity}
              confidenceTypes={confidenceTypes}
            />
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">On this page: </span>
          <span className="font-medium text-zinc-100">{preview}</span>
        </p>
        {inversePreview && (
          <p>
            <span className="text-zinc-500">On target page: </span>
            <span className="font-medium text-zinc-100">{inversePreview}</span>
          </p>
        )}
      </div>

      {target && applicableTypes.length === 0 && !isCustom && (
        <p className="text-xs text-amber-500/90">
          No preset types match this entity pair — use Custom relationship or
          add types in Settings.
        </p>
      )}

      <p className="text-xs text-zinc-600">
        Suggested inverses are generated automatically; override them when
        adding a link or via Edit on an existing link. Type defaults live in
        Settings.
      </p>
    </form>
  );
}
