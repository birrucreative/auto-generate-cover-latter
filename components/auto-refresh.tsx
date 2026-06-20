"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  enabled: boolean;
  intervalSec: number;
  polling: boolean;
  onToggle: (enabled: boolean) => void;
  onIntervalChange: (sec: number) => void;
}

export function AutoRefresh({
  enabled,
  intervalSec,
  polling,
  onToggle,
  onIntervalChange,
}: Props) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card/60 py-1.5 pl-3 pr-1.5 text-sm shadow-sm backdrop-blur-sm">
      <RefreshCw
        className={cn(
          "size-4 text-muted-foreground transition-colors",
          enabled && "text-primary",
          polling && "animate-spin"
        )}
      />
      <Label
        htmlFor="auto-refresh"
        className="cursor-pointer select-none text-muted-foreground"
      >
        Auto-refresh
      </Label>
      <Switch id="auto-refresh" checked={enabled} onCheckedChange={onToggle} />
      <Select
        value={String(intervalSec)}
        onValueChange={(v) => onIntervalChange(Number(v))}
        disabled={!enabled}
      >
        <SelectTrigger
          size="sm"
          className="h-8 w-[88px] rounded-full border-0 bg-muted/60 text-xs"
          aria-label="Refresh interval"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">30s</SelectItem>
          <SelectItem value="60">1m</SelectItem>
          <SelectItem value="300">5m</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
