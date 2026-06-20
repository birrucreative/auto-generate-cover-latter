/**
 * Browser-side API client. Thin typed wrappers around the /api routes.
 * No secrets here — everything sensitive stays server-side.
 */

import type {
  ApplicationStatus,
  Bookmark,
  Job,
  JobSearchParams,
  JobSearchResult,
} from "../types";

export interface AuthStatus {
  demoMode: boolean;
  demoReason: string | null;
  credentialsConfigured: boolean;
  connected: boolean;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function asJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

/** Build a query string from search params, dropping empty values. */
function toQuery(params: JobSearchParams & { includeFresh?: boolean }): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "" || value === "all") continue;
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(","));
    } else {
      sp.set(key, String(value));
    }
  }
  return sp.toString();
}

export const api = {
  async authStatus(): Promise<AuthStatus> {
    return asJson<AuthStatus>(await fetch("/api/auth/status", { cache: "no-store" }));
  },

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
  },

  async search(
    params: JobSearchParams & { includeFresh?: boolean },
    signal?: AbortSignal
  ): Promise<JobSearchResult> {
    const qs = toQuery(params);
    return asJson<JobSearchResult>(
      await fetch(`/api/jobs/search?${qs}`, { cache: "no-store", signal })
    );
  },

  async listBookmarks(): Promise<Bookmark[]> {
    const data = await asJson<{ bookmarks: Bookmark[] }>(
      await fetch("/api/bookmarks", { cache: "no-store" })
    );
    return data.bookmarks;
  },

  async addBookmark(job: Job, note = ""): Promise<Bookmark> {
    const data = await asJson<{ bookmark: Bookmark }>(
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, note }),
      })
    );
    return data.bookmark;
  },

  async updateBookmark(
    id: string,
    patch: { status?: ApplicationStatus; note?: string }
  ): Promise<Bookmark> {
    const data = await asJson<{ bookmark: Bookmark }>(
      await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    );
    return data.bookmark;
  },

  async removeBookmark(id: string): Promise<void> {
    await asJson<{ ok: boolean }>(
      await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    );
  },

  /** Triggers a browser download of the export file. */
  async exportJobs(jobs: Job[], format: "csv" | "json"): Promise<void> {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs, format }),
    });
    if (!res.ok) {
      await asJson(res); // throws ApiError with the message
      return;
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match?.[1] ?? `upwork-jobs.${format}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
