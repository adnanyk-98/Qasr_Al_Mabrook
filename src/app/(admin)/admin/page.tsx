import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function AdminHomePage() {
  const admin = await requireAdminSession();

  async function logoutAction() {
    "use server";
    const { logoutAdmin } = await import("@/server/services/admin-auth");
    await logoutAdmin();
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Administration</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--brand-primary-light)] px-3 py-1 text-sm font-medium text-[var(--brand-primary)]">
              {admin.role}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">Sign out</Button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Products", value: "Manage catalogue", href: "/admin/products" },
            { label: "Categories", value: "Organize hierarchy", href: "/admin/categories" },
            { label: "Enquiries", value: "Review requests", href: "/admin/enquiries" },
            { label: "Homepage", value: "Update content", href: "/admin/homepage" },
            { label: "Deals", value: "Manage homepage offers", href: "/admin/deals" },
            { label: "Users", value: "Manage admin access", href: "/admin/users" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardHeader className="bg-[var(--brand-surface-alt)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">{item.label}</p>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-[var(--text-muted)]">{item.value}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
