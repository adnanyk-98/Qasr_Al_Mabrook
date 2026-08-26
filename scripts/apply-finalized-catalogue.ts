import { config } from "dotenv";

config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";

type CatalogueProduct = {
  name: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  sku: string;
  category: { en: string; ar: string };
};

function expectedCategorySlug(item: CatalogueProduct) {
  if (item.name.en === "Pajama") return "pajama";
  if (item.name.en === "Fancy Suit") return "fancy-suit";
  if (item.category.en === "Fabrics & Textiles") return "cloth-piece";
  if (item.category.en === "Tools & Measuring") return "measuring-tape";
  if (item.category.en === "Personal Care") return "adivasi-oil";
  throw new Error(`No existing category mapping for ${item.name.en} (${item.category.en})`);
}

function slugForName(name: string) {
  return name
    .toLowerCase()
    .replace(/5\.5m/g, "5-5m")
    .replace(/7\.5m/g, "7-5m")
    .replace(/5m/g, "5m")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const { db } = await import("@/db");
  const { categories, productCategories, productTranslations, products } = await import("@/db/schema");
  const source = JSON.parse(await readFile("finalized-catalogue.json", "utf8")) as CatalogueProduct[];
  if (!Array.isArray(source) || source.length !== 8) {
    throw new Error("finalized-catalogue.json must contain exactly 8 products");
  }

  const existingProducts = await db.select().from(products);
  const existingCategories = await db.select().from(categories);
  const relations = await db.select().from(productCategories);
  const existingTranslations = await db.select().from(productTranslations);
  const productBySlug = new Map(existingProducts.map((product) => [product.slug, product]));
  const categoryBySlug = new Map(existingCategories.map((category) => [category.slug, category]));

  const matches = source.map((item) => {
    const product = productBySlug.get(slugForName(item.name.en));
    if (!product) throw new Error(`Existing product not found for ${item.name.en}`);
    const expectedSlug = expectedCategorySlug(item);
    const category = expectedSlug ? categoryBySlug.get(expectedSlug) : undefined;
    if (!category) throw new Error(`Existing category not found for ${item.category.en}`);
    const relation = relations.find((candidate) => candidate.productId === product.id && candidate.categoryId === category.id);
    if (!relation) throw new Error(`Category relation missing for ${item.name.en} -> ${item.category.en}`);
    return { item, product };
  });

  await db.transaction(async (transaction) => {
    for (const { item, product } of matches) {
      await transaction.update(products).set({ defaultSku: item.sku }).where(eq(products.id, product.id));

      const english = existingTranslations.find((translation) => translation.productId === product.id && translation.locale === "en");
      if (!english) throw new Error(`English translation missing for ${item.name.en}`);
      await transaction.update(productTranslations).set({
        name: item.name.en,
        shortDescription: item.shortDescription.en,
        description: item.description.en,
      }).where(eq(productTranslations.id, english.id));

      const arabic = existingTranslations.find((translation) => translation.productId === product.id && translation.locale === "ar");
      if (!arabic) throw new Error(`Arabic translation missing for ${item.name.en}`);
      await transaction.update(productTranslations).set({
        name: item.name.ar,
        shortDescription: item.shortDescription.ar,
        description: item.description.ar,
      }).where(eq(productTranslations.id, arabic.id));

    }
  });

  const verifyProducts = await db.select().from(products);
  const verifyTranslations = await db.select().from(productTranslations);
  for (const { item, product } of matches) {
    const updatedProduct = verifyProducts.find((candidate) => candidate.id === product.id);
    const english = verifyTranslations.find((translation) => translation.productId === product.id && translation.locale === "en");
    const arabic = verifyTranslations.find((translation) => translation.productId === product.id && translation.locale === "ar");
    if (updatedProduct?.defaultSku !== item.sku || english?.name !== item.name.en || english?.shortDescription !== item.shortDescription.en || english?.description !== item.description.en || arabic?.name !== item.name.ar || arabic?.shortDescription !== item.shortDescription.ar || arabic?.description !== item.description.ar) {
      throw new Error(`Verification failed for ${item.name.en}`);
    }
  }

  console.log(`Updated and verified ${matches.length} existing products; no products, categories, images, or relations were created.`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
