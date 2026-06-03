import { exportDataZip } from "@/lib/storage/zip";

export const runtime = "nodejs";

export async function GET() {
  const buffer = await exportDataZip();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="the-blacklist-export-${Date.now()}.zip"`,
    },
  });
}
