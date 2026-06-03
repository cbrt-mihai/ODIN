import { NextResponse } from "next/server";
import { getCaseById, listCases } from "@/lib/actions/cases";
import { listEntities } from "@/lib/actions/entities";
import { listRelationships } from "@/lib/actions/relationships";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { listResources } from "@/lib/actions/resources";
import { listTools } from "@/lib/actions/tools";
import { renderCaseReportHtml } from "@/lib/reports/case-html";
import { getSettings } from "@/lib/storage";

export async function GET(
  _req: Request,
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const linked = entities.filter((e) => caseData.entityIds.includes(e.id));
  const linkedCases = allCases.filter((c) =>
    (caseData.linkedCaseIds ?? []).includes(c.id),
  );

  const html = await renderCaseReportHtml({
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

  const filename = `case-${caseData.title.replace(/[^\w.-]+/g, "_")}-report.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
