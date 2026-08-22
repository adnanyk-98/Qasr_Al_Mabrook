import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const stage = process.env.DEPLOYMENT_STAGE;
const confirmation = process.env.ADMIN_BOOTSTRAP_CONFIRMATION;

if (!stage || !["staging", "production"].includes(stage)) {
  console.error(
    "Refusing admin bootstrap: DEPLOYMENT_STAGE must be staging or production.",
  );
  process.exit(1);
}

if (confirmation !== "BOOTSTRAP_ADMIN") {
  console.error(
    "Refusing admin bootstrap: set ADMIN_BOOTSTRAP_CONFIRMATION=BOOTSTRAP_ADMIN explicitly.",
  );
  process.exit(1);
}

if (!process.env.ADMIN_BOOTSTRAP_EMAIL || !process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  console.error(
    "Refusing admin bootstrap: ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required.",
  );
  process.exit(1);
}

async function main() {
  const { ensureBootstrapAdmin } = await import("@/server/bootstrap-admin");
  const admin = await ensureBootstrapAdmin();
  console.log(
    admin
      ? `Bootstrap admin verified for ${admin.email}.`
      : "No bootstrap admin was created.",
  );
}

void main();
