import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/db");
  const { homepageSections } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const rows = await db.select().from(homepageSections).where(eq(homepageSections.id, "c259dd8f-3010-4c1c-aebd-fe68bf347d13")).limit(1);
  const section = rows[0];
  if (!section || section.status !== "PUBLISHED") throw new Error("Super Market published hero was not found.");
  const configuration = (section.configurationJson ?? {}) as Record<string, unknown>;
  if (configuration.ctaHref !== "/en/store-locator" && configuration.ctaHref !== "/store-locator") {
    throw new Error(`Unexpected Super Market CTA: ${String(configuration.ctaHref ?? "")}`);
  }
  if (configuration.ctaHref === "/en/store-locator") {
    await db.update(homepageSections).set({ configurationJson: { ...configuration, ctaHref: "/store-locator" } }).where(eq(homepageSections.id, section.id));
    console.log("Normalized Super Market CTA: /en/store-locator -> /store-locator");
  } else {
    console.log("Super Market CTA already normalized: /store-locator");
  }
  process.exit(0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});