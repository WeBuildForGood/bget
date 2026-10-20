import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";
import { SITE } from "@/lib/site";
import { Shield, ExternalLink, Database, Zap } from "lucide-react";

/**
 * Build For Good Admin — now powered by Navrix (swnk-hq).
 * 
 * Navrix HQ (swnk-hq) is the parent organization dashboard at https://navrix.tech
 * Its /portal is the operative control layer (currently hardening).
 * This page provides immediate access to:
 *   1. BGET's local admin API (data in D1: buildforgood-prod)
 *   2. Link to Navrix HQ portal for organization-wide ops
 *   3. Core worker endpoints (shared swnk-core / buildforgood worker)
 */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin",
    description:
      "Internal operations dashboard for Build For Good — community records, member and project submissions, and the stewardship tools behind the public site. Powered by Navrix (swnk-core).",
    path: "/admin",
  }),
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const navrixHqUrl = "https://navrix.tech";
  const navrixPortalUrl = `${navrixHqUrl}/portal`;
  
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Admin", path: "/admin" },
        ])}
      />
      
      <main className="relative min-h-screen bg-background">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-10 lg:py-12">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-6 mb-8">
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
          </header>

          {/* Navrix HQ Integration Card */}
          <section className="mb-10 rounded-xl border border-foreground/10 bg-card p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#eca8d6]/10">
                    <Shield className="size-5 text-[#eca8d6]" />
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      Navrix HQ — Organization Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono">
                      swnk-hq → navrix.tech
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Build For Good is a venture under Navrix. The central operative portal lives at
                  <span className="font-mono">navrix.tech/portal</span> (currently in pre-release hardening).
                  All org-wide data — ventures, members, analytics — flows through the shared
                  <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">swnk-core</code> worker.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={navrixPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[#eca8d6]/30 bg-[#eca8d6]/5 px-5 py-3 text-sm font-medium text-[#eca8d6] hover:bg-[#eca8d6]/10 transition-colors"
                >
                  <ExternalLink className="size-4" />
                  Open Navrix Portal
                </a>
                <a
                  href={navrixHqUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-muted/50 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Database className="size-4" />
                  View Navrix HQ
                </a>
              </div>
            </div>
          </section>

          {/* BGET Local Admin (D1 data) */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <Zap className="size-5 text-[#eca8d6]" />
              Build For Good — Local Data Admin
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              Direct access to BGET's data in D1 (<code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">buildforgood-prod</code>). 
              This is the same database the <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">swnk-core</code> worker reads/writes.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AdminCard
                title="Applications"
                description="Membership applications from /membership"
                href="/admin/applications"
                icon="📝"
                stats="GET /api/admin/applications"
              />
              <AdminCard
                title="Problems"
                description="Public problem submissions & lifecycle"
                href="/admin/problems"
                icon="❌"
                stats="GET /api/admin/problems"
              />
              <AdminCard
                title="Projects"
                description="Approved, live, pilot & archived projects"
                href="/admin/projects"
                icon="💼"
                stats="GET /api/admin/projects"
              />
              <AdminCard
                title="Suggestions"
                description="Community improvement ideas"
                href="/admin/suggestions"
                icon="💡"
                stats="GET /api/admin/suggestions"
              />
              <AdminCard
                title="Feedback"
                description="Site & community feedback"
                href="/admin/feedback"
                icon="ℹ️"
                stats="GET /api/admin/feedback"
              />
              <AdminCard
                title="Messages"
                description="Contact form submissions"
                href="/admin/messages"
                icon="📧"
                stats="GET /api/admin/messages"
              />
            </div>
          </section>

          {/* Navrix Core API Reference */}
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <Database className="size-5 text-cyan-400" />
              Navrix Core API (swnk-core / buildforgood worker)
            </h2>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              All data flows through the shared worker. These endpoints power both BGET and Navrix HQ.
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
              {[
                { label: "Members", path: "/api/admin/members", method: "GET" },
                { label: "Applications", path: "/api/admin/applications", method: "GET" },
                { label: "Problems", path: "/api/admin/problems", method: "GET" },
                { label: "Projects", path: "/api/admin/projects", method: "GET" },
                { label: "Suggestions", path: "/api/admin/suggestions", method: "GET" },
                { label: "Feedback", path: "/api/admin/feedback", method: "GET" },
                { label: "Messages", path: "/api/admin/messages", method: "GET" },
                { label: "Summary", path: "/api/admin/summary", method: "GET" },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center justify-between rounded-lg border border-foreground/10 bg-card p-3 font-mono"
                >
                  <span className="text-foreground">{ep.label}</span>
                  <code className="text-muted-foreground bg-muted px-2 py-1 rounded">
                    {ep.method} {ep.path}
                  </code>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function AdminCard({
  title,
  description,
  href,
  icon,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  stats: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-foreground/10 bg-card p-5 hover:border-[#eca8d6]/30 hover:bg-[#eca8d6]/5 transition-colors"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-medium text-foreground group-hover:text-[#eca8d6] transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-3 text-[10px] font-mono text-muted-foreground/70">{stats}</p>
    </Link>
  );
}
