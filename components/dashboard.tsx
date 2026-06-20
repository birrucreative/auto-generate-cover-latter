"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Bookmark as BookmarkIcon,
  FileDown,
  FileJson,
  Loader2,
  SearchX,
} from "lucide-react";
import type {
  ApplicationStatus,
  Bookmark,
  Job,
  JobSearchResult,
} from "@/lib/types";
import { diffJobs } from "@/lib/polling";
import { api, ApiError, type AuthStatus } from "@/lib/client/api";
import { SiteHeader } from "@/components/site-header";
import {
  DEFAULT_FILTERS,
  FiltersBar,
  type FilterState,
  toSearchParams,
} from "@/components/filters-bar";
import { JobCard } from "@/components/job-card";
import { MotionGrid, MotionItem } from "@/components/motion-grid";
import { JobDetailsDialog } from "@/components/job-details-dialog";
import { BookmarksView } from "@/components/bookmarks-view";
import { AutoRefresh } from "@/components/auto-refresh";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Dashboard() {
  const [auth, setAuth] = React.useState<AuthStatus | null>(null);
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);

  const [result, setResult] = React.useState<JobSearchResult | null>(null);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const bookmarkedIds = React.useMemo(
    () => new Set(bookmarks.map((b) => b.job.id)),
    [bookmarks]
  );

  const [detailJob, setDetailJob] = React.useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"results" | "saved">("results");

  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [intervalSec, setIntervalSec] = React.useState(60);
  const [polling, setPolling] = React.useState(false);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());

  // Track every job id we've shown so polling can detect genuinely-new posts.
  const seenIds = React.useRef<Set<string>>(new Set());
  // Always-current filters for the polling interval closure.
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  /* ───────────────────────── initial load ───────────────────────── */

  const runSearch = React.useCallback(async (f: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.search(toSearchParams(f));
      seenIds.current = new Set(res.jobs.map((j) => j.id));
      setNewIds(new Set());
      setResult(res);
      setJobs(res.jobs);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Search failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        const [status] = await Promise.all([api.authStatus(), refreshBookmarks()]);
        setAuth(status);
      } catch {
        /* status is best-effort */
      }
      await runSearch(DEFAULT_FILTERS);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────────────────────── pagination ───────────────────────── */

  const loadMore = async () => {
    if (!result?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.search({
        ...toSearchParams(filters),
        cursor: result.nextCursor,
      });
      res.jobs.forEach((j) => seenIds.current.add(j.id));
      setResult(res);
      setJobs((prev) => dedupe([...prev, ...res.jobs]));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load more.";
      toast.error(msg);
    } finally {
      setLoadingMore(false);
    }
  };

  /* ───────────────────────── polling ───────────────────────── */

  React.useEffect(() => {
    if (!autoRefresh) {
      setPolling(false);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      setPolling(true);
      try {
        const res = await api.search({
          ...toSearchParams(filtersRef.current),
          includeFresh: true,
        });
        if (cancelled) return;
        const { newJobs } = diffJobs(res.jobs, seenIds.current);
        if (newJobs.length > 0) {
          newJobs.forEach((j) => seenIds.current.add(j.id));
          setNewIds((prev) => {
            const next = new Set(prev);
            newJobs.forEach((j) => next.add(j.id));
            return next;
          });
          setJobs((prev) => dedupe([...newJobs, ...prev]));
          setResult((r) => (r ? { ...r, fetchedAt: res.fetchedAt } : res));
          toast.success(
            `${newJobs.length} new ${newJobs.length === 1 ? "job" : "jobs"} found`,
            { icon: "✨" }
          );
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          toast.error("Rate limit reached — slowing down. Try a longer interval.");
        }
      } finally {
        if (!cancelled) setPolling(false);
      }
    };
    const id = setInterval(tick, intervalSec * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [autoRefresh, intervalSec]);

  /* ───────────────────────── bookmarks ───────────────────────── */

  async function refreshBookmarks() {
    try {
      setBookmarks(await api.listBookmarks());
    } catch {
      /* non-fatal */
    }
  }

  const toggleBookmark = async (job: Job) => {
    const exists = bookmarkedIds.has(job.id);
    try {
      if (exists) {
        setBookmarks((prev) => prev.filter((b) => b.job.id !== job.id));
        await api.removeBookmark(job.id);
        toast("Removed from saved");
      } else {
        const bookmark = await api.addBookmark(job);
        setBookmarks((prev) => [bookmark, ...prev]);
        toast.success("Saved", { icon: "🔖" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not update bookmark.";
      toast.error(msg);
      void refreshBookmarks();
    }
  };

  const changeStatus = async (id: string, status: ApplicationStatus) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.job.id === id ? { ...b, status } : b))
    );
    try {
      await api.updateBookmark(id, { status });
    } catch {
      toast.error("Failed to update status");
      void refreshBookmarks();
    }
  };

  const changeNote = async (id: string, note: string) => {
    try {
      await api.updateBookmark(id, { note });
      setBookmarks((prev) =>
        prev.map((b) => (b.job.id === id ? { ...b, note } : b))
      );
      toast.success("Note saved", { duration: 1500 });
    } catch {
      toast.error("Failed to save note");
    }
  };

  const removeBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.job.id !== id));
    try {
      await api.removeBookmark(id);
    } catch {
      void refreshBookmarks();
    }
  };

  /* ───────────────────────── export ───────────────────────── */

  const exportData = async (data: Job[], format: "csv" | "json", what: string) => {
    if (data.length === 0) {
      toast.error(`No ${what} to export`);
      return;
    }
    try {
      await api.exportJobs(data, format);
      toast.success(`Exported ${data.length} ${what} as ${format.toUpperCase()}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Export failed.";
      toast.error(msg);
    }
  };

  /* ───────────────────────── auth ───────────────────────── */

  const handleLogout = async () => {
    await api.logout();
    const status = await api.authStatus();
    setAuth(status);
    toast("Disconnected from Upwork");
    void runSearch(filters);
  };

  const openDetails = (job: Job) => {
    setDetailJob(job);
    setDetailOpen(true);
  };

  /* ───────────────────────── render ───────────────────────── */

  const newCount = newIds.size;

  return (
    <div className="min-h-screen">
      <SiteHeader auth={auth} source={result?.source ?? null} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">
        {/* Editorial intro */}
        <div className="mb-6 max-w-2xl">
          <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            Find your next contract.
          </h2>
          <p className="mt-1.5 text-muted-foreground">
            Search the Upwork marketplace through the official API — filter, watch
            for fresh posts, save the best, and export your shortlist.
          </p>
        </div>

        <FiltersBar
          value={filters}
          onChange={setFilters}
          onSearch={() => runSearch(filters)}
          busy={loading}
        />

        {/* Toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="results" className="gap-1.5">
                Results
                {result?.total != null && (
                  <span className="text-xs text-muted-foreground tabular">
                    {result.total}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-1.5">
                <BookmarkIcon className="size-3.5" />
                Saved
                {bookmarks.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular">
                    {bookmarks.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-2">
            {tab === "results" && (
              <>
                <AutoRefresh
                  enabled={autoRefresh}
                  intervalSec={intervalSec}
                  polling={polling}
                  onToggle={setAutoRefresh}
                  onIntervalChange={setIntervalSec}
                />
                <ExportMenu
                  onExport={(fmt) => exportData(jobs, fmt, "results")}
                  disabled={jobs.length === 0}
                />
              </>
            )}
          </div>
        </div>

        {/* New-jobs banner */}
        {tab === "results" && newCount > 0 && (
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setNewIds(new Set());
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            ✨ {newCount} new {newCount === 1 ? "job" : "jobs"} arrived — dismiss
          </button>
        )}

        {/* Content */}
        <div className="mt-5">
          {tab === "results" ? (
            <ResultsArea
              loading={loading}
              error={error}
              jobs={jobs}
              result={result}
              newIds={newIds}
              bookmarkedIds={bookmarkedIds}
              loadingMore={loadingMore}
              onRetry={() => runSearch(filters)}
              onResetFilters={() => {
                setFilters(DEFAULT_FILTERS);
                void runSearch(DEFAULT_FILTERS);
              }}
              onToggleBookmark={toggleBookmark}
              onOpenDetails={openDetails}
              onLoadMore={loadMore}
            />
          ) : (
            <BookmarksView
              bookmarks={bookmarks}
              onChangeStatus={changeStatus}
              onChangeNote={changeNote}
              onRemove={removeBookmark}
              onExport={() =>
                exportData(
                  bookmarks.map((b) => b.job),
                  "csv",
                  "saved jobs"
                )
              }
            />
          )}
        </div>
      </main>

      <JobDetailsDialog
        job={detailJob}
        open={detailOpen}
        bookmarked={detailJob ? bookmarkedIds.has(detailJob.id) : false}
        onOpenChange={setDetailOpen}
        onToggleBookmark={toggleBookmark}
      />
    </div>
  );
}

/* ───────────────────────── sub-views ───────────────────────── */

function ResultsArea(props: {
  loading: boolean;
  error: string | null;
  jobs: Job[];
  result: JobSearchResult | null;
  newIds: Set<string>;
  bookmarkedIds: Set<string>;
  loadingMore: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onToggleBookmark: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
  onLoadMore: () => void;
}) {
  if (props.loading) return <JobGridSkeleton />;

  if (props.error) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="Something went wrong"
        body={props.error}
        action={<Button onClick={props.onRetry}>Try again</Button>}
      />
    );
  }

  if (props.jobs.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="No jobs match your filters"
        body="Try broadening your search terms, widening the budget range, or clearing some filters."
        action={
          <Button variant="outline" onClick={props.onResetFilters}>
            Reset filters
          </Button>
        }
      />
    );
  }

  return (
    <>
      <MotionGrid className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {props.jobs.map((job) => (
          <MotionItem key={job.id}>
            <JobCard
              job={job}
              bookmarked={props.bookmarkedIds.has(job.id)}
              isNew={props.newIds.has(job.id)}
              onToggleBookmark={props.onToggleBookmark}
              onOpenDetails={props.onOpenDetails}
            />
          </MotionItem>
        ))}
      </MotionGrid>

      {props.result?.nextCursor && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={props.onLoadMore}
            disabled={props.loadingMore}
            className="min-w-44"
          >
            {props.loadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Loading…
              </>
            ) : (
              "Load more jobs"
            )}
          </Button>
        </div>
      )}
    </>
  );
}

function ExportMenu({
  onExport,
  disabled,
}: {
  onExport: (format: "csv" | "json") => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <FileDown className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("csv")}>
          <FileDown className="size-4" /> Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("json")}>
          <FileJson className="size-4" /> Download JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="mt-4 font-display text-lg">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function JobGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-xl border border-border/70 bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function dedupe(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter((j) => (seen.has(j.id) ? false : (seen.add(j.id), true)));
}
