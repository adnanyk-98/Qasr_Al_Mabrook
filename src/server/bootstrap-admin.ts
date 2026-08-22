import { eq } from "drizzle-orm";

import { serverEnv } from "@/config/env";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { hashPassword } from "@/server/services/admin-auth";

export async function ensureBootstrapAdmin() {
  const email = serverEnv.ADMIN_BOOTSTRAP_EMAIL;
  const password = serverEnv.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const created = await db
    .insert(adminUsers)
    .values({
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      displayName: "System Administrator",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    })
    .returning();

  return created[0] ?? null;
}
