import { v4 as uuidv4 } from "uuid";
import type {
  FieldMergeChoice,
  MergeAnalysis,
  MergeSelections,
  SectionMergeStrategy,
  ValiditySide,
} from "@/lib/entities/merge-analysis";
import {
  defaultSecondarySectionTitle,
  fieldSideKey,
  sectionSideKey,
} from "@/lib/entities/merge-analysis";
import { normalizeProvenance } from "@/lib/proof/helpers";
import type { Entity, Field, Section } from "@/lib/types";

function filterProofs(
  provenance: Entity["provenance"],
  proofPrefix: string,
  selections: MergeSelections,
) {
  const base = normalizeProvenance(provenance);
  const proofs = (base.proofs ?? []).filter(
    (p) => selections.proofs[`${proofPrefix}${p.id}`] !== false,
  );
  return { ...base, proofs };
}

function validitySideForField(
  rowId: string,
  kind: "value" | "source",
  defaultSide: ValiditySide,
  selections: MergeSelections,
): ValiditySide {
  const map =
    kind === "value"
      ? selections.fieldValueValidity
      : selections.fieldSourceValidity;
  return map[rowId] ?? defaultSide;
}

function applyFieldSelections(
  field: Field,
  side: ValiditySide,
  selections: MergeSelections,
  options: {
    rowId?: string;
    pairedField?: Field;
    valueSide?: ValiditySide;
    sourceSide?: ValiditySide;
  },
): Field {
  const labelKey = fieldSideKey(side, field.id);
  const customLabel = selections.fieldLabels[labelKey]?.trim();
  let next: Field = {
    ...field,
    label: customLabel || field.label,
  };

  if (options.rowId && options.pairedField) {
    const valueSide = validitySideForField(
      options.rowId,
      "value",
      options.valueSide ?? side,
      selections,
    );
    const sourceSide = validitySideForField(
      options.rowId,
      "source",
      options.sourceSide ?? side,
      selections,
    );
    const primaryField = side === "primary" ? field : options.pairedField;
    const secondaryField = side === "secondary" ? field : options.pairedField;
    const valueSource = valueSide === "primary" ? primaryField : secondaryField;
    const sourceSource =
      sourceSide === "primary" ? primaryField : secondaryField;
    next = {
      ...next,
      value: { ...next.value, validity: valueSource.value.validity },
      provenance: {
        ...next.provenance,
        validity: sourceSource.provenance.validity,
      },
    };
  }

  return next;
}

function cloneField(
  field: Field,
  side: ValiditySide,
  proofPrefix: string,
  selections: MergeSelections,
  options: {
    newId?: string;
    rowId?: string;
    pairedField?: Field;
    valueSide?: ValiditySide;
    sourceSide?: ValiditySide;
  } = {},
): Field {
  const prepared = applyFieldSelections(field, side, selections, options);
  return {
    ...prepared,
    id: options.newId ?? field.id,
    provenance: filterProofs(prepared.provenance, proofPrefix, selections),
  };
}

function mergeFieldPair(
  rowId: string,
  primaryField: Field,
  secondaryField: Field,
  choice: FieldMergeChoice,
  selections: MergeSelections,
): Field[] {
  const primaryPrefix = `primary:field:${primaryField.id}:`;
  const secondaryPrefix = `secondary:field:${secondaryField.id}:`;

  if (choice === "exclude") return [];
  if (choice === "primary") {
    return [
      cloneField(primaryField, "primary", primaryPrefix, selections, {
        rowId,
        pairedField: secondaryField,
        valueSide: "primary",
        sourceSide: "primary",
      }),
    ];
  }
  if (choice === "secondary") {
    return [
      cloneField(secondaryField, "secondary", secondaryPrefix, selections, {
        newId: primaryField.id,
        rowId,
        pairedField: primaryField,
        valueSide: "secondary",
        sourceSide: "secondary",
      }),
    ];
  }
  return [
    cloneField(primaryField, "primary", primaryPrefix, selections, {
      rowId,
      pairedField: secondaryField,
      valueSide: "primary",
      sourceSide: "primary",
    }),
    cloneField(secondaryField, "secondary", secondaryPrefix, selections, {
      newId: uuidv4(),
      rowId,
      pairedField: primaryField,
      valueSide: "secondary",
      sourceSide: "secondary",
    }),
  ];
}

function mergeSectionFields(
  primarySec: Section | undefined,
  secondarySec: Section | undefined,
  strategy: SectionMergeStrategy,
  selections: MergeSelections,
  analysisFields: MergeAnalysis["sections"][0]["fields"],
): Field[] {
  if (strategy === "keep_primary") {
    return (primarySec?.fields ?? [])
      .map((f) => {
        const row = analysisFields.find((r) => r.primary?.id === f.id);
        const choice = row
          ? (selections.fieldChoices[row.id] ?? "primary")
          : "primary";
        if (choice === "exclude") return null;
        return cloneField(f, "primary", `primary:field:${f.id}:`, selections, {
          rowId: row?.id,
          pairedField: row?.secondary,
        });
      })
      .filter(Boolean) as Field[];
  }

  if (strategy === "use_secondary") {
    return (secondarySec?.fields ?? [])
      .map((f) => {
        const row = analysisFields.find((r) => r.secondary?.id === f.id);
        const choice = row
          ? (selections.fieldChoices[row.id] ?? "secondary")
          : "secondary";
        if (choice === "exclude") return null;
        return cloneField(
          f,
          "secondary",
          `secondary:field:${f.id}:`,
          selections,
          {
            newId: uuidv4(),
            rowId: row?.id,
            pairedField: row?.primary,
          },
        );
      })
      .filter(Boolean) as Field[];
  }

  const result: Field[] = [];
  for (const row of analysisFields) {
    const choice = selections.fieldChoices[row.id] ?? "primary";
    if (row.status === "both_same" || row.status === "both_differ") {
      if (row.primary && row.secondary) {
        result.push(
          ...mergeFieldPair(
            row.id,
            row.primary,
            row.secondary,
            choice,
            selections,
          ),
        );
      }
      continue;
    }
    if (row.status === "primary_only" && row.primary) {
      if (choice === "exclude") continue;
      result.push(
        cloneField(
          row.primary,
          "primary",
          `primary:field:${row.primary.id}:`,
          selections,
        ),
      );
      continue;
    }
    if (row.status === "secondary_only" && row.secondary) {
      if (choice === "exclude") continue;
      result.push(
        cloneField(
          row.secondary,
          "secondary",
          `secondary:field:${row.secondary.id}:`,
          selections,
          { newId: uuidv4() },
        ),
      );
    }
  }

  return result.map((f, i) => ({ ...f, order: i }));
}

function sectionTitle(
  sec: Section,
  side: ValiditySide,
  selections: MergeSelections,
  fallback?: string,
): string {
  const custom = selections.sectionTitles[sectionSideKey(side, sec.id)]?.trim();
  return custom || fallback || sec.title;
}

function cloneSection(
  sec: Section,
  fields: Field[],
  proofPrefix: string,
  selections: MergeSelections,
  options: { newId?: string; title?: string } = {},
): Section {
  return {
    ...sec,
    id: options.newId ?? sec.id,
    title: options.title ?? sec.title,
    fields,
    provenance: sec.provenance
      ? filterProofs(sec.provenance, proofPrefix, selections)
      : undefined,
  };
}

export function applyMergeSelections(
  primary: Entity,
  secondary: Entity,
  analysis: MergeAnalysis,
  selections: MergeSelections,
): Entity {
  const merged: Entity = JSON.parse(JSON.stringify(primary));

  merged.displayName =
    selections.displayName === "secondary"
      ? secondary.displayName
      : primary.displayName;

  const primarySlug = primary.slug?.trim();
  const secondarySlug = secondary.slug?.trim();
  if (selections.slug === "secondary" && secondarySlug) {
    merged.slug = secondarySlug;
  } else if (primarySlug) {
    merged.slug = primarySlug;
  } else {
    merged.slug = secondarySlug;
  }

  merged.tags = analysis.tagItems
    .filter((t) => selections.tags[t.id] !== false)
    .map((t) => t.label);

  const keptAliases = new Set(
    analysis.aliasItems
      .filter((a) => selections.aliases[a.id] !== false)
      .map((a) => a.label),
  );
  keptAliases.add(secondary.displayName);
  if (secondary.slug) keptAliases.add(secondary.slug);
  merged.aliases = [...keptAliases];

  const mergedSections: Section[] = [];

  for (const row of analysis.sections) {
    if (row.status === "primary_only" && row.primary) {
      if (selections.primarySections[row.primary.id] === false) continue;
      mergedSections.push(
        cloneSection(
          row.primary,
          mergeSectionFields(
            row.primary,
            undefined,
            "keep_primary",
            selections,
            row.fields,
          ),
          `primary:section:${row.primary.id}:`,
          selections,
          {
            title: sectionTitle(row.primary, "primary", selections),
          },
        ),
      );
      continue;
    }

    if (row.status === "secondary_only" && row.secondary) {
      const strategy =
        selections.secondarySections[row.secondary.id] ?? "use_secondary";
      if (strategy === "keep_primary") continue;
      mergedSections.push(
        cloneSection(
          row.secondary,
          mergeSectionFields(
            undefined,
            row.secondary,
            "use_secondary",
            selections,
            row.fields,
          ),
          `secondary:section:${row.secondary.id}:`,
          selections,
          {
            newId: uuidv4(),
            title: sectionTitle(row.secondary, "secondary", selections),
          },
        ),
      );
      continue;
    }

    if (row.primary && row.secondary) {
      const strategy =
        selections.secondarySections[row.secondary.id] ?? "merge_fields";

      if (strategy === "keep_both") {
        if (selections.primarySections[row.primary.id] !== false) {
          mergedSections.push(
            cloneSection(
              row.primary,
              mergeSectionFields(
                row.primary,
                undefined,
                "keep_primary",
                selections,
                row.fields,
              ),
              `primary:section:${row.primary.id}:`,
              selections,
              {
                title: sectionTitle(row.primary, "primary", selections),
              },
            ),
          );
        }
        mergedSections.push(
          cloneSection(
            row.secondary,
            mergeSectionFields(
              undefined,
              row.secondary,
              "use_secondary",
              selections,
              row.fields,
            ),
            `secondary:section:${row.secondary.id}:`,
            selections,
            {
              newId: uuidv4(),
              title: sectionTitle(
                row.secondary,
                "secondary",
                selections,
                defaultSecondarySectionTitle(row.title),
              ),
            },
          ),
        );
        continue;
      }

      if (selections.primarySections[row.primary.id] === false) {
        if (strategy === "keep_primary") continue;
        mergedSections.push(
          cloneSection(
            row.secondary,
            mergeSectionFields(
              undefined,
              row.secondary,
              "use_secondary",
              selections,
              row.fields,
            ),
            `secondary:section:${row.secondary.id}:`,
            selections,
            {
              newId: uuidv4(),
              title: sectionTitle(row.secondary, "secondary", selections),
            },
          ),
        );
        continue;
      }

      const fields = mergeSectionFields(
        row.primary,
        row.secondary,
        strategy,
        selections,
        row.fields,
      );

      const proofPrefix =
        strategy === "use_secondary"
          ? `secondary:section:${row.secondary.id}:`
          : `primary:section:${row.primary.id}:`;

      const titleSide = strategy === "use_secondary" ? "secondary" : "primary";
      const titleSection =
        strategy === "use_secondary" ? row.secondary : row.primary;

      mergedSections.push(
        cloneSection(
          strategy === "use_secondary" ? row.secondary : row.primary,
          fields,
          proofPrefix,
          selections,
          {
            newId: row.primary.id,
            title: sectionTitle(titleSection, titleSide, selections),
          },
        ),
      );
    }
  }

  merged.sections = mergedSections.map((s, i) => ({ ...s, order: i }));

  merged.provenance = filterProofs(
    merged.provenance,
    "primary:entity:",
    selections,
  );
  const secondaryProofs =
    filterProofs(secondary.provenance, "secondary:entity:", selections)
      .proofs ?? [];
  if (secondaryProofs.length > 0) {
    merged.provenance = {
      ...normalizeProvenance(merged.provenance),
      proofs: [
        ...(merged.provenance?.proofs ?? []),
        ...secondaryProofs.map((p, i) => ({
          ...p,
          id: uuidv4(),
          order: (merged.provenance?.proofs?.length ?? 0) + i,
        })),
      ],
    };
  }

  merged.gallery = [
    ...primary.gallery.filter(
      (g) => selections.gallery[`primary:${g.id}`] !== false,
    ),
    ...secondary.gallery
      .filter((g) => selections.gallery[`secondary:${g.id}`] !== false)
      .map((g) => ({ ...g, id: uuidv4() })),
  ];

  merged.attachments = [
    ...(primary.attachments ?? []).filter(
      (a) => selections.attachments[`primary:${a.id}`] !== false,
    ),
    ...(secondary.attachments ?? [])
      .filter((a) => selections.attachments[`secondary:${a.id}`] !== false)
      .map((a) => ({ ...a, id: uuidv4() })),
  ];

  merged.events = [
    ...primary.events.filter(
      (e) => selections.events[`primary:${e.id}`] !== false,
    ),
    ...secondary.events
      .filter((e) => selections.events[`secondary:${e.id}`] !== false)
      .map((e) => ({ ...e, id: uuidv4() })),
  ];

  merged.contextEntries = [
    ...(primary.contextEntries ?? []).filter(
      (e) => selections.contextEntries[`primary:${e.id}`] !== false,
    ),
    ...(secondary.contextEntries ?? [])
      .filter((e) => selections.contextEntries[`secondary:${e.id}`] !== false)
      .map((e) => ({ ...e, id: uuidv4() })),
  ];

  merged.noteEntries = [
    ...(primary.noteEntries ?? []).filter(
      (e) => selections.noteEntries[`primary:${e.id}`] !== false,
    ),
    ...(secondary.noteEntries ?? [])
      .filter((e) => selections.noteEntries[`secondary:${e.id}`] !== false)
      .map((e) => ({ ...e, id: uuidv4() })),
  ];

  merged.caseIds = [
    ...new Set([...(merged.caseIds ?? []), ...(secondary.caseIds ?? [])]),
  ];
  merged.groupIds = [
    ...new Set([...(merged.groupIds ?? []), ...(secondary.groupIds ?? [])]),
  ];

  return merged;
}
