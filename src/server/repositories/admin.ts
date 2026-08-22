import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";

export async function findAdminUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);

  return rows[0] ?? null;
}

export async function findAdminUserById(id: string) {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function listAdminUsers() {
  return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
}

export async function createAdminUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  status?: "ACTIVE" | "DISABLED";
}) {
  const rows = await db
    .insert(adminUsers)
    .values({
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      role: input.role,
      status: input.status ?? "ACTIVE",
    })
    .returning();

  return rows[0] ?? null;
}

export async function createAdminSession(input: {
  adminUserId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const rows = await db
    .insert(adminSessions)
    .values({
      adminUserId: input.adminUserId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })
    .returning();

  return rows[0] ?? null;
}

export async function findActiveSessionByTokenHash(tokenHash: string) {
  const rows = await db
    .select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getAdminSessionWithUser(tokenHash: string) {
  const session = await findActiveSessionByTokenHash(tokenHash);

  if (!session) {
    return null;
  }

  const rows = await db
    .select({
      session: adminSessions,
      user: adminUsers,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(and(eq(adminSessions.id, session.id), eq(adminUsers.status, "ACTIVE")))
    .limit(1);

  return rows[0] ?? null;
}

export async function revokeSession(tokenHash: string) {
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.tokenHash, tokenHash));
}
