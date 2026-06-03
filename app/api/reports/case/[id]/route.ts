import { NextResponse } from "next/server";
import { loadCaseReportContext } from "@/lib/reports/build-context";
import { renderCaseReportHtml } from "@/lib/reports/case-html";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await loadCaseReportContext(id);

  if (!context) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = await renderCaseReportHtml(context);

  const filename = `case-${context.caseData.title.replace(/[^\w.-]+/g, "_")}-report.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
