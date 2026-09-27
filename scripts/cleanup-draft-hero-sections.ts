import { config } from "dotenv";

config({ path: ".env.local" });

const preservedHeroIds = new Set([
  "c259dd8f-3010-4c1c-aebd-fe68bf347d13",
  "629a0342-1130-4079-b5b6-26fcab8439eb",
  "af120d70-5905-4ed1-86d5-1d42d7a08871",
  "ec760456-07d2-455e-b040-f4c6684e60d6",
]);

async function main() {
  const { db } = await import("@/db");
  const { homepageSections } = await import("@/db/schema");
  const { inArray } = await import("drizzle-orm");

  const allSections = await db.select().from(homepageSections);
  const heroRows = allSections
    .filter((row) => row.sectionType.toLowerCase() === "hero")
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || a.createdAt.getTime() - b.createdAt.getTime());
  const publishedRows = heroRows.filter((row) => row.status === "PUBLISHED");
  const draftRows = heroRows.filter((row) => row.status === "DRAFT");
  const draftWithMedia = draftRows.filter((row) => {
    const configuration = (row.configurationJson ?? {}) as Record<string, unknown>;
    return Boolean(configuration.imageUrl || configuration.desktopImageUrl || configuration.mobileImageUrl);
  });

  const expectedPublished = [
    ["c259dd8f-3010-4c1c-aebd-fe68bf347d13", "1"],
    ["629a0342-1130-4079-b5b6-26fcab8439eb", "2"],
    ["af120d70-5905-4ed1-86d5-1d42d7a08871", "3"],
    ["ec760456-07d2-455e-b040-f4c6684e60d6", "4"],
  ];
  const publishedShape = publishedRows.map((row) => [row.id, row.sortOrder]);
  if (JSON.stringify(publishedShape) !== JSON.stringify(expectedPublished)) {
    throw new Error(`Published hero audit mismatch: ${JSON.stringify(publishedShape)}`);
  }
  if (draftWithMedia.length > 0) {
    throw new Error(`Refusing to delete drafts with media: ${draftWithMedia.map((row) => row.id).join(", ")}`);
  }
  if (draftRows.some((row) => preservedHeroIds.has(row.id))) {
    throw new Error("Refusing to delete a preserved published hero ID.");
  }

  console.log(`HERO RECORDS BEFORE: ${heroRows.length}`);
  for (const row of heroRows) {
    const configuration = (row.configurationJson ?? {}) as Record<string, unknown>;
    const preserved = row.status === "PUBLISHED" && preservedHeroIds.has(row.id);
    console.log([
      row.id,
      row.status,
      row.sortOrder,
      String(configuration.title ?? ""),
      String(configuration.imageAlt ?? ""),
      String(configuration.desktopImageUrl ?? configuration.imageUrl ?? ""),
      String(configuration.mobileImageUrl ?? ""),
      preserved ? "PRESERVE" : "DELETE",
      preserved ? "Legitimate published hero slide" : "DRAFT with empty configuration and no media references",
    ].join(" | "));
  }
  console.log(`PRESERVED PUBLISHED HEROES: ${publishedRows.length}`);
  console.log(`DRAFTS TO DELETE: ${draftRows.length}`);

  if (!process.argv.includes("--apply")) {
    console.log("Dry run only. No database changes made.");
    await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
    return;
  }

  const draftIds = draftRows.map((row) => row.id);
  await db.transaction(async (transaction) => {
    if (draftIds.length > 0) {
      await transaction.delete(homepageSections).where(inArray(homepageSections.id, draftIds));
    }
  });

  const remaining = await db.select().from(homepageSections);
  const remainingHeroes = remaining.filter((row) => row.sectionType.toLowerCase() === "hero");
  const remainingPublished = remainingHeroes
    .filter((row) => row.status === "PUBLISHED")
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
    .map((row) => [row.id, row.sortOrder]);
  const remainingNonHeroes = remaining.filter((row) => row.sectionType.toLowerCase() !== "hero").map((row) => row.id).sort();
  const originalNonHeroes = allSections.filter((row) => row.sectionType.toLowerCase() !== "hero").map((row) => row.id).sort();

  if (remainingHeroes.length !== publishedRows.length || JSON.stringify(remainingPublished) !== JSON.stringify(expectedPublished)) {
    throw new Error(`Post-cleanup hero verification failed: ${JSON.stringify(remainingPublished)}`);
  }
  if (JSON.stringify(remainingNonHeroes) !== JSON.stringify(originalNonHeroes)) {
    throw new Error("Post-cleanup non-hero homepage sections changed.");
  }

  console.log(JSON.stringify({
    heroRecordsBefore: heroRows.length,
    deleted: draftIds.length,
    remainingHeroes: remainingHeroes.length,
    preservedPublishedHeroIds: expectedPublished.map(([id]) => id),
    deletedIds: draftIds,
    nonHeroSectionsUnchanged: true,
  }, null, 2));
  await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
