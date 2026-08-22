import { z } from "zod";

export const deploymentStages = ["local", "staging", "production"] as const;
export type DeploymentStage = (typeof deploymentStages)[number];

const urlSchema = z.string().url();

export type ProductionReadinessInput = {
  stage: string;
  siteUrl?: string;
  databaseUrl?: string;
  directDatabaseUrl?: string;
  authSecret?: string;
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicBaseUrl?: string;
  emailFrom?: string;
  emailTo?: string;
  smtpHost?: string;
  smtpPort?: string;
};

export type ReadinessIssue = {
  key: string;
  message: string;
};

export type ProductionReadinessResult = {
  stage: DeploymentStage | null;
  errors: ReadinessIssue[];
  warnings: ReadinessIssue[];
  ok: boolean;
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function requireValue(
  errors: ReadinessIssue[],
  key: string,
  value: string | undefined,
  message: string,
) {
  if (!hasValue(value)) errors.push({ key, message });
}

function requireUrl(
  errors: ReadinessIssue[],
  key: string,
  value: string | undefined,
  message: string,
) {
  if (!hasValue(value)) {
    errors.push({ key, message: `${key} is required.` });
    return;
  }
  if (!urlSchema.safeParse(value).success) {
    errors.push({ key, message });
  }
}

function requireEmail(
  errors: ReadinessIssue[],
  key: string,
  value: string | undefined,
) {
  if (!hasValue(value)) {
    errors.push({ key, message: `${key} is required.` });
    return;
  }
  if (!z.string().email().safeParse(value).success) {
    errors.push({ key, message: `${key} must be a valid email address.` });
  }
}

function requirePort(errors: ReadinessIssue[], key: string, value: string | undefined) {
  if (!hasValue(value)) {
    errors.push({ key, message: `${key} is required.` });
    return;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push({ key, message: `${key} must be an integer between 1 and 65535.` });
  }
}

export function validateProductionReadiness(
  input: ProductionReadinessInput,
): ProductionReadinessResult {
  const errors: ReadinessIssue[] = [];
  const warnings: ReadinessIssue[] = [];
  const stage = deploymentStages.includes(input.stage as DeploymentStage)
    ? (input.stage as DeploymentStage)
    : null;

  if (!stage) {
    errors.push({
      key: "stage",
      message: "DEPLOYMENT_STAGE must be local, staging, or production.",
    });
    return { stage, errors, warnings, ok: false };
  }

  requireUrl(
    errors,
    "NEXT_PUBLIC_SITE_URL",
    input.siteUrl,
    "NEXT_PUBLIC_SITE_URL must be a valid URL.",
  );
  if (input.siteUrl && urlSchema.safeParse(input.siteUrl).success) {
    const siteUrl = new URL(input.siteUrl);
    if (stage !== "local" && siteUrl.protocol !== "https:") {
      errors.push({
        key: "NEXT_PUBLIC_SITE_URL",
        message: "Staging and production site URLs must use HTTPS.",
      });
    }
    if (
      stage === "production" &&
      ["localhost", "127.0.0.1"].includes(siteUrl.hostname)
    ) {
      errors.push({
        key: "NEXT_PUBLIC_SITE_URL",
        message: "Production site URL cannot point to localhost.",
      });
    }
  }

  requireUrl(
    errors,
    "DATABASE_URL",
    input.databaseUrl,
    "DATABASE_URL must be a valid PostgreSQL URL.",
  );
  requireValue(errors, "AUTH_SECRET", input.authSecret, "AUTH_SECRET is required.");
  if (input.authSecret && input.authSecret.length < 32) {
    errors.push({
      key: "AUTH_SECRET",
      message: "AUTH_SECRET must contain at least 32 characters.",
    });
  }

  if (stage !== "local") {
    requireUrl(
      errors,
      "DIRECT_DATABASE_URL",
      input.directDatabaseUrl,
      "DIRECT_DATABASE_URL must be a valid PostgreSQL URL.",
    );
    requireValue(
      errors,
      "R2_ACCOUNT_ID",
      input.r2AccountId,
      "R2_ACCOUNT_ID is required outside local development.",
    );
    requireValue(
      errors,
      "R2_ACCESS_KEY_ID",
      input.r2AccessKeyId,
      "R2_ACCESS_KEY_ID is required outside local development.",
    );
    requireValue(
      errors,
      "R2_SECRET_ACCESS_KEY",
      input.r2SecretAccessKey,
      "R2_SECRET_ACCESS_KEY is required outside local development.",
    );
    requireValue(
      errors,
      "R2_BUCKET_NAME",
      input.r2BucketName,
      "R2_BUCKET_NAME is required outside local development.",
    );
    requireUrl(
      errors,
      "R2_PUBLIC_BASE_URL",
      input.r2PublicBaseUrl,
      "R2_PUBLIC_BASE_URL must be a valid URL outside local development.",
    );

    requireEmail(errors, "EMAIL_FROM", input.emailFrom);
    requireEmail(errors, "EMAIL_TO", input.emailTo);
    requireValue(
      errors,
      "SMTP_HOST",
      input.smtpHost,
      "SMTP_HOST is required outside local development.",
    );
    requirePort(errors, "SMTP_PORT", input.smtpPort);
  }

  if (stage === "local") {
    warnings.push({
      key: "external-services",
      message:
        "Local readiness does not verify database, R2, email, backups, monitoring, DNS, or HTTPS.",
    });
  }

  return { stage, errors, warnings, ok: errors.length === 0 };
}

export function validateR2Configuration(input: {
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicBaseUrl?: string;
}) {
  const errors: ReadinessIssue[] = [];
  if (!hasValue(input.r2AccountId))
    errors.push({ key: "R2_ACCOUNT_ID", message: "R2_ACCOUNT_ID is required." });
  if (!hasValue(input.r2AccessKeyId))
    errors.push({ key: "R2_ACCESS_KEY_ID", message: "R2_ACCESS_KEY_ID is required." });
  if (!hasValue(input.r2SecretAccessKey))
    errors.push({ key: "R2_SECRET_ACCESS_KEY", message: "R2_SECRET_ACCESS_KEY is required." });
  if (!hasValue(input.r2BucketName))
    errors.push({ key: "R2_BUCKET_NAME", message: "R2_BUCKET_NAME is required." });

  if (!hasValue(input.r2PublicBaseUrl)) {
    errors.push({ key: "R2_PUBLIC_BASE_URL", message: "R2_PUBLIC_BASE_URL is required." });
  } else {
    if (!urlSchema.safeParse(input.r2PublicBaseUrl).success) {
      errors.push({ key: "R2_PUBLIC_BASE_URL", message: "R2_PUBLIC_BASE_URL must be a valid URL." });
    } else {
      try {
        const u = new URL(input.r2PublicBaseUrl as string);
        if (u.protocol !== "https:") {
          errors.push({ key: "R2_PUBLIC_BASE_URL", message: "R2_PUBLIC_BASE_URL must use HTTPS." });
        }
      } catch {
        errors.push({ key: "R2_PUBLIC_BASE_URL", message: "R2_PUBLIC_BASE_URL must be a valid URL." });
      }
    }
  }

  return { ok: errors.length === 0, errors } as const;
}
