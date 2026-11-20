import type { Metadata } from "next";
import { JsonLd, breadcrumbLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin",
    description:
      "Internal operations dashboard for Build For Good — community records, member and project submissions, and the stewardship tools behind the public site.",
    path: "/admin",
  }),
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Admin", path: "/admin" },
        ])}
      />
      <AdminDashboard />
    </>
  );
}
