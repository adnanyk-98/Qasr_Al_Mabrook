import { and, desc, eq, gt, isNull, or, sql, type SQL } from "drizzle-orm";

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

export async function listAdminUsersPaginated({
  page = 1,
  pageSize = 10,
  search = "",
  role,
  status,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "ALL";
  status?: "ACTIVE" | "DISABLED" | "ALL";
}) {
  const offset = Math.max(0, (page - 1) * pageSize);
  const searchTerm = search.trim();

  const clauses: SQL[] = [];

  if (searchTerm) {
    const searchClause = or(
      sql`LOWER(${adminUsers.displayName}) LIKE ${"%" + searchTerm.toLowerCase() + "%"}`,
      sql`LOWER(${adminUsers.email}) LIKE ${"%" + searchTerm.toLowerCase() + "%"}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  if (role && role !== "ALL") {
    clauses.push(eq(adminUsers.role, role));
  }

  if (status && status !== "ALL") {
    clauses.push(eq(adminUsers.status, status));
  }

  const baseWhere = clauses.length ? and(...clauses) : undefined;

  const totalRows = await db.select({ count: sql<number>`count(*)` }).from(adminUsers).where(baseWhere);
  const rows = await db
    .select()
    .from(adminUsers)
    .where(baseWhere)
    .orderBy(desc(adminUsers.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  };
}

export async function createAdminUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  status?: "ACTIVE" | "DISABLED";
  permissions?: string[];
}) {
  const rows = await db
    .insert(adminUsers)
    .values({
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      role: input.role,
      status: input.status ?? "ACTIVE",
      permissions: input.permissions ?? [],
    })
    .returning();

  return rows[0] ?? null;
}

export async function updateAdminUser(input: {
  id: string;
  email?: string;
  displayName?: string;
  role?: "SUPER_ADMIN" | "ADMIN";
  status?: "ACTIVE" | "DISABLED";
  permissions?: string[];
}) {
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.email) values.email = input.email.trim().toLowerCase();
  if (input.displayName) values.displayName = input.displayName.trim();
  if (input.role) values.role = input.role;
  if (input.status) values.status = input.status;
  if (input.permissions) values.permissions = input.permissions;

  const rows = await db
    .update(adminUsers)
    .set(values)
    .where(eq(adminUsers.id, input.id))
    .returning();

  return rows[0] ?? null;
}

export async function setAdminUserLastLogin(id: string) {
  const rows = await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function countActiveSuperAdmins() {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "SUPER_ADMIN"), eq(adminUsers.status, "ACTIVE")));

  return Number(rows[0]?.count ?? 0);
}

export async function deleteAdminUserById(id: string) {
  const rows = await db.delete(adminUsers).where(eq(adminUsers.id, id)).returning();
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
