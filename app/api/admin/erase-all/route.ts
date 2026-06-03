import { NextResponse } from "next/server";
import { eraseAllData } from "@/lib/actions/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== "ERASE ALL DATA") {
      return NextResponse.json(
        { error: "Invalid confirmation phrase" },
        { status: 400 },
      );
    }
    await eraseAllData();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erase failed" },
      { status: 500 },
    );
  }
}
