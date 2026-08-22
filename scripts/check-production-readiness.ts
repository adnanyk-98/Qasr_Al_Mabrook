import { config } from "dotenv";

import { validateProductionReadiness } from "@/lib/production-readiness";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const stageArgument = process.argv.find((argument) => argument.startsWith("--stage="));
const stage =
  stageArgument?.slice("--stage=".length) ?? process.env.DEPLOYMENT_STAGE ?? "local";
const result = validateProductionReadiness({
  stage,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  databaseUrl: process.env.DATABASE_URL,
  directDatabaseUrl: process.env.DIRECT_DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2BucketName: process.env.R2_BUCKET_NAME,
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  emailFrom: process.env.EMAIL_FROM,
  emailTo: process.env.EMAIL_TO,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
});

for (const warning of result.warnings)
  console.warn(`WARNING [${warning.key}] ${warning.message}`);
for (const error of result.errors)
  console.error(`ERROR [${error.key}] ${error.message}`);

if (!result.ok) process.exit(1);
console.log(`Readiness configuration passed for ${result.stage}.`);
