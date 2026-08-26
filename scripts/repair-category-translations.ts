import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("@/db");
  const { sql } = await import("drizzle-orm");
  const { categories, categoryTranslations } = await import("@/db/schema");

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const translationRows = await db.select().from(categoryTranslations);
  const repairs = [
    { slug: "fancy-suit", en: "Fancy Suit", ar: "بدلات فاخرة" },
    { slug: "pajama", en: "Pajama", ar: "بيجاما" },
  ].map((repair) => {
    const category = categoryRows.find((row) => row.slug === repair.slug);
    if (!category) throw new Error(`Existing ${repair.slug} category was not found`);
    const englishRows = translationRows.filter((row) => row.categoryId === category.id && row.locale === "en");
    const arabicRows = translationRows.filter((row) => row.categoryId === category.id && row.locale === "ar");
    if (englishRows.length !== 1 || arabicRows.length !== 1) {
      throw new Error(`Expected exactly one EN and one AR ${repair.slug} translation; found ${englishRows.length} EN and ${arabicRows.length} AR`);
    }
    return { ...repair, category, english: englishRows[0], arabic: arabicRows[0] };
  });

  await db.transaction(async (transaction) => {
    await transaction.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS category_translations_category_locale_unique ON category_translations (category_id, locale)`);
    for (const repair of repairs) {
      await transaction.update(categoryTranslations).set({ name: repair.en }).where(sql`id = ${repair.english.id} AND category_id = ${repair.category.id} AND locale = 'en'`);
      await transaction.update(categoryTranslations).set({ name: repair.ar }).where(sql`id = ${repair.arabic.id} AND category_id = ${repair.category.id} AND locale = 'ar'`);
    }
  });

  const verified = await db.select({ id: categoryTranslations.id, categoryId: categoryTranslations.categoryId, locale: categoryTranslations.locale, name: categoryTranslations.name }).from(categoryTranslations);
  const duplicatePairs = await db.execute(sql`SELECT category_id, locale, COUNT(*)::int AS count FROM category_translations GROUP BY category_id, locale HAVING COUNT(*) > 1`);
  const repaired = verified.filter((row) => repairs.some((repair) => repair.category.id === row.categoryId));
  console.log(JSON.stringify({ repaired, duplicatePairs }, null, 2));
}

void main().catch((error) => { console.error(error); process.exit(1); });
