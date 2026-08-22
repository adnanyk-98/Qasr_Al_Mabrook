import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { serverEnv } from "@/config/env";
import { adminUsers } from "@/db/schema";
import {
  createAdminSession,
  findAdminUserByEmail,
  getAdminSessionWithUser,
  revokeSession,
} from "@/server/repositories/admin";

export const ADMIN_SESSION_COOKIE = "qm_admin_session";
export const DEFAULT_SESSION_TTL_DAYS = 30;

export const SCRYPT_PARAMETERS = {
  N: 16384,
  r: 8,
  p: 1,
  keyLength: 64,
  maxmem: 32 * 1024 * 1024,
} as const;

const SCRYPT_HASH_PATTERN = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([a-fA-F0-9]+)\$([a-fA-F0-9]+)$/;

async function deriveScrypt(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey as Buffer);
    });
  });
}

export type AdminUserRecord = typeof adminUsers.$inferSelect;

function parseScryptHash(storedHash: string) {
  const match = storedHash.match(SCRYPT_HASH_PATTERN);

  if (!match) {
    return null;
  }

  const [, nText, rText, pText, saltHex, derivedHex] = match;
  const N = Number(nText);
  const r = Number(rText);
  const p = Number(pText);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return null;
  }

  return {
    N,
    r,
    p,
    salt: Buffer.from(saltHex, "hex"),
    derived: Buffer.from(derivedHex, "hex"),
  };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await deriveScrypt(password, salt, SCRYPT_PARAMETERS.keyLength, {
    N: SCRYPT_PARAMETERS.N,
    r: SCRYPT_PARAMETERS.r,
    p: SCRYPT_PARAMETERS.p,
    maxmem: SCRYPT_PARAMETERS.maxmem,
  });

  return `scrypt$${SCRYPT_PARAMETERS.N}$${SCRYPT_PARAMETERS.r}$${SCRYPT_PARAMETERS.p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  if (!storedHash) {
    return false;
  }

  const parsed = parseScryptHash(storedHash);

  if (!parsed) {
    return false;
  }

  const derived = await deriveScrypt(password, parsed.salt, parsed.derived.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: SCRYPT_PARAMETERS.maxmem,
  });

  if (derived.length !== parsed.derived.length) {
    return false;
  }

  return timingSafeEqual(derived, parsed.derived);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  const secret = serverEnv.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for secure admin session hashing.");
  }

  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await getAdminSessionWithUser(hashSessionToken(token));

  if (!session) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireAdminSession() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireRole(role: "SUPER_ADMIN" | "ADMIN") {
  const admin = await requireAdminSession();

  if (admin.role !== role && admin.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return admin;
}

export async function loginAdmin(email: string, password: string) {
  const user = await findAdminUserByEmail(email);

  if (!user) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  if (user.status !== "ACTIVE") {
    return { ok: false as const, error: "This admin account is disabled." };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const token = createSessionToken();
  const cookieStore = await cookies();

  await createAdminSession({
    adminUserId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + DEFAULT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return { ok: true as const, user };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await revokeSession(hashSessionToken(token));
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
