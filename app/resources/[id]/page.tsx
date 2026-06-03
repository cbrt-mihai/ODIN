import { notFound } from "next/navigation";
import { ReferenceItemDetail } from "@/components/reference/reference-item-detail";
import { ReferenceProvider } from "@/components/references/reference-context";
import { listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { getResourceById } from "@/lib/actions/resources";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resource, entities, cases] = await Promise.all([
    getResourceById(id),
    listEntities(),
    listCases(),
  ]);
  if (!resource) notFound();

  return (
    <ReferenceProvider entities={entities} cases={cases}>
      <ReferenceItemDetail
        item={resource}
        variant="resource"
        entities={entities}
      />
    </ReferenceProvider>
  );
}
