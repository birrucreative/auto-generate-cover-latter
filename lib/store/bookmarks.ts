/**
 * File-backed bookmark store.
 *
 * Persists to ./.data/bookmarks.json. This is intentionally simple (no DB) so
 * the project runs with zero external services. Swap this module for a real
 * database later without touching callers — the interface is the contract.
 *
 * Server-only: uses the Node fs API.
 */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ApplicationStatus, Bookmark, Job } from "../types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "bookmarks.json");

/** Serialize all writes so concurrent requests can't corrupt the JSON file. */
let writeChain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Bookmark[]> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf);
    return Array.isArray(parsed) ? (parsed as Bookmark[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    // Corrupt file: don't crash the app, start fresh but keep a backup.
    try {
      await fs.rename(FILE, `${FILE}.corrupt-${Date.now()}`);
    } catch {
      /* best effort */
    }
    return [];
  }
}

async function writeAll(items: Bookmark[]): Promise<void> {
  const op = (async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
    await fs.rename(tmp, FILE); // atomic replace
  })();
  // Chain writes; swallow prior errors so one failure doesn't block the next.
  writeChain = writeChain.then(() => op, () => op);
  await op;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const all = await readAll();
  return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function isBookmarked(jobId: string): Promise<boolean> {
  const all = await readAll();
  return all.some((b) => b.job.id === jobId);
}

/** Add a job to bookmarks (idempotent). Returns the resulting bookmark. */
export async function addBookmark(
  job: Job,
  nowIso: string,
  note = ""
): Promise<Bookmark> {
  const all = await readAll();
  const existing = all.find((b) => b.job.id === job.id);
  if (existing) return existing;

  const bookmark: Bookmark = {
    job,
    status: "saved",
    note,
    savedAt: nowIso,
    updatedAt: nowIso,
  };
  all.push(bookmark);
  await writeAll(all);
  return bookmark;
}

export async function removeBookmark(jobId: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((b) => b.job.id !== jobId);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export interface BookmarkPatch {
  status?: ApplicationStatus;
  note?: string;
}

export async function updateBookmark(
  jobId: string,
  patch: BookmarkPatch,
  nowIso: string
): Promise<Bookmark | null> {
  const all = await readAll();
  const idx = all.findIndex((b) => b.job.id === jobId);
  if (idx === -1) return null;

  const updated: Bookmark = {
    ...all[idx],
    status: patch.status ?? all[idx].status,
    note: patch.note ?? all[idx].note,
    updatedAt: nowIso,
  };
  all[idx] = updated;
  await writeAll(all);
  return updated;
}
