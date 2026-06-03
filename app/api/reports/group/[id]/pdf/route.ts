import { loadGroupReportContext } from "@/lib/reports/build-context";
import { renderGroupReportPdf } from "@/lib/reports/group-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await loadGroupReportContext(id);

  if (!context) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderGroupReportPdf(context);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${context.group.title.replace(/[^a-z0-9]/gi, "_")}-group-report.pdf"`,
    },
  });
}
