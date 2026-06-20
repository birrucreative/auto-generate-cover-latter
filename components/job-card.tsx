"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  budgetLabel,
  compactMoney,
  experienceLabel,
  relativeTime,
} from "@/lib/client/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  job: Job;
  bookmarked: boolean;
  isNew?: boolean;
  onToggleBookmark: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
}

export function JobCard({
  job,
  bookmarked,
  isNew,
  onToggleBookmark,
  onOpenDetails,
}: Props) {
  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]",
        isNew && "border-primary/40 ring-1 ring-primary/30"
      )}
    >
      {isNew && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground shadow">
          <Sparkles className="size-3" /> New
        </span>
      )}

      <CardHeader className="gap-2 px-5 pt-5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md border-transparent px-2 py-0.5 text-xs font-medium tabular",
              job.type === "hourly"
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            <Wallet className="mr-1 size-3" />
            {budgetLabel(job)}
          </Badge>
          {job.experienceLevel !== "unknown" && (
            <span className="text-xs text-muted-foreground">
              {experienceLabel(job.experienceLevel)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tabular">
            <Clock className="size-3" />
            {relativeTime(job.postedAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(job)}
          className="text-left"
        >
          <h3 className="line-clamp-2 font-display text-lg leading-snug tracking-tight transition-colors group-hover:text-primary">
            {job.title}
          </h3>
        </button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {job.description}
        </p>

        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="rounded-md px-1 py-0.5 text-xs text-muted-foreground/70">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}

        <ClientRow job={job} />
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-5 py-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular">
          <Users className="size-3.5" />
          {job.proposals ? `${job.proposals} proposals` : "—"}
        </span>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary"
                aria-label={bookmarked ? "Remove bookmark" : "Save job"}
                onClick={() => onToggleBookmark(job)}
              >
                {bookmarked ? (
                  <BookmarkCheck className="size-4 text-primary" />
                ) : (
                  <Bookmark className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{bookmarked ? "Saved" : "Save job"}</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onOpenDetails(job)}
          >
            Details
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary"
              >
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open on Upwork"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open on Upwork</TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}

function ClientRow({ job }: { job: Job }) {
  const c = job.client;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {c.country && (
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {c.country}
        </span>
      )}
      {c.rating != null && (
        <span className="flex items-center gap-1 tabular">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {c.rating.toFixed(1)}
        </span>
      )}
      {c.totalSpent != null && (
        <span className="tabular">{compactMoney(c.totalSpent)} spent</span>
      )}
      {c.paymentVerified && (
        <span className="flex items-center gap-1 text-primary">
          <BadgeCheck className="size-3.5" />
          Verified
        </span>
      )}
    </div>
  );
}
