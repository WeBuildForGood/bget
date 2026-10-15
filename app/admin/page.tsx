import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Admin",
  description:
    "Internal operations dashboard for Build For Good — community records, submissions, and stewardship tools.",
  path: "/admin",
});

export default function AdminPage() {
  return <AdminDashboard />;
}
