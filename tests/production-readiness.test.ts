import assert from "node:assert/strict";
import test from "node:test";

import { validateProductionReadiness } from "@/lib/production-readiness";
import {
  buildCatalogueImportPlan,
  validateLocalImportMode,
} from "@/lib/catalogue-import";

const baseInput = {
  stage: "production",
  siteUrl: "https://example.com",
  databaseUrl: "postgresql://app:secret@example.com/app",
  directDatabaseUrl: "postgresql://admin:secret@example.com/app",
  authSecret: "a".repeat(32),
  r2AccountId: "account",
  r2AccessKeyId: "access",
  r2SecretAccessKey: "secret",
  r2BucketName: "production",
  r2PublicBaseUrl: "https://images.example.com",
  emailFrom: "from@example.com",
  emailTo: "to@example.com",
  smtpHost: "smtp.example.com",
  smtpPort: "465",
};

test("accepts complete production configuration", () => {
  assert.equal(validateProductionReadiness(baseInput).ok, true);
});

test("rejects production localhost and incomplete service configuration", () => {
  const result = validateProductionReadiness({
    stage: "production",
    siteUrl: "http://localhost:3000",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.key === "NEXT_PUBLIC_SITE_URL"));
  assert.ok(result.errors.some((error) => error.key === "DATABASE_URL"));
  assert.ok(result.errors.some((error) => error.key === "R2_BUCKET_NAME"));
});

test("allows local configuration with an explicit external-service warning", () => {
  const result = validateProductionReadiness({
    stage: "local",
    siteUrl: "http://localhost:3000",
    authSecret: "a".repeat(32),
    databaseUrl: "postgresql://localhost/app",
  });
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((warning) => warning.key === "external-services"));
});

test("requires HTTPS for staging", () => {
  const result = validateProductionReadiness({
    ...baseInput,
    stage: "staging",
    siteUrl: "http://staging.example.com",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.key === "NEXT_PUBLIC_SITE_URL"));
});

test("reports malformed URLs without throwing", () => {
  const result = validateProductionReadiness({
    ...baseInput,
    siteUrl: "not a url",
    databaseUrl: "not a database url",
    directDatabaseUrl: "also not a database url",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.key === "NEXT_PUBLIC_SITE_URL"));
  assert.ok(result.errors.some((error) => error.key === "DATABASE_URL"));
  assert.ok(result.errors.some((error) => error.key === "DIRECT_DATABASE_URL"));
});

test("distinguishes invalid email and SMTP port configuration", () => {
  const result = validateProductionReadiness({
    ...baseInput,
    emailFrom: "invalid",
    smtpPort: "not-a-port",
  });
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) => error.key === "EMAIL_FROM" && error.message.includes("valid email"),
    ),
  );
  assert.ok(
    result.errors.some(
      (error) => error.key === "SMTP_PORT" && error.message.includes("integer"),
    ),
  );
});

test("requires local stage and explicit confirmation for catalogue mutation", () => {
  assert.equal(validateLocalImportMode("production", true).ok, false);
  assert.equal(validateLocalImportMode("local", false).ok, false);
  // provide a local DATABASE_URL when checking confirmed local imports
  assert.equal(validateLocalImportMode("local", true, "postgresql://localhost/dev").ok, true);
});

test("builds a deterministic import plan without unresolved images", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: ["Measuring Tape"],
    products: [
      {
        category: "Measuring Tape",
        name: "5M Measuring Tape Green",
        images: [
          {
            filename: "5M-#01.jpg",
            relativePath: "Measuring Tape/5M-#01.jpg",
            role: "gallery",
            sortOrder: 1,
            width: 2500,
            height: 2500,
          },
        ],
        primaryImage: "5M-#01.jpg",
      },
    ],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: ["Measuring Tape/support.jpg"],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  assert.equal(plan.status, "PUBLISHED");
  assert.equal(plan.products[0].slug, "5m-measuring-tape-green");
  assert.deepEqual(plan.skippedUnresolvedImages, ["Measuring Tape/support.jpg"]);
  assert.equal(plan.totalImages, 1);
});

test("reconciles the catalogue image total without counting unresolved files", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: [
      "Adivasi Oil",
      "Cloth Piece",
      "Fancy Suit",
      "Measuring Tape",
      "Pajama",
    ],
    products: [
      ...[
        ["Adivasi Oil", 2],
        ["Cloth Piece", 3],
        ["Fancy Suit", 3],
        ["Pajama", 4],
        ["5.5M Measuring Tape Green", 2],
        ["5M Measuring Tape Green", 2],
        ["5M Measuring Tape Orange", 2],
        ["7.5M Measuring Tape Green", 2],
      ].map(([name, count]) => ({
        category:
          name === "Adivasi Oil" ||
          name === "Cloth Piece" ||
          name === "Fancy Suit" ||
          name === "Pajama"
            ? name
            : "Measuring Tape",
        name: name as string,
        images: Array.from({ length: count as number }, (_, index) => ({
          filename: `${name}-${index + 1}.jpg`,
          relativePath: `${name}/${index + 1}.jpg`,
          role: "gallery" as const,
          sortOrder: index + 1,
        })),
        primaryImage: `${name}-1.jpg`,
      })),
    ],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: ["Measuring Tape/support.jpg"],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  assert.equal(plan.totalImages, 20);
  assert.equal(plan.skippedUnresolvedImages.length, 1);
});
