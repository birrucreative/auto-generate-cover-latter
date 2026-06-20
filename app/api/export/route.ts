import { NextRequest, NextResponse } from "next/server";
import { buildExport, type ExportFormat } from "@/lib/export";
import type { Job } from "@/lib/types";

/**
 * POST /api/export  body: { jobs: Job[], format: "csv" | "json" }
 * → streams a downloadable file with the proper Content-Disposition.
 */
export async function POST(req: NextRequest) {
  let body: { jobs?: Job[]; format?: ExportFormat };
  try {
    body = (await req.json()) as { jobs?: Job[]; format?: ExportFormat };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const jobs = Array.isArray(body.jobs) ? body.jobs : [];
  if (jobs.length === 0) {
    return NextResponse.json({ error: "No jobs to export." }, { status: 400 });
  }
  const format: ExportFormat = body.format === "json" ? "json" : "csv";

  const payload = buildExport(jobs, format, new Date().toISOString());

  return new NextResponse(payload.body, {
    status: 200,
    headers: {
      "Content-Type": payload.contentType,
      "Content-Disposition": `attachment; filename="${payload.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
