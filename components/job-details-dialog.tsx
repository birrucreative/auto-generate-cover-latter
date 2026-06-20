"use client";

import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import type { Job } from "@/lib/types";
import {
  budgetLabel,
  compactMoney,
  experienceLabel,
  relativeTime,
} from "@/lib/client/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  job: Job | null;
  open: boolean;
  bookmarked: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleBookmark: (job: Job) => void;
}

export function JobDetailsDialog({
  job,
  open,
  bookmarked,
  onOpenChange,
  onToggleBookmark,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {job && (
          <>
            <DialogHeader className="space-y-3 border-b border-border/60 px-6 pt-6 pb-4 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                  {budgetLabel(job)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {job.type}
                </Badge>
                {job.experienceLevel !== "unknown" && (
                  <Badge variant="outline">
                    {experienceLabel(job.experienceLevel)}
                  </Badge>
                )}
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tabular">
                  <Clock className="size-3" />
                  {relativeTime(job.postedAt)}
                </span>
              </div>
              <DialogTitle className="font-display text-2xl leading-tight tracking-tight">
                {job.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Full job posting details
              </DialogDescription>
              {(job.category || job.duration || job.workload) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {job.category && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3" />
                      {job.category}
                      {job.subcategory ? ` · ${job.subcategory}` : ""}
                    </span>
                  )}
                  {job.duration && <span>{job.duration}</span>}
                  {job.workload && <span>{job.workload}</span>}
                </div>
              )}
            </DialogHeader>

            <ScrollArea className="max-h-[42vh]">
              <div className="space-y-5 px-6 py-5">
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {job.description}
                  </p>
                </section>

                {job.skills.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <Separator />

                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    About the client
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat
                      icon={<MapPin className="size-3.5" />}
                      label="Location"
                      value={job.client.country ?? "—"}
                    />
                    <Stat
                      icon={<Star className="size-3.5 text-amber-400" />}
                      label="Rating"
                      value={
                        job.client.rating != null
                          ? `${job.client.rating.toFixed(2)} (${job.client.reviewsCount ?? 0})`
                          : "—"
                      }
                    />
                    <Stat
                      label="Total spent"
                      value={compactMoney(job.client.totalSpent)}
                    />
                    <Stat
                      icon={<Users className="size-3.5" />}
                      label="Hires"
                      value={job.client.totalHires?.toString() ?? "—"}
                    />
                    <Stat
                      label="Jobs posted"
                      value={job.client.totalJobsPosted?.toString() ?? "—"}
                    />
                    <Stat
                      icon={
                        job.client.paymentVerified ? (
                          <BadgeCheck className="size-3.5 text-primary" />
                        ) : undefined
                      }
                      label="Payment"
                      value={
                        job.client.paymentVerified == null
                          ? "—"
                          : job.client.paymentVerified
                          ? "Verified"
                          : "Unverified"
                      }
                    />
                  </div>
                </section>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-row items-center gap-2 border-t border-border/60 px-6 py-4">
              <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground tabular">
                <Users className="size-3.5" />
                {job.proposals ? `${job.proposals} proposals` : "—"}
              </span>
              <Button
                variant="outline"
                onClick={() => onToggleBookmark(job)}
                className="gap-2"
              >
                {bookmarked ? (
                  <BookmarkCheck className="size-4 text-primary" />
                ) : (
                  <Bookmark className="size-4" />
                )}
                {bookmarked ? "Saved" : "Save"}
              </Button>
              <Button asChild className="gap-2">
                <a href={job.url} target="_blank" rel="noreferrer">
                  Open on Upwork
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-sm font-medium">
        {icon}
        {value}
      </div>
    </div>
  );
}
