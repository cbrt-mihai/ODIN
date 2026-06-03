import { NextResponse } from "next/server";
import { getCase, saveCase } from "@/lib/storage";
import {
  clearProfileFile,
  saveProfileUpload,
} from "@/lib/uploads/profile-upload";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const caseData = await getCase(id);
    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const url = form.get("url") as string | null;

    if (url?.trim()) {
      await clearProfileFile(caseData.profileImage);
      caseData.profileImage = { source: "url", url: url.trim() };
      caseData.updatedAt = new Date().toISOString();
      await saveCase(caseData);
      return NextResponse.json({ profileImage: caseData.profileImage });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    caseData.profileImage = await saveProfileUpload(
      "case",
      id,
      file,
      caseData.profileImage,
    );
    caseData.updatedAt = new Date().toISOString();
    await saveCase(caseData);
    return NextResponse.json({ profileImage: caseData.profileImage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const caseData = await getCase(id);
  if (!caseData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await clearProfileFile(caseData.profileImage);
  caseData.profileImage = undefined;
  caseData.updatedAt = new Date().toISOString();
  await saveCase(caseData);
  return NextResponse.json({ ok: true });
}
