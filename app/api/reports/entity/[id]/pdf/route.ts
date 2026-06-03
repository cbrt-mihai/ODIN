import { getEntityById, listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { renderEntityReportPdf } from "@/lib/reports/entity-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [entity, relationships, allEntities] = await Promise.all([
    getEntityById(id),
    listRelationships(),
    listEntities(),
  ]);

  if (!entity) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderEntityReportPdf(
    entity,
    relationships,
    allEntities,
  );
  const filename = `${entity.displayName.replace(/[^a-z0-9]/gi, "_")}-report.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
