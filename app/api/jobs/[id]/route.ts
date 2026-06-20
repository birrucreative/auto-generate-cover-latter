import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/upwork";
import { UpworkApiError } from "@/lib/upwork/graphql";

/** GET /api/jobs/:id → single normalized job, or 404. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const job = await getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    const message =
      err instanceof UpworkApiError ? err.message : "Failed to load job.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
