"use client";

import * as React from "react";
import { ExternalLink, FileDown, Inbox, Trash2 } from "lucide-react";
import type { ApplicationStatus, Bookmark } from "@/lib/types";
import { budgetLabel, relativeTime } from "@/lib/client/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-primary/12 text-primary",
  interviewing: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  rejected: "bg-destructive/12 text-destructive",
  hired: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

interface Props {
  bookmarks: Bookmark[];
  onChangeStatus: (id: string, status: ApplicationStatus) => void;
  onChangeNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
}

export function BookmarksView({
  bookmarks,
  onChangeStatus,
  onChangeNote,
  onRemove,
  onExport,
}: Props) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </div>
        <p className="mt-4 font-display text-lg">No saved jobs yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Bookmark jobs from the search results to track them here, set an
          application status, and add private notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular">
            {bookmarks.length}
          </span>{" "}
          saved {bookmarks.length === 1 ? "job" : "jobs"}
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <FileDown className="size-4" />
          Export saved
        </Button>
      </div>

      <ul className="space-y-3">
        {bookmarks.map((b) => (
          <li
            key={b.job.id}
            className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {budgetLabel(b.job)}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular">
                    saved {relativeTime(b.savedAt)}
                  </span>
                </div>
                <a
                  href={b.job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 flex items-center gap-1.5 font-display text-lg leading-snug tracking-tight hover:text-primary"
                >
                  {b.job.title}
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={b.status}
                  onValueChange={(v) =>
                    onChangeStatus(b.job.id, v as ApplicationStatus)
                  }
                >
                  <SelectTrigger
                    className={`h-8 w-[140px] border-0 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label="Remove bookmark"
                  onClick={() => onRemove(b.job.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <NoteEditor
              initial={b.note}
              onSave={(note) => onChangeNote(b.job.id, note)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Note field that saves on blur or after a short debounce. */
function NoteEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = React.useState(initial);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => setNote(initial), [initial]);

  const schedule = (v: string) => {
    setNote(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(v), 700);
  };

  return (
    <Textarea
      value={note}
      onChange={(e) => schedule(e.target.value)}
      onBlur={() => {
        if (timer.current) clearTimeout(timer.current);
        if (note !== initial) onSave(note);
      }}
      placeholder="Add a private note — why this job, proposal angle, follow-ups…"
      className="mt-3 min-h-[2.5rem] resize-none bg-muted/30 text-sm"
      rows={2}
    />
  );
}
