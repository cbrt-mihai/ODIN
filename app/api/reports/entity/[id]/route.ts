import { getEntityById, listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { renderEntityReportHtml } from "@/lib/reports/entity-html";

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

  const html = await renderEntityReportHtml(
    entity,
    relationships,
    allEntities,
  );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity.displayName.replace(/[^a-z0-9]/gi, "_")}-report.html"`,
    },
  });
}
