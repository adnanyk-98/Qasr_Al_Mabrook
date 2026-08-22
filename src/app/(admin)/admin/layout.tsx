import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/server/services/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
