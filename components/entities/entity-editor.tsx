"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { Eye, GripVertical, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SortableList } from "@/components/ui/sortable-list";
import { PinEntityButton } from "./pin-entity-button";
import { EntityMembershipPanel } from "./entity-membership-panel";
import { AttachmentsPanel } from "./attachments-panel";
import { TagInput } from "@/components/ui/tag-input";
import { GalleryPanel } from "./gallery-panel";
import { AddFieldDialog } from "./add-field-dialog";
import { FieldRenderer } from "./field-renderer";
import { FieldTypeTransform } from "./field-type-transform";
import { EntityRecordPanel } from "./entity-record-panel";
import { FieldMetaChevron, FieldMetaPanel } from "./field-meta-panel";
import { normalizeEntity } from "@/lib/entities/normalize";
import { ConfidenceSelect } from "./confidence-select";
import { EntityTypeBadge } from "./entity-type-badge";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileImageField } from "@/components/profile/profile-image-field";
import {
  formatQualifiedName,
  getEntityIdentity,
  homonymCount,
} from "@/lib/entities/identity";
import {
  confidenceBadgeStyle,
  isDebunked,
} from "@/lib/confidence";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EntityItemSaveButton } from "@/components/entities/entity-item-save";
import { QuickEditButton } from "@/components/entities/quick-edit-button";
import {
  editFocusElementId,
  type EntityEditFocus,
} from "@/lib/entities/edit-focus";
import {
  fieldMetaSummary,
  hasProvenanceMeta,
} from "@/lib/entities/field-meta-summary";
import {
  deleteEntity,
  patchEntityField,
  setEntityArchived,
  updateEntity,
} from "@/lib/actions/entities";
import { isDirty } from "@/lib/entities/dirty";
import type {
  Case,
  ConfidenceTypeDefinition,
  Entity,
  Field,
  FieldTypeDefinition,
  Group,
  Section,
} from "@/lib/types";
import {
  distributeSectionsToColumns,
  readEntitySectionColumnCount,
  writeEntitySectionColumnCount,
  type SectionColumnCount,
} from "@/lib/ui/section-columns";
import { ArchiveToggleButton } from "@/components/archive/archive-toggle-button";
import { ArchivedBadge } from "@/components/archive/archived-badge";
import { isEntityArchived } from "@/lib/archive/status";

const sectionColumnGridClass: Record<SectionColumnCount, string> = {
  1: "",
  2: "grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2",
  3: "grid w-full grid-cols-1 items-start gap-4 md:grid-cols-3",
  4: "grid w-full grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4",
};

interface EntityEditorProps {
  entity: Entity;
  allEntities: Entity[];
  cases: Case[];
  groups: Group[];
  confidenceTypes: ConfidenceTypeDefinition[];
  fieldTypes: FieldTypeDefinition[];
  initialFocus?: EntityEditFocus | null;
  pinnedToDashboard?: boolean;
}

export function EntityEditor({
  entity: initial,
  allEntities,
  cases,
  groups,
  confidenceTypes,
  fieldTypes,
  initialFocus = null,
  pinnedToDashboard = false,
}: EntityEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [entity, setEntity] = useState(() =>
    normalizeEntity({
      ...initial,
      gallery: initial.gallery ?? [],
      galleryFolders: initial.galleryFolders ?? [],
      attachmentFolders: initial.attachmentFolders ?? [],
      attachments: initial.attachments ?? [],
      events: initial.events ?? [],
      tags: initial.tags ?? [],
      caseIds: initial.caseIds ?? [],
      groupIds: initial.groupIds ?? [],
    }),
  );
  const [baseline, setBaseline] = useState(() =>
    normalizeEntity({
      ...initial,
      gallery: initial.gallery ?? [],
      galleryFolders: initial.galleryFolders ?? [],
      attachmentFolders: initial.attachmentFolders ?? [],
      attachments: initial.attachments ?? [],
      events: initial.events ?? [],
      tags: initial.tags ?? [],
      caseIds: initial.caseIds ?? [],
      groupIds: initial.groupIds ?? [],
    }),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = normalizeEntity({
      ...initial,
      gallery: initial.gallery ?? [],
      galleryFolders: initial.galleryFolders ?? [],
      attachmentFolders: initial.attachmentFolders ?? [],
      attachments: initial.attachments ?? [],
      events: initial.events ?? [],
      tags: initial.tags ?? [],
      caseIds: initial.caseIds ?? [],
      groupIds: initial.groupIds ?? [],
    });
    setBaseline(next);
    setEntity(next);
  }, [initial.updatedAt, initial.id]);
  const [viewMode, setViewMode] = useState(true);
  const [reorderLayout, setReorderLayout] = useState(false);
  const [editFocus, setEditFocus] = useState<EntityEditFocus | null>(null);
  const [fieldMetaExpanded, setFieldMetaExpanded] = useState<
    Record<string, boolean>
  >({});
  const [sectionColumnCount, setSectionColumnCount] =
    useState<SectionColumnCount>(1);

  useEffect(() => {
    setSectionColumnCount(readEntitySectionColumnCount(initial.id));
  }, [initial.id]);

  const setSectionColumns = useCallback(
    (count: SectionColumnCount) => {
      setSectionColumnCount(count);
      writeEntitySectionColumnCount(entity.id, count);
    },
    [entity.id],
  );

  const quickEdit = useCallback((focus: EntityEditFocus) => {
    if (focus.target !== "membership") {
      setViewMode(false);
    }
    setEditFocus(focus);
    requestAnimationFrame(() => {
      document
        .getElementById(editFocusElementId(focus))
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  useEffect(() => {
    if (viewMode) setEditFocus(null);
  }, [viewMode]);

  useEffect(() => {
    if (!viewMode) setReorderLayout(false);
  }, [viewMode]);

  const dragEnabled = !viewMode || reorderLayout;

  useEffect(() => {
    if (!initialFocus) return;
    quickEdit(initialFocus);
  }, [initialFocus, quickEdit]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateEntity(entity);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [entity, router]);

  function updateSection(sectionId: string, patch: Partial<Section>) {
    setEntity((e) => ({
      ...e,
      sections: e.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s,
      ),
    }));
  }

  function updateField(sectionId: string, field: Field) {
    setEntity((e) => ({
      ...e,
      sections: e.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) => (f.id === field.id ? field : f)),
            }
          : s,
      ),
    }));
  }

  function addField(sectionId: string, field: Field) {
    setEntity((e) => ({
      ...e,
      sections: e.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                { ...field, order: s.fields.length },
              ],
            }
          : s,
      ),
    }));
  }

  async function removeField(sectionId: string, fieldId: string) {
    const section = entity.sections.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    const ok = await confirm({
      title: "Remove field",
      description: `Remove field "${field?.label ?? "Untitled"}"?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setEntity((e) => ({
      ...e,
      sections: e.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields
                .filter((f) => f.id !== fieldId)
                .map((f, i) => ({ ...f, order: i })),
            }
          : s,
      ),
    }));
  }

  function addSection() {
    setEntity((e) => ({
      ...e,
      sections: [
        ...e.sections,
        {
          id: uuidv4(),
          title: "New section",
          order: e.sections.length,
          fields: [],
        },
      ],
    }));
  }

  async function removeSection(sectionId: string) {
    const section = entity.sections.find((s) => s.id === sectionId);
    const ok = await confirm({
      title: "Remove section",
      description: `Remove section "${section?.title ?? "Untitled"}" and all its fields?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setEntity((e) => ({
      ...e,
      sections: e.sections
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i })),
    }));
  }

  async function persistLayoutOrder(sections: Section[]) {
    const next = { ...entity, sections };
    setSaving(true);
    try {
      await updateEntity(next);
      setEntity(next);
      setBaseline(next);
      toast.success("Layout saved");
      router.refresh();
    } catch {
      toast.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  }

  function reorderSections(ids: string[]) {
    const byId = new Map(entity.sections.map((s) => [s.id, s]));
    const sections = ids
      .map((id, order) => {
        const s = byId.get(id);
        return s ? { ...s, order } : null;
      })
      .filter(Boolean) as Section[];
    setEntity((e) => ({ ...e, sections }));
    if (reorderLayout) {
      void persistLayoutOrder(sections);
    }
  }

  function reorderFields(sectionId: string, ids: string[]) {
    const section = entity.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const byId = new Map(section.fields.map((f) => [f.id, f]));
    const fields = ids
      .map((id, order) => {
        const f = byId.get(id);
        return f ? { ...f, order } : null;
      })
      .filter(Boolean) as Field[];
    const sections = entity.sections.map((s) =>
      s.id === sectionId ? { ...s, fields } : s,
    );
    setEntity((e) => ({ ...e, sections }));
    if (reorderLayout) {
      void persistLayoutOrder(sections);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete entity",
      description: `Move "${entity.displayName}" to trash?`,
      confirmLabel: "Move to trash",
      destructive: true,
    });
    if (!ok) return;
    await deleteEntity(entity.id);
    router.push("/entities");
    router.refresh();
  }

  const sortedSections = [...entity.sections].sort((a, b) => a.order - b.order);
  const sectionIds = sortedSections.map((s) => s.id);
  const sectionColumns = useMemo(
    () => distributeSectionsToColumns(sectionIds, sectionColumnCount),
    [sectionIds, sectionColumnCount],
  );
  const useSectionColumns =
    sectionColumnCount > 1 && !reorderLayout;

  const entityIdentity = getEntityIdentity(entity, allEntities);
  const sameNameCount = homonymCount(entity, allEntities);
  const archived = isEntityArchived(entity);

  const enabledFieldTypes = fieldTypes.filter((f) => f.enabled);

  function renderSectionCard(
    section: Section,
    sectionHandle: ReactNode | null,
  ) {
    const fieldIds = [...section.fields]
      .sort((a, b) => a.order - b.order)
      .map((f) => f.id);
    const sectionFocused =
      editFocus?.target === "section" && editFocus.sectionId === section.id;

    return (
      <CollapsibleCard
        key={`${section.id}${sectionFocused ? "-focus" : ""}`}
        id={`section-${section.id}`}
        defaultOpen={!viewMode}
        forceOpen={sectionFocused || !viewMode}
        title={
          <span className="inline-flex items-center gap-2">
            {(reorderLayout || !viewMode) && sectionHandle}
            {viewMode ? (
              section.title
            ) : (
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSection(section.id, { title: e.target.value })
                }
                className="max-w-xs font-semibold"
              />
            )}
          </span>
        }
        actions={
          viewMode ? (
            <QuickEditButton
              label="Edit section"
              onClick={() =>
                quickEdit({ target: "section", sectionId: section.id })
              }
            />
          ) : (
            <>
              <AddFieldDialog
                fieldTypes={enabledFieldTypes}
                confidenceTypes={confidenceTypes}
                entities={allEntities}
                onAdd={(field) => addField(section.id, field)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSection(section.id)}
                title="Remove section"
              >
                <Trash2 className="h-4 w-4 text-zinc-500" />
              </Button>
            </>
          )
        }
      >
        {section.fields.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-zinc-800/80 bg-zinc-950/30 px-4 py-6">
            <p className="text-sm text-zinc-500">
              No fields yet. Add one with a name, value, and optional evidence.
            </p>
            {!viewMode && (
              <AddFieldDialog
                fieldTypes={enabledFieldTypes}
                confidenceTypes={confidenceTypes}
                entities={allEntities}
                onAdd={(field) => addField(section.id, field)}
              />
            )}
          </div>
        ) : (
          <SortableList
            ids={fieldIds}
            onReorder={(ids) => reorderFields(section.id, ids)}
            disabled={!dragEnabled}
            className="space-y-3"
          >
            {(fieldId, fieldHandle) => {
              const field = section.fields.find((f) => f.id === fieldId)!;
              const baselineSection = baseline.sections.find(
                (s) => s.id === section.id,
              );
              const baselineField = baselineSection?.fields.find(
                (f) => f.id === fieldId,
              );
              const fieldDirty =
                !viewMode && baselineField && isDirty(field, baselineField);
              const fieldFocused =
                editFocus?.target === "field" && editFocus.fieldId === field.id;
              const fieldHasProof = hasProvenanceMeta(field.provenance);
              const fieldMetaSummaryText = fieldMetaSummary(field);
              const showMetaToggle =
                !viewMode ||
                Boolean(fieldMetaSummaryText) ||
                fieldHasProof;
              const metaExpanded =
                fieldMetaExpanded[field.id] ?? (fieldFocused ? true : false);
              const debunked = isDebunked(
                field.provenance.confidence,
                confidenceTypes,
              );
              return (
                <div
                  key={field.id}
                  id={`field-${field.id}`}
                  className={cn(
                    fieldFocused && "ring-1 ring-emerald-500/40",
                    "rounded-lg border border-zinc-800/80 bg-zinc-900/20",
                    debunked && "opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/50 px-3 py-2">
                    {(reorderLayout || !viewMode) && fieldHandle}
                    {showMetaToggle && (
                      <FieldMetaChevron
                        expanded={metaExpanded}
                        onClick={() =>
                          setFieldMetaExpanded((prev) => ({
                            ...prev,
                            [field.id]: !metaExpanded,
                          }))
                        }
                      />
                    )}
                    {viewMode ? (
                      <span className="min-w-0 flex-1 font-medium text-zinc-200">
                        {field.label}
                      </span>
                    ) : (
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(section.id, {
                            ...field,
                            label: e.target.value,
                          })
                        }
                        className="h-8 max-w-[220px] flex-1 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0"
                        placeholder="Field name"
                      />
                    )}
                    {!viewMode ? (
                      <>
                        <FieldTypeTransform
                          field={field}
                          fieldTypes={enabledFieldTypes}
                          onTransform={(f) => updateField(section.id, f)}
                        />
                        <ConfidenceSelect
                          hideLabel
                          value={field.provenance.confidence}
                          confidenceTypes={confidenceTypes}
                          onChange={(confidence) =>
                            updateField(section.id, {
                              ...field,
                              provenance: {
                                ...field.provenance,
                                confidence,
                              },
                            })
                          }
                          className="w-[7.5rem] shrink-0"
                        />
                      </>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-xs",
                          debunked && "line-through",
                        )}
                        style={confidenceBadgeStyle(
                          field.provenance.confidence,
                          confidenceTypes,
                        )}
                      >
                        {confidenceTypes.find(
                          (c) => c.id === field.provenance.confidence,
                        )?.label ?? field.provenance.confidence}
                      </span>
                    )}
                    {viewMode && (
                      <>
                        <QuickEditButton
                          label="Edit field"
                          onClick={() =>
                            quickEdit({
                              target: "field",
                              sectionId: section.id,
                              fieldId: field.id,
                            })
                          }
                        />
                        {fieldHasProof && (
                          <QuickEditButton
                            label="Edit proof"
                            onClick={() =>
                              quickEdit({
                                target: "field",
                                sectionId: section.id,
                                fieldId: field.id,
                                metaTab: "proof",
                              })
                            }
                          />
                        )}
                      </>
                    )}
                    {!viewMode && (
                      <>
                        <EntityItemSaveButton
                          dirty={Boolean(fieldDirty)}
                          onSave={async () => {
                            await patchEntityField(
                              entity.id,
                              section.id,
                              field,
                            );
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeField(section.id, field.id)}
                          title="Remove field"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <FieldRenderer
                      field={field}
                      entities={allEntities}
                      cases={cases}
                      onChange={(f) => updateField(section.id, f)}
                      readOnly={viewMode}
                      confidenceTypes={confidenceTypes}
                    />
                    {showMetaToggle && (
                      <FieldMetaPanel
                        field={field}
                        onChange={(f) => updateField(section.id, f)}
                        readOnly={viewMode}
                        confidenceTypes={confidenceTypes}
                        entities={allEntities}
                        entityId={entity.id}
                        hideToggle
                        expanded={metaExpanded}
                        onExpandedChange={(open) =>
                          setFieldMetaExpanded((prev) => ({
                            ...prev,
                            [field.id]: open,
                          }))
                        }
                        defaultExpanded={fieldFocused}
                        defaultTab={
                          fieldFocused && editFocus?.target === "field"
                            ? editFocus.metaTab
                            : undefined
                        }
                        onQuickEdit={
                          viewMode
                            ? (metaTab) =>
                                quickEdit({
                                  target: "field",
                                  sectionId: section.id,
                                  fieldId: field.id,
                                  metaTab,
                                })
                            : undefined
                        }
                      />
                    )}
                  </div>
                </div>
              );
            }}
          </SortableList>
        )}
      </CollapsibleCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-zinc-800/60 pb-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-lg border border-zinc-800 p-0.5">
            <Button
              variant={reorderLayout ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setReorderLayout((v) => !v);
                setEditFocus(null);
              }}
              title="Reorder sections and fields without editing values"
            >
              <GripVertical className="h-4 w-4" />
              Reorder
            </Button>
            <Button
              variant={viewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode(true);
                setReorderLayout(false);
                setEditFocus(null);
              }}
              title="View mode"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button
              variant={!viewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode(false);
                setReorderLayout(false);
                setEditFocus(null);
              }}
              title="Edit mode"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <PinEntityButton
            entityId={entity.id}
            displayName={entity.displayName}
            initialPinned={pinnedToDashboard}
          />
          <ArchiveToggleButton
            archived={archived}
            onToggle={async (next) => {
              await setEntityArchived(entity.id, next);
              setEntity((current) => ({ ...current, archived: next }));
              setBaseline((current) => ({ ...current, archived: next }));
              router.refresh();
            }}
          />
          {!viewMode && (
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(14rem,auto)_minmax(0,1fr)] md:items-start">
          <div className="flex justify-center md:block">
            {viewMode ? (
              <ProfileAvatar
                profileImage={entity.profileImage}
                entityType={entity.type}
                size="xl"
                shape="square"
              />
            ) : (
              <ProfileImageField
                scope="entity"
                recordId={entity.id}
                value={entity.profileImage}
                onChange={(profileImage) =>
                  setEntity((x) => ({ ...x, profileImage }))
                }
                entityType={entity.type}
                gallery={entity.gallery}
                disabled={viewMode}
                layout="compact"
              />
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <EntityTypeBadge type={entity.type} />
            {viewMode ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {entityIdentity.isHomonym
                      ? entityIdentity.qualifiedName
                      : entity.displayName}
                  </h2>
                  {archived && <ArchivedBadge />}
                </div>
                <p className="truncate font-mono text-xs text-zinc-500">
                  @{entityIdentity.referenceSlug}
                </p>
                {archived && (
                  <p className="text-sm text-zinc-500">
                    This entity is archived and hidden from default lists.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="entity-display-name" className="text-xs text-zinc-500">
                    Display name
                  </Label>
                  <Input
                    id="entity-display-name"
                    value={entity.displayName}
                    onChange={(e) =>
                      setEntity((x) => ({ ...x, displayName: e.target.value }))
                    }
                    className="w-full max-w-2xl text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity-slug" className="text-xs text-zinc-500">
                    Slug (wikilinks)
                  </Label>
                  <Input
                    id="entity-slug"
                    value={entity.slug ?? ""}
                    onChange={(e) =>
                      setEntity((x) => ({ ...x, slug: e.target.value }))
                    }
                    placeholder="slug-for-wikilinks"
                    className="w-full max-w-xl text-sm"
                  />
                </div>
                {(sameNameCount > 0 || entity.disambiguator?.trim()) && (
                  <div className="max-w-2xl space-y-1">
                    <Label htmlFor="entity-disambiguator" className="text-xs">
                      Disambiguator
                    </Label>
                    <Input
                      id="entity-disambiguator"
                      value={entity.disambiguator ?? ""}
                      onChange={(e) =>
                        setEntity((x) => ({
                          ...x,
                          disambiguator: e.target.value,
                        }))
                      }
                      placeholder={
                        entityIdentity.disambiguator || "e.g. slug or city"
                      }
                      className="text-sm"
                    />
                    <p className="text-xs text-zinc-500">
                      Linking label:{" "}
                      {formatQualifiedName(
                        entity.displayName,
                        entity.disambiguator?.trim() ||
                          entityIdentity.disambiguator,
                        sameNameCount > 0,
                      )}{" "}
                      · @{entityIdentity.referenceSlug}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {sameNameCount > 0 && (
        <p className="rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          {sameNameCount + 1} records share the name &ldquo;{entity.displayName}
          &rdquo;. Set a disambiguator above and use @ paths (e.g. @
          {entityIdentity.referenceSlug}) in notes so mentions stay unambiguous.
        </p>
      )}

      <CollapsibleCard
        id="entity-tags"
        title="Entity tags"
        defaultOpen={false}
      >
        <p className="mb-2 text-xs text-zinc-600">
          Tags apply to the whole entity, not individual fields.
        </p>
        <TagInput
          tags={entity.tags ?? []}
          onChange={(tags) => setEntity((x) => ({ ...x, tags }))}
          disabled={viewMode}
        />
      </CollapsibleCard>

      <EntityRecordPanel
        entity={entity}
        entityId={entity.id}
        baselineEntity={baseline}
        onChange={setEntity}
        readOnly={viewMode}
        confidenceTypes={confidenceTypes}
        allEntities={allEntities}
        onQuickEdit={
          viewMode
            ? (tab) => quickEdit({ target: "record", tab })
            : undefined
        }
        focusOpen={editFocus?.target === "record"}
        focusTab={
          editFocus?.target === "record" ? editFocus.tab : undefined
        }
      />

      <EntityMembershipPanel
        entity={entity}
        cases={cases}
        groups={groups}
        readOnly={viewMode}
        onQuickEdit={
          viewMode
            ? () => quickEdit({ target: "membership" })
            : undefined
        }
        onDoneManage={() => setEditFocus(null)}
        focusOpen={editFocus?.target === "membership"}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-zinc-400">Sections</h3>
        <div className="flex flex-wrap items-center gap-2">
          {viewMode && !reorderLayout && (
            <p className="text-xs text-zinc-600">
              Use Reorder to drag sections and fields
            </p>
          )}
          {!reorderLayout && (
            <div
              className="flex rounded-lg border border-zinc-800 p-0.5"
              role="group"
              aria-label="Section columns"
            >
              {([1, 2, 3, 4] as const).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={sectionColumnCount === n ? "secondary" : "ghost"}
                  size="sm"
                  className="min-w-9 px-2"
                  onClick={() => setSectionColumns(n)}
                  title={`${n} column${n === 1 ? "" : "s"}`}
                >
                  {n}
                </Button>
              ))}
            </div>
          )}
          {!viewMode && (
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4" />
              New section
            </Button>
          )}
        </div>
      </div>

      {useSectionColumns ? (
        <div className={sectionColumnGridClass[sectionColumnCount]}>
          {sectionColumns.map((colSectionIds, colIndex) => (
            <div
              key={colIndex}
              className="flex w-full min-w-0 flex-col gap-4 self-start"
            >
              {colSectionIds.map((sectionId) => {
                const section = sortedSections.find((s) => s.id === sectionId)!;
                return renderSectionCard(section, null);
              })}
            </div>
          ))}
        </div>
      ) : (
      <SortableList
        ids={sectionIds}
        onReorder={reorderSections}
        disabled={!dragEnabled}
        className="space-y-4"
      >
        {(sectionId, sectionHandle) => {
          const section = sortedSections.find((s) => s.id === sectionId)!;
          return renderSectionCard(section, sectionHandle);
        }}
      </SortableList>
      )}

      {!viewMode && entity.sections.length === 0 && (
        <Button variant="outline" onClick={addSection}>
          <Plus className="h-4 w-4" />
          New section
        </Button>
      )}

      <GalleryPanel
        entity={entity}
        baselineEntity={baseline}
        readOnly={viewMode}
        confidenceTypes={confidenceTypes}
        entities={allEntities}
        onReorder={(gallery) => setEntity((e) => ({ ...e, gallery }))}
        onUpdateGallery={(gallery) => setEntity((e) => ({ ...e, gallery }))}
        onUpdateFolders={(galleryFolders) =>
          setEntity((e) => ({ ...e, galleryFolders }))
        }
      />
      <AttachmentsPanel
        entity={entity}
        baselineEntity={baseline}
        readOnly={viewMode}
        confidenceTypes={confidenceTypes}
        entities={allEntities}
        onReorder={(attachments) => setEntity((e) => ({ ...e, attachments }))}
        onUpdateAttachments={(attachments) =>
          setEntity((e) => ({ ...e, attachments }))
        }
        onUpdateFolders={(attachmentFolders) =>
          setEntity((e) => ({ ...e, attachmentFolders }))
        }
      />
    </div>
  );
}
