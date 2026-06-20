import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchJobs } from "@/lib/upwork";
import { RateLimitError, UpworkApiError } from "@/lib/upwork/graphql";
import {
  parseSearchParams,
  searchParamsToObject,
} from "@/lib/api/search-params";

/** Shared handler for GET (polling-friendly) and POST (rich body). */
async function handle(
  rawParams: unknown,
  opts: { includeFresh?: boolean }
): Promise<NextResponse> {
  try {
    const params = parseSearchParams(rawParams);
    const result = await searchJobs(params, opts);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", issues: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Upwork rate limit reached. Slow down polling and retry." },
        { status: 429 }
      );
    }
    if (err instanceof UpworkApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status ?? 502 }
      );
    }
    return NextResponse.json(
      { error: "Unexpected error while searching jobs." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const includeFresh = sp.get("includeFresh") === "true";
  return handle(searchParamsToObject(sp), { includeFresh });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty body is fine */
  }
  const includeFresh = body.includeFresh === true;
  return handle(body, { includeFresh });
}
