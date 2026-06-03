import { loadCaseReportContext } from "@/lib/reports/build-context";
import { renderCaseReportPdf } from "@/lib/reports/case-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await loadCaseReportContext(id);

  if (!context) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderCaseReportPdf(context);

  const filename = `${context.caseData.title.replace(/[^a-z0-9]/gi, "_")}-case-report.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
