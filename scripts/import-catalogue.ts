import { config } from "dotenv";

import { discoverCatalogue, validateCatalogueSource } from "@/lib/catalogue-discovery";
import {
  buildCatalogueImportPlan,
  validateLocalImportMode,
} from "@/lib/catalogue-import";
import { isLocalDatabaseUrl } from "@/lib/catalogue-import";

const sourceArgument = process.argv.find((argument) =>
  argument.startsWith("--source="),
);
config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });
const stageArgument = process.argv.find((argument) => argument.startsWith("--stage="));
const source = sourceArgument?.slice("--source=".length) ?? "./catalogue";
const stage = stageArgument?.slice("--stage=".length) ?? "local";

const dbUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
const mode = validateLocalImportMode(stage, true, dbUrl);
if (stage !== "local") {
  console.error(mode.message);
  process.exit(1);
}

async function main() {
  await validateCatalogueSource(source);
  const report = await discoverCatalogue(source);
  const plan = buildCatalogueImportPlan(report);

  console.log(`SOURCE: ${report.source}`);
  console.log(
    `MANIFEST: ${report.manifestUsed ? "used" : "not present; deterministic filename parsing used"}`,
  );
  console.log(`CATEGORIES (${report.categories.length}):`);
  for (const category of plan.categories)
    console.log(
      `- UPSERT ${category.name} [slug=${category.slug}, status=${plan.status}]`,
    );
  console.log(`PRODUCTS (${report.products.length}):`);
  for (const product of report.products) {
    const productSlug = plan.products.find((candidate) => candidate.name === product.name && candidate.category === product.category)?.slug ?? "";
    console.log(
      `- UPSERT ${product.category} / ${product.name} [slug=${productSlug}, status=${plan.status}, images=${product.images.length}]`,
    );
    for (const image of product.images) {
        const { generateR2ObjectKey, generateR2PublicUrl, readOriginalProductImageMetadata } = await import("@/lib/catalogue-import");
        const objectKey = generateR2ObjectKey(productSlug, image.filename);
        const publicUrl = process.env.R2_PUBLIC_BASE_URL ? generateR2PublicUrl(process.env.R2_PUBLIC_BASE_URL, objectKey) : "(R2_PUBLIC_BASE_URL not set)";
        console.log(
          `  - ${image.filename} [${image.role}]${image.width && image.height ? ` ${image.width}x${image.height}` : ""}`,
        );
        console.log(`    SOURCE: ${report.source}/${image.relativePath}`);

        try {
          const srcBuffer = await import("node:fs/promises").then((mod) => mod.readFile(`${report.source}/${image.relativePath}`));
          const metadata = await readOriginalProductImageMetadata(srcBuffer);
          console.log(`    ORIGINAL DIMENSIONS: ${metadata.width ?? "unknown"}x${metadata.height ?? "unknown"}`);
          console.log("    PRODUCT IMAGE POLICY: upload original bytes unchanged to R2");
        } catch (err) {
          console.log(`    IMAGE METADATA ERROR: ${err instanceof Error ? err.message : String(err)}`);
        }

        console.log(`    R2 OBJECT KEY: ${objectKey}`);
        console.log(`    R2 PUBLIC URL: ${publicUrl}`);
        console.log(`    SORT_ORDER: ${image.sortOrder ?? "(none)"}`);
        console.log(`    PRIMARY: ${image.filename === product.primaryImage}`);
    }
    console.log(`  PRIMARY: ${product.primaryImage}`);
  }
  console.log(
    `IMAGE TOTAL: ${plan.totalImages} (${plan.totalGalleryImages} gallery, ${plan.totalMarketingImages} marketing)`,
  );
  if (report.ignoredDirectories.length)
    console.log(`IGNORED DIRECTORIES: ${report.ignoredDirectories.join(", ")}`);
  if (report.unassignedImages.length)
    console.log(`UNASSIGNED IMAGES: ${report.unassignedImages.join(" | ")}`);
  if (report.ambiguousImages.length)
    console.log(`AMBIGUOUS IMAGES: ${report.ambiguousImages.join(" | ")}`);
  if (report.manifestErrors.length)
    console.log(`MANIFEST ERRORS: ${report.manifestErrors.join(" | ")}`);

  console.log(
    `SKIPPED UNRESOLVED: ${plan.skippedUnresolvedImages.length ? plan.skippedUnresolvedImages.join(" | ") : "none"}`,
  );
  console.log(
    `SKIPPED UNASSIGNED: ${plan.skippedUnassignedImages.length ? plan.skippedUnassignedImages.join(" | ") : "none"}`,
  );
  console.log("MODE: ACTIVE DEVELOPMENT IMPORT");

  if (report.manifestErrors.length) {
    console.error("Import refused while manifest errors remain.");
    process.exitCode = 2;
    return;
  }

  if (!mode.ok) {
    console.log(mode.message);
    return;
  }

  const { importLocalCatalogue } = await import("@/server/catalogue-import");
  await importLocalCatalogue(report);
  console.log("Local catalogue import completed.");
}

void main();
