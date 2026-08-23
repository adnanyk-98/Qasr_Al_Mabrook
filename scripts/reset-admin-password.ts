import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const stage = process.env.DEPLOYMENT_STAGE;
const confirmation = process.env.DEV_PASSWORD_RESET_CONFIRMATION;

if (!stage || !["development", "local"].includes(stage)) {
  console.error(
    "Refusing admin password reset: DEPLOYMENT_STAGE must be 'development' or 'local'.",
  );
  process.exit(1);
}

if (confirmation !== "RESET_ADMIN_PASSWORD") {
  console.error(
    "Refusing admin password reset: set DEV_PASSWORD_RESET_CONFIRMATION=RESET_ADMIN_PASSWORD explicitly.",
  );
  process.exit(1);
}

if (!process.env.ADMIN_BOOTSTRAP_EMAIL || !process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  console.error(
    "Refusing admin password reset: ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required.",
  );
  process.exit(1);
}

async function main() {
  const { findAdminUserByEmail } = await import("@/server/repositories/admin");
  const { db } = await import("@/db");
  const { adminUsers } = await import("@/db/schema");
  const { hashPassword } = await import("@/server/services/admin-auth");
  const { eq } = await import("drizzle-orm");

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL!.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD!;

  const existing = await findAdminUserByEmail(email);

  if (!existing) {
    console.error(`Admin user not found for ${email}. Aborting.`);
    process.exit(1);
  }

  const newHash = await hashPassword(password);

  await db.update(adminUsers).set({ passwordHash: newHash }).where(eq(adminUsers.email, email));

  console.log(`Admin password reset successfully for ${email}`);
}

void main();
