"use client";

import * as React from "react";
import { Database, LogOut, Plug, ShieldCheck } from "lucide-react";
import type { AuthStatus } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  auth: AuthStatus | null;
  source: "upwork" | "demo" | null;
  onLogout: () => void;
}

export function SiteHeader({ auth, source, onLogout }: Props) {
  const isLive = source === "upwork" || auth?.connected;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Database className="size-[18px]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-xl tracking-tight">Jobseeker</h1>
            <p className="hidden text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Upwork official API client
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionBadge isLive={!!isLive} reason={auth?.demoReason} />

          {isLive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="sm" className="shadow-sm">
                  <a href="/api/auth/login">
                    <Plug className="size-4" />
                    <span className="hidden sm:inline">Connect Upwork</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {auth?.credentialsConfigured
                  ? "Authorize with your Upwork account"
                  : "Add API credentials in .env first (see README)"}
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function ConnectionBadge({
  isLive,
  reason,
}: {
  isLive: boolean;
  reason?: string | null;
}) {
  if (isLive) {
    return (
      <Badge className="gap-1.5 bg-primary/12 text-primary ring-1 ring-primary/25 hover:bg-primary/12">
        <ShieldCheck className="size-3.5" />
        Connected
      </Badge>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className="gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
          </span>
          Demo data
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{reason ?? "Running with sample jobs"}</TooltipContent>
    </Tooltip>
  );
}
