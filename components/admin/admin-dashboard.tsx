"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { apiRequest, errorMessage, isUnauthorizedStatus } from "./api";
import { COLLECTIONS, type CollectionKey, type Summary } from "./config";
import { CollectionPanel } from "./collection-panel";
import { SummaryCards } from "./summary-cards";

type AuthState = "loading" | "authorised" | "unauthorised" | "error";

export function AdminDashboard() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [active, setActive] = useState<CollectionKey>("applications");
  const [reloadKey, setReloadKey] = useState(0);

  const goUnauthorised = useCallback(() => setAuth("unauthorised"), []);

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    const result = await apiRequest<{ ok?: boolean; summary?: Summary }>(
      "/api/admin/summary",
    );
    if (isUnauthorizedStatus(result.status)) {
      goUnauthorised();
      return;
    }
    if (!result.ok || !result.data || result.data.ok !== true || !result.data.summary) {
      setSummaryError(
        errorMessage(result.data, "Couldn't load the summary counts."),
      );
      return;
    }
    setSummary(result.data.summary);
  }, [goUnauthorised]);

  // Resolve the signed-in identity; reused by the initial load and Retry.
  const checkIdentity = useCallback(async () => {
    const result = await apiRequest<{ ok?: boolean; email?: string }>(
      "/api/admin/me",
    );
    if (isUnauthorizedStatus(result.status)) {
      setAuth("unauthorised");
      return;
    }
    if (!result.ok || !result.data || result.data.ok !== true) {
      setAuthError(
        errorMessage(result.data, "We couldn't reach the admin service."),
      );
      setAuth("error");
      return;
    }
    setAuthError("");
    setEmail(typeof result.data.email === "string" ? result.data.email : "");
    setAuth("authorised");
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void checkIdentity();
  }, [checkIdentity]);

  const refreshAll = useCallback(() => {
    setReloadKey((key) => key + 1);
    void loadSummary();
  }, [loadSummary]);

  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-10 lg:py-12">
        <Header
          email={auth === "authorised" ? email : null}
          onRefresh={auth === "authorised" ? refreshAll : undefined}
        />

        <div className="mt-8">
          {auth === "loading" ? <DashboardSkeleton /> : null}

          {auth === "unauthorised" ? (
            <Notice
              icon={<ShieldAlert className="size-8 text-[#eca8d6]" />}
              title="Not authorised"
              body="This area is restricted. Sign in with an authorised account to continue."
            >
              <Button asChild>
                <a href="/cdn-cgi/access/login?redirect_url=/admin">Sign in</a>
              </Button>
            </Notice>
          ) : null}

          {auth === "error" ? (
            <Notice
              icon={<ShieldAlert className="size-8 text-red-300" />}
              title="Couldn't verify access"
              body={
                authError ||
                "We couldn't reach the admin service. Check your connection and try again."
              }
            >
              <Button
                variant="outline"
                onClick={() => {
                  setAuth("loading");
                  void checkIdentity();
                }}
              >
                Try again
              </Button>
            </Notice>
          ) : null}

          {auth === "authorised" ? (
            <div className="grid gap-8">
              <SummaryCards
                summary={summary}
                error={summaryError}
                active={active}
                onRetry={() => void loadSummary()}
                onSelect={(key) => setActive(key)}
              />

              <Tabs
                value={active}
                onValueChange={(value) => setActive(value as CollectionKey)}
                className="gap-6"
              >
                <TabsList
                  aria-label="Collections"
                  className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1"
                >
                  {COLLECTIONS.map((config) => {
                    const count = summary?.[config.key]?.total;
                    return (
                      <TabsTrigger
                        key={config.key}
                        value={config.key}
                        className="flex-none gap-2 px-3"
                      >
                        {config.label}
                        {count != null ? (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {count}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={active} className="mt-0">
                  <CollectionPanel
                    key={`${active}:${reloadKey}`}
                    collection={active}
                    onMutated={() => void loadSummary()}
                    onUnauthorized={goUnauthorised}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>

      <Toaster position="bottom-right" />
    </main>
  );
}

function Header({
  email,
  onRefresh,
}: {
  email: string | null;
  onRefresh?: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-6">
      <div className="flex items-baseline gap-3">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight hover:text-[#eca8d6]"
        >
          {SITE.name}
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </span>
      </div>

      {email != null ? (
        <div className="flex flex-wrap items-center gap-3">
          {onRefresh ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Refresh dashboard"
              onClick={onRefresh}
            >
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
          <span
            className="max-w-[240px] truncate font-mono text-xs text-muted-foreground"
            title={email}
          >
            {email || "signed in"}
          </span>
          <Button asChild size="sm" variant="outline">
            <a href="/cdn-cgi/access/logout">
              <LogOut className="size-4" />
              Sign out
            </a>
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function Notice({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div
        className={cn(
          "max-w-md rounded-xl border border-foreground/10 bg-card px-8 py-10 text-center",
        )}
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-foreground/10 bg-foreground/[0.03]">
          {icon}
        </div>
        <h1 className="mt-5 font-display text-3xl tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[118px] w-full" />
        ))}
      </div>
      <Skeleton className="h-11 w-full max-w-2xl" />
      <div className="grid gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
