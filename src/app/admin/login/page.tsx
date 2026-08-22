import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { checkRateLimit, getRequestKey } from "@/server/rate-limit";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestHeaders = await headers();
  const ip = getRequestKey(requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"));
  const rateLimit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);

  if (!rateLimit.allowed || !email || !password) {
    redirect("/admin/login?error=invalid-input");
  }

  const { ok, error } = await (await import("@/server/services/admin-auth")).loginAdmin(email, password);

  if (!ok) {
    redirect(`/admin/login?error=${encodeURIComponent(error)}`);
  }

  redirect("/admin");
}

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--brand-surface)] px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin access</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Sign in</h1>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          <Button type="submit" className="w-full" size="lg">Sign in</Button>
        </form>
      </div>
    </main>
  );
}
