import { useMemo } from "react";
import { BarChart } from "@/components/investigation/bar-chart";
import {
  augmentEntityTypesForEntities,
  entityTypeColor,
  entityTypeLabel,
  sortedEntityTypeDefinitions,
} from "@/lib/entities/entity-types";
import { entityTypeCounts } from "@/lib/osint/extract-indicators";
import type { Entity, EntityTypeDefinition } from "@/lib/types";

export function EntityTypeChart({
  entities,
  entityTypes,
}: {
  entities: Entity[];
  entityTypes: EntityTypeDefinition[];
}) {
  const displayTypes = useMemo(
    () => augmentEntityTypesForEntities(entityTypes, entities),
    [entityTypes, entities],
  );
  const settingsSlice = { entityTypes: displayTypes };
  const counts = entityTypeCounts(entities);
  const seen = new Set<string>();

  const items = sortedEntityTypeDefinitions(displayTypes)
    .map((def) => {
      const value = counts[def.id] ?? 0;
      if (value > 0) seen.add(def.id);
      return {
        label: entityTypeLabel(def.id, settingsSlice),
        value,
        color: entityTypeColor(def.id, settingsSlice),
      };
    })
    .filter((i) => i.value > 0);

  for (const [type, value] of Object.entries(counts)) {
    if (value > 0 && !seen.has(type)) {
      items.push({
        label: entityTypeLabel(type, settingsSlice),
        value,
        color: entityTypeColor(type, settingsSlice),
      });
    }
  }

  return <BarChart items={items} emptyMessage="No entities in scope." />;
}
