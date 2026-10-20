"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  bulkSetStatus,
  deleteRecord,
  downloadCsv,
  errorMessage,
  isUnauthorizedStatus,
  patchRecord,
} from "./api";
import {
  COLLECTIONS_BY_KEY,
  fieldLabel,
  formatDate,
  labelize,
  PAGE_SIZE,
  preview,
  quickActionClass,
  type AdminRecord,
  type CollectionConfig,
  type CollectionKey,
} from "./config";
import { useCollectionData, useDebouncedValue } from "./use-collection-data";
import { RecordDetail } from "./record-detail";
import { StatusBadge } from "./record-values";

type Props = {
  collection: CollectionKey;
  onMutated: () => void;
  onUnauthorized: () => void;
};

export function CollectionPanel({ collection, onMutated, onUnauthorized }: Props) {
  const config = COLLECTIONS_BY_KEY[collection];

  const [status, setStatus] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebouncedValue(searchInput, 300);
  const [offset, setOffset] = useState(0);

  const {
    items,
    total,
    limit,
    loading,
    error,
    reload,
    setItems,
  } = useCollectionData(
    collection,
    { status, q: debouncedQuery, offset, limit: PAGE_SIZE },
    onUnauthorized,
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasQuery = debouncedQuery.trim() !== "";
  const hasStatusFilter = status !== "all";
  const hasFilters = hasQuery || hasStatusFilter;
  // True during the debounce window, before the request for the new term runs.
  const searchPending = searchInput !== debouncedQuery;

  // A new filter or page defines a new selection scope.
  useEffect(() => {
    setSelected(new Set());
  }, [collection, status, debouncedQuery, offset]);

  // Reset paging whenever the filter narrows or the search term settles.
  useEffect(() => {
    setOffset(0);
  }, [status, debouncedQuery]);

  // Drop selected ids that are no longer on the page (e.g. after a mutation).
  useEffect(() => {
    if (loading) return;
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(items.map((item) => String(item.id)));
      const next = new Set<string>();
      let changed = false;
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [items, loading]);

  // If a page emptied out (e.g. a row was deleted elsewhere), step back so the
  // admin never lands on a blank page that still reports a non-zero total.
  useEffect(() => {
    if (loading || error || items.length > 0 || total === 0) return;
    const lastOffset = Math.max(0, Math.floor((total - 1) / limit) * limit);
    if (offset > lastOffset) setOffset(lastOffset);
  }, [loading, error, items.length, total, limit, offset]);

  const setBusy = useCallback((key: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const patch = useCallback(
    async (id: AdminRecord["id"], body: Record<string, unknown>) => {
      const key = String(id);
      const before = items.find((item) => String(item.id) === key) ?? null;
      setBusy(key, true);
      // Optimistic — reconciled by the silent reload below.
      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === key ? { ...item, ...body } : item,
        ),
      );

      const revert = () => {
        if (!before) return;
        setItems((prev) =>
          prev.map((item) => (String(item.id) === key ? before : item)),
        );
      };

      try {
        const result = await patchRecord(collection, key, body);
        if (isUnauthorizedStatus(result.status)) {
          onUnauthorized();
          return;
        }
        if (!result.ok || (result.data && result.data.ok !== true)) {
          revert();
          toast.error(errorMessage(result.data, "Could not save. Change reverted."));
          return;
        }
        toast.success("Saved");
        onMutated();
        void reload({ silent: true });
      } catch {
        revert();
        toast.error("Could not save. Change reverted.");
      } finally {
        setBusy(key, false);
      }
    },
    [
      collection,
      items,
      onMutated,
      onUnauthorized,
      reload,
      setBusy,
      setItems,
    ],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const key = String(deleteTarget.id);
    setDeleting(true);
    try {
      const result = await deleteRecord(collection, key);
      if (isUnauthorizedStatus(result.status)) {
        onUnauthorized();
        return;
      }
      if (!result.ok) {
        toast.error(errorMessage(result.data, "Could not delete. Nothing was removed."));
        return;
      }
      toast.success("Deleted");
      setDeleteTarget(null);
      setDetailId(null);
      onMutated();
      // Step back a page if we just removed the last row on it.
      if (items.length === 1 && offset > 0) {
        setOffset((current) => Math.max(0, current - limit));
      } else {
        void reload({ silent: true });
      }
    } catch {
      toast.error("Could not delete. Nothing was removed.");
    } finally {
      setDeleting(false);
    }
  }, [
    collection,
    deleteTarget,
    items.length,
    limit,
    offset,
    onMutated,
    onUnauthorized,
    reload,
  ]);

  const applyBulk = useCallback(async () => {
    if (bulkBusy || selected.size === 0 || !bulkStatus) return;
    const ids = Array.from(selected)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    if (ids.length === 0) {
      toast.error("Nothing to update.");
      return;
    }

    setBulkBusy(true);
    try {
      const result = await bulkSetStatus(collection, ids, bulkStatus);
      if (isUnauthorizedStatus(result.status)) {
        onUnauthorized();
        return;
      }
      if (!result.ok || (result.data && result.data.ok !== true)) {
        toast.error(
          errorMessage(result.data, "Could not update the selected records."),
        );
        return;
      }
      toast.success(
        `Updated ${ids.length} ${ids.length === 1 ? config.noun : config.label.toLowerCase()}`,
      );
      setSelected(new Set());
      setBulkStatus("");
      onMutated();
      void reload({ silent: true });
    } catch {
      toast.error("Could not update the selected records.");
    } finally {
      setBulkBusy(false);
    }
  }, [
    bulkBusy,
    bulkStatus,
    collection,
    config.label,
    config.noun,
    onMutated,
    onUnauthorized,
    reload,
    selected,
  ]);

  const onExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await downloadCsv(collection);
      if (isUnauthorizedStatus(result.status)) {
        onUnauthorized();
        return;
      }
      if (!result.ok) {
        toast.error(errorMessage(result.data, "Could not export this collection."));
        return;
      }
      toast.success(`Exported ${config.label.toLowerCase()}`);
    } catch {
      toast.error("Could not export this collection.");
    } finally {
      setExporting(false);
    }
  }, [collection, config.label, exporting, onUnauthorized]);

  const pageIds = useMemo(() => items.map((item) => String(item.id)), [items]);
  const selectedOnPage = useMemo(
    () => pageIds.filter((id) => selected.has(id)).length,
    [pageIds, selected],
  );
  const allChecked: boolean | "indeterminate" =
    pageIds.length > 0 && selectedOnPage === pageIds.length
      ? true
      : selectedOnPage > 0
        ? "indeterminate"
        : false;

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (checked) pageIds.forEach((id) => next.add(id));
        else pageIds.forEach((id) => next.delete(id));
        return next;
      });
    },
    [pageIds],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setStatus("all");
    setOffset(0);
  }, []);

  const detailRecord = useMemo(
    () => items.find((item) => String(item.id) === detailId) ?? null,
    [items, detailId],
  );

  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="grid min-w-0 gap-5">
      {/* Toolbar: search + export, status filters + count */}
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Label htmlFor="admin-search" className="sr-only">
              Search {config.label}
            </Label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="admin-search"
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={`Search ${config.label.toLowerCase()}…`}
              className="pl-9"
              autoComplete="off"
              spellCheck={false}
            />
            {searchInput ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void onExport()}
            disabled={exporting}
          >
            <Download className="size-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by status"
          >
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
              All
            </FilterChip>
            {config.statuses.map((value) => (
              <FilterChip
                key={value}
                active={status === value}
                onClick={() => setStatus(value)}
              >
                {labelize(value)}
              </FilterChip>
            ))}
          </div>
          <p
            aria-live="polite"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
          >
            {loading
              ? "Loading…"
              : searchPending
                ? "Searching…"
                : `${total} ${total === 1 ? config.noun : config.label.toLowerCase()}`}
          </p>
        </div>
      </div>

      {/* Bulk actions — only when something on this page is selected */}
      {selected.size > 0 ? (
        <div
          role="group"
          aria-label={`Bulk actions for ${selected.size} selected`}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-[#eca8d6]/40 bg-[#eca8d6]/[0.06] px-4 py-3"
        >
          <p className="text-sm">
            <span className="font-medium">{selected.size}</span> selected
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              value={bulkStatus}
              onValueChange={setBulkStatus}
              disabled={bulkBusy}
            >
              <SelectTrigger size="sm" aria-label="Status to apply" className="w-[160px]">
                <SelectValue placeholder="Set status…" />
              </SelectTrigger>
              <SelectContent>
                {config.statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelize(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={() => void applyBulk()}
              disabled={bulkBusy || !bulkStatus}
            >
              {bulkBusy ? "Applying…" : "Apply"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              disabled={bulkBusy}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {/* Content: loading | error | empty | list */}
      <div aria-busy={loading}>
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <Card
            role="alert"
            className="items-center gap-3 border-dashed px-6 py-14 text-center"
          >
            <p className="font-display text-2xl">Something went wrong</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void reload()}>
              Retry
            </Button>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState
            title={
              hasQuery
                ? "No matches for your search"
                : hasStatusFilter
                  ? `No ${config.label.toLowerCase()} with status “${labelize(status)}”`
                  : `No ${config.label.toLowerCase()} yet`
            }
            body={
              hasQuery
                ? "Try a different search term or clear the filters."
                : hasStatusFilter
                  ? "Try a different status, or clear the filter."
                  : `New ${config.label.toLowerCase()} will appear here.`
            }
            action={
              hasFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table (scrolls horizontally inside its container) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(value) => toggleAll(value === true)}
                        aria-label="Select all rows on this page"
                      />
                    </TableHead>
                    <TableHead scope="col" className="w-14">
                      #
                    </TableHead>
                    <TableHead scope="col">
                      {labelFor(config, config.primaryKey)}
                    </TableHead>
                    {config.columns.map((column) => (
                      <TableHead key={column.key} scope="col">
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead scope="col">Created</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((record) => {
                    const key = String(record.id);
                    const isSelected = selected.has(key);
                    return (
                      <TableRow
                        key={key}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(value) => toggleOne(key, value === true)}
                            aria-label={`Select ${config.noun} ${key}`}
                          />
                        </TableCell>
                        <TableCell className="align-top font-mono text-xs text-muted-foreground">
                          {key}
                        </TableCell>
                        <TableCell className="max-w-[280px] align-top">
                          <button
                            type="button"
                            onClick={() => setDetailId(key)}
                            className="block max-w-full truncate text-left font-medium hover:text-[#eca8d6] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title={preview(record[config.primaryKey], 200)}
                          >
                            {preview(record[config.primaryKey], 90) || "(no title)"}
                          </button>
                          {config.publicPath?.(record) ? (
                            <PublicLink url={config.publicPath(record)!} className="mt-1" />
                          ) : null}
                        </TableCell>
                        {config.columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className="max-w-[220px] truncate align-top text-muted-foreground"
                            title={preview(record[column.key], 200)}
                          >
                            {preview(record[column.key], 60) || "—"}
                          </TableCell>
                        ))}
                        <TableCell className="whitespace-nowrap align-top text-xs text-muted-foreground">
                          {formatDate(record.created_at) || "—"}
                        </TableCell>
                        <TableCell className="align-top">
                          <StatusBadge
                            status={typeof record.status === "string" ? record.status : null}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <RowActions
                            record={record}
                            config={config}
                            busy={busyIds.has(key)}
                            onPatch={patch}
                            onOpen={() => setDetailId(key)}
                            onDelete={() => setDeleteTarget(record)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Narrow screens: cards */}
            <div className="flex items-center justify-between gap-3 px-1 md:hidden">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  aria-label="Select all rows on this page"
                />
                Select all on this page
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                {selectedOnPage}/{pageIds.length}
              </span>
            </div>
            <ul className="grid gap-3 md:hidden">
              {items.map((record) => {
                const key = String(record.id);
                const isSelected = selected.has(key);
                return (
                  <li key={key}>
                    <Card
                      className={cn(
                        "gap-4 p-4",
                        isSelected && "border-[#eca8d6]/50 bg-[#eca8d6]/[0.04]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(value) => toggleOne(key, value === true)}
                          aria-label={`Select ${config.noun} ${key}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(key)}
                            className="block max-w-full truncate text-left font-medium hover:text-[#eca8d6]"
                          >
                            {preview(record[config.primaryKey], 80) || "(no title)"}
                          </button>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                            #{key} · {formatDate(record.created_at) || "—"}
                          </p>
                        </div>
                        <StatusBadge
                          status={typeof record.status === "string" ? record.status : null}
                        />
                      </div>

                      <dl className="grid gap-1.5 text-sm">
                        {config.columns.map((column) => (
                          <div key={column.key} className="flex gap-3">
                            <dt className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                              {column.label}
                            </dt>
                            <dd className="min-w-0 flex-1 truncate text-muted-foreground">
                              {preview(record[column.key], 80) || "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {config.publicPath?.(record) ? (
                        <PublicLink url={config.publicPath(record)!} />
                      ) : null}

                      <RowActions
                        record={record}
                        config={config}
                        busy={busyIds.has(key)}
                        onPatch={patch}
                        onOpen={() => setDetailId(key)}
                        onDelete={() => setDeleteTarget(record)}
                      />
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Showing {start}–{end} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasPrev}
              onClick={() => setOffset((current) => Math.max(0, current - limit))}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => setOffset((current) => current + limit)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {detailRecord ? (
        <RecordDetail
          record={detailRecord}
          config={config}
          busy={busyIds.has(String(detailRecord.id))}
          onPatch={patch}
          onRequestDelete={(record) => setDeleteTarget(record)}
          onClose={() => setDetailId(null)}
        />
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {config.noun}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes #{deleteTarget ? String(deleteTarget.id) : ""} from{" "}
              {config.label}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function labelFor(config: CollectionConfig, key: string): string {
  const column = config.columns.find((entry) => entry.key === key);
  return column ? column.label : fieldLabel(key);
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "border-[#eca8d6]/50 bg-[#eca8d6]/10 text-[#eca8d6]"
          : "border-foreground/15 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PublicLink({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex w-fit items-center gap-1 text-xs text-[#eca8d6] underline-offset-4 hover:underline",
        className,
      )}
    >
      View public page
      <ExternalLink className="size-3" />
    </a>
  );
}

function RowActions({
  record,
  config,
  busy,
  onPatch,
  onOpen,
  onDelete,
}: {
  record: AdminRecord;
  config: CollectionConfig;
  busy: boolean;
  onPatch: (id: AdminRecord["id"], body: Record<string, unknown>) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {config.quickActions.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || record.status === action.status}
          className={quickActionClass(action.tone)}
          onClick={() => onPatch(record.id, { status: action.status })}
        >
          {action.label}
        </Button>
      ))}

      <Select
        value={typeof record.status === "string" ? record.status : ""}
        onValueChange={(value) => onPatch(record.id, { status: value })}
        disabled={busy}
      >
        <SelectTrigger size="sm" aria-label="Set status" className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {config.statuses.map((value) => (
            <SelectItem key={value} value={value}>
              {labelize(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" size="sm" variant="ghost" onClick={onOpen} disabled={busy}>
        Details
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={`Delete ${config.noun} ${String(record.id)}`}
        className="text-red-300 hover:bg-red-400/10 hover:text-red-200"
        onClick={onDelete}
        disabled={busy}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="items-center gap-3 border-dashed px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      {body ? <p className="max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {action}
    </Card>
  );
}
