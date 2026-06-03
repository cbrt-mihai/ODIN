import { NextResponse } from "next/server";
import { getGroup, saveGroup } from "@/lib/storage";
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
    const group = await getGroup(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const url = form.get("url") as string | null;

    if (url?.trim()) {
      await clearProfileFile(group.profileImage);
      group.profileImage = { source: "url", url: url.trim() };
      group.updatedAt = new Date().toISOString();
      await saveGroup(group);
      return NextResponse.json({ profileImage: group.profileImage });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    group.profileImage = await saveProfileUpload(
      "group",
      id,
      file,
      group.profileImage,
    );
    group.updatedAt = new Date().toISOString();
    await saveGroup(group);
    return NextResponse.json({ profileImage: group.profileImage });
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
  const group = await getGroup(id);
  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await clearProfileFile(group.profileImage);
  group.profileImage = undefined;
  group.updatedAt = new Date().toISOString();
  await saveGroup(group);
  return NextResponse.json({ ok: true });
}
