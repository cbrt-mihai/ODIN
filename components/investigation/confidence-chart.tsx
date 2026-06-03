import { BarChart } from "@/components/investigation/bar-chart";
import { confidenceCounts } from "@/lib/osint/extract-indicators";
import type { ConfidenceTypeDefinition, Entity } from "@/lib/types";

export function ConfidenceChart({
  entities,
  confidenceTypes,
}: {
  entities: Entity[];
  confidenceTypes: ConfidenceTypeDefinition[];
}) {
  const idToLabel = Object.fromEntries(
    confidenceTypes.map((c) => [c.id, c.label]),
  );
  const raw = confidenceCounts(entities, idToLabel);

  const items = confidenceTypes
    .map((ct) => ({
      label: ct.label,
      value: raw[ct.label] ?? 0,
      color: ct.color,
    }))
    .filter((i) => i.value > 0);

  const fieldTotal = items.reduce((s, i) => s + i.value, 0);

  if (fieldTotal === 0) {
    return (
      <p className="text-sm text-zinc-500">No fields with confidence set.</p>
    );
  }

  return (
    <div className="w-fit max-w-full space-y-2">
      <p className="text-xs text-zinc-500">
        {fieldTotal} field{fieldTotal === 1 ? "" : "s"} by confidence level
      </p>
      <BarChart items={items} />
    </div>
  );
}
