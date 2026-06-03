import { notFound } from "next/navigation";
import { ReferenceItemDetail } from "@/components/reference/reference-item-detail";
import { ReferenceProvider } from "@/components/references/reference-context";
import { listCases } from "@/lib/actions/cases";
import { getToolById } from "@/lib/actions/tools";
import { listEntities } from "@/lib/actions/entities";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tool, entities, cases] = await Promise.all([
    getToolById(id),
    listEntities(),
    listCases(),
  ]);
  if (!tool) notFound();

  return (
    <ReferenceProvider entities={entities} cases={cases}>
      <ReferenceItemDetail item={tool} variant="tool" entities={entities} />
    </ReferenceProvider>
  );
}
