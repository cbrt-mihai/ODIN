"use server";

import { revalidatePath } from "next/cache";
import { saveSettings as persistSettings, getSettings } from "@/lib/storage";
import type { EntityType, Settings } from "@/lib/types";
import {
  inferInverseRelationshipLabel,
  slugFromRelationshipLabel,
} from "@/lib/relationships/helpers";

export async function saveSettings(settings: Settings) {
  await persistSettings(settings);
  revalidatePath("/settings");
  revalidatePath("/entities", "layout");
  revalidatePath("/graph");
}

export async function addRelationshipType(input: {
  label: string;
  inverseLabel?: string;
  fromTypes?: EntityType[];
  toTypes?: EntityType[];
}) {
  const label = input.label.trim();
  if (!label) throw new Error("Label required");

  const settings = await getSettings();
  let id = slugFromRelationshipLabel(label);
  if (settings.relationshipTypes.some((t) => t.id === id)) {
    id = `${id}_${Date.now().toString(36).slice(-4)}`;
  }

  const fromTypes = input.fromTypes ?? [
    "person",
    "organization",
    "domain",
    "general",
  ];
  const toTypes = input.toTypes ?? fromTypes;
  const inverseLabel =
    input.inverseLabel?.trim() ||
    inferInverseRelationshipLabel(label) ||
    undefined;

  const next: Settings = {
    ...settings,
    relationshipTypes: [
      ...settings.relationshipTypes,
      { id, label, inverseLabel, fromTypes, toTypes },
    ],
  };
  await persistSettings(next);
  revalidatePath("/settings");
  revalidatePath("/entities", "layout");
  return { id, label };
}
