import { exportCaseZip } from "@/lib/storage/zip";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const buffer = await exportCaseZip(id);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="case-${id.slice(0, 8)}-export.zip"`,
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 404 },
    );
  }
}
