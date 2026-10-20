"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  COLLECTIONS,
  labelize,
  statusCountsFor,
  statusTone,
  type CollectionKey,
  type Summary,
} from "./config";

export function SummaryCards({
  summary,
  error,
  active,
  onRetry,
  onSelect,
}: {
  summary: Summary | null;
  error: string | null;
  active: CollectionKey;
  onRetry: () => void;
  onSelect: (key: CollectionKey) => void;
}) {
  if (!summary && error) {
    return (
      <Card
        role="alert"
        className="flex-row items-center justify-between gap-4 px-5 py-4"
      >
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {summary && error ? (
        <div
          role="status"
          className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.06] px-4 py-2.5"
        >
          <p className="text-xs text-muted-foreground">
            {error} Showing the last known counts.
          </p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
      {COLLECTIONS.map((config) => {
        const entry = summary?.[config.key];
        const isActive = active === config.key;
        const byStatus = statusCountsFor(entry);
        const statusEntries = Object.entries(byStatus).filter(([, count]) => typeof count === "number" && count > 0);

        return (
          <button
            key={config.key}
            type="button"
            onClick={() => onSelect(config.key)}
            aria-pressed={isActive}
            className={cn(
              "text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
          >
            <Card
              className={cn(
                "h-full gap-3 px-4 py-4 transition-colors",
                isActive ? "border-[#eca8d6]/50 bg-[#eca8d6]/[0.04]" : "hover:border-foreground/25",
              )}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {config.label}
              </p>
              {summary ? (
                <>
                  <p className="font-display text-3xl leading-none">
                    {entry?.total ?? 0}
                  </p>
                  <div className="flex min-h-[22px] flex-wrap gap-1">
                    {statusEntries.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground/50">no items</span>
                    ) : (
                      statusEntries.map(([statusName, countVal]) => (
                        <Badge
                          key={statusName}
                          variant="outline"
                          className={cn("text-[10px]", statusTone(statusName))}
                        >
                          {labelize(statusName)} {Number(countVal)}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-5 w-full" />
                </>
              )}
            </Card>
          </button>
        );
      })}
    </div>
  );
}
