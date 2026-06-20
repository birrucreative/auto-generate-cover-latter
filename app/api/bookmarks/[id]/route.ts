import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { removeBookmark, updateBookmark } from "@/lib/store/bookmarks";

const patchSchema = z.object({
  status: z
    .enum(["saved", "applied", "interviewing", "rejected", "hired"])
    .optional(),
  note: z.string().optional(),
});

/** PATCH /api/bookmarks/:id  body: { status?, note? } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid patch body." }, { status: 400 });
  }

  const updated = await updateBookmark(id, parsed, new Date().toISOString());
  if (!updated) {
    return NextResponse.json({ error: "Bookmark not found." }, { status: 404 });
  }
  return NextResponse.json({ bookmark: updated });
}

/** DELETE /api/bookmarks/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await removeBookmark(id);
  if (!removed) {
    return NextResponse.json({ error: "Bookmark not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
