import { getCaseById, listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { listResources } from "@/lib/actions/resources";
import { listTools } from "@/lib/actions/tools";
import { renderCaseReportPdf } from "@/lib/reports/case-pdf";
import { getSettings } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [
    caseData,
    entities,
    settings,
    relationships,
    playbooks,
    tools,
    resources,
    allCases,
  ] = await Promise.all([
    getCaseById(id),
    listEntities(),
    getSettings(),
    listRelationships(),
    listPlaybooks(),
    listTools(),
    listResources(),
    listCases(),
  ]);

  if (!caseData) {
    return new Response("Not found", { status: 404 });
  }

  const linked = entities.filter((e) => caseData.entityIds.includes(e.id));
  const linkedCases = allCases.filter((c) =>
    (caseData.linkedCaseIds ?? []).includes(c.id),
  );

  const buffer = await renderCaseReportPdf({
    caseData,
    linked,
    linkedCases,
    relationships,
    tools,
    resources,
    playbooks,
    allEntities: entities,
    settings,
  });

  const filename = `${caseData.title.replace(/[^a-z0-9]/gi, "_")}-case-report.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
