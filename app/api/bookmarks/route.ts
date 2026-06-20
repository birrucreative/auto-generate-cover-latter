import { NextRequest, NextResponse } from "next/server";
import { addBookmark, listBookmarks } from "@/lib/store/bookmarks";
import type { Job } from "@/lib/types";

/** GET /api/bookmarks → all saved jobs (newest first). */
export async function GET() {
  const bookmarks = await listBookmarks();
  return NextResponse.json({ bookmarks });
}

/** POST /api/bookmarks  body: { job: Job, note?: string } → save a job. */
export async function POST(req: NextRequest) {
  let body: { job?: Job; note?: string };
  try {
    body = (await req.json()) as { job?: Job; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const job = body.job;
  if (!job || typeof job.id !== "string" || typeof job.title !== "string") {
    return NextResponse.json(
      { error: "Body must include a job with at least id and title." },
      { status: 400 }
    );
  }

  const bookmark = await addBookmark(job, new Date().toISOString(), body.note ?? "");
  return NextResponse.json({ bookmark }, { status: 201 });
}
