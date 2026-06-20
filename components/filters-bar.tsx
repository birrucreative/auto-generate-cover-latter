"use client";

import * as React from "react";
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { JobSearchParams, JobType, SortKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

export interface FilterState {
  query: string;
  jobType: JobType | "all";
  experienceLevel: "entry" | "intermediate" | "expert" | "all";
  budgetMin: string;
  budgetMax: string;
  paymentVerifiedOnly: boolean;
  postedWithinHours: string; // "", "24", "72", "168"
  skills: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  jobType: "all",
  experienceLevel: "all",
  budgetMin: "",
  budgetMax: "",
  paymentVerifiedOnly: false,
  postedWithinHours: "",
  skills: [],
  sort: "recency",
};

export function toSearchParams(f: FilterState): JobSearchParams {
  return {
    query: f.query.trim() || undefined,
    jobType: f.jobType,
    experienceLevel: f.experienceLevel,
    budgetMin: f.budgetMin ? Number(f.budgetMin) : undefined,
    budgetMax: f.budgetMax ? Number(f.budgetMax) : undefined,
    paymentVerifiedOnly: f.paymentVerifiedOnly || undefined,
    postedWithinHours: f.postedWithinHours ? Number(f.postedWithinHours) : undefined,
    skills: f.skills.length ? f.skills : undefined,
    sort: f.sort,
    limit: 24,
  };
}

function countActive(f: FilterState): number {
  let n = 0;
  if (f.jobType !== "all") n++;
  if (f.experienceLevel !== "all") n++;
  if (f.budgetMin) n++;
  if (f.budgetMax) n++;
  if (f.paymentVerifiedOnly) n++;
  if (f.postedWithinHours) n++;
  if (f.skills.length) n++;
  return n;
}

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onSearch: () => void;
  busy?: boolean;
}

export function FiltersBar({ value, onChange, onSearch, busy }: Props) {
  const [open, setOpen] = React.useState(false);
  const [skillDraft, setSkillDraft] = React.useState("");
  const activeCount = countActive(value);

  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v });

  const addSkill = () => {
    const s = skillDraft.trim();
    if (s && !value.skills.includes(s)) {
      set("skills", [...value.skills, s]);
    }
    setSkillDraft("");
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
      {/* Primary search row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(e) => set("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search jobs — e.g. react, scraping, langchain…"
            className="h-11 pl-9 text-base"
            aria-label="Search query"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={value.sort}
            onValueChange={(v) => set("sort", v as SortKey)}
          >
            <SelectTrigger className="h-11 w-[150px]" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recency">Newest first</SelectItem>
              <SelectItem value="relevance">Most relevant</SelectItem>
              <SelectItem value="clientSpend">Top spenders</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-0.5 size-5 justify-center rounded-full bg-primary p-0 text-[11px] text-primary-foreground">
                {activeCount}
              </Badge>
            )}
          </Button>

          <Button
            type="button"
            className="h-11 gap-2 px-5"
            onClick={onSearch}
            disabled={busy}
          >
            <Search className="size-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Advanced filters */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-4 rounded-xl border border-border/60 bg-background/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Job type">
              <ToggleGroup
                type="single"
                value={value.jobType}
                onValueChange={(v) =>
                  set("jobType", (v || "all") as FilterState["jobType"])
                }
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="all" className="flex-1">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="hourly" className="flex-1">
                  Hourly
                </ToggleGroupItem>
                <ToggleGroupItem value="fixed" className="flex-1">
                  Fixed
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field label="Experience level">
              <Select
                value={value.experienceLevel}
                onValueChange={(v) =>
                  set("experienceLevel", v as FilterState["experienceLevel"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any level</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Posted within">
              <Select
                value={value.postedWithinHours || "any"}
                onValueChange={(v) =>
                  set("postedWithinHours", v === "any" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="72">Last 3 days</SelectItem>
                  <SelectItem value="168">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Budget (USD)">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Min"
                  value={value.budgetMin}
                  onChange={(e) => set("budgetMin", e.target.value)}
                  className="tabular"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Max"
                  value={value.budgetMax}
                  onChange={(e) => set("budgetMax", e.target.value)}
                  className="tabular"
                />
              </div>
            </Field>

            <Field label="Skills">
              <div className="space-y-2">
                <Input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill, press Enter"
                />
                {value.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {value.skills.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {s}
                        <button
                          type="button"
                          aria-label={`Remove ${s}`}
                          onClick={() =>
                            set(
                              "skills",
                              value.skills.filter((x) => x !== s)
                            )
                          }
                          className="rounded-sm p-0.5 hover:bg-foreground/10"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Client">
              <label className="flex h-10 items-center justify-between rounded-md border border-input px-3">
                <span className="text-sm text-muted-foreground">
                  Payment verified only
                </span>
                <Switch
                  checked={value.paymentVerifiedOnly}
                  onCheckedChange={(v) => set("paymentVerifiedOnly", v)}
                />
              </label>
            </Field>

            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onChange(DEFAULT_FILTERS)}
                disabled={activeCount === 0 && !value.query}
              >
                <RotateCcw className="size-3.5" />
                Reset filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
