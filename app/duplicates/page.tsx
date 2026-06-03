import { DuplicatesReview } from "@/components/duplicates/duplicates-review";
import { scanWorkspaceDuplicates } from "@/lib/actions/duplicates";
import { entityTypeFilterOptions } from "@/lib/entities/entity-types";
import { getSettings } from "@/lib/storage";

export default async function DuplicatesPage() {
  const [clusters, settings] = await Promise.all([
    scanWorkspaceDuplicates(),
    getSettings(),
  ]);
  const entitiesInClusters = clusters.flatMap((c) => c.entities);
  const entityTypeOptions = entityTypeFilterOptions(
    settings,
    entitiesInClusters,
  );

  return (
    <DuplicatesReview
      clusters={clusters}
      entityTypeOptions={entityTypeOptions}
    />
  );
}
