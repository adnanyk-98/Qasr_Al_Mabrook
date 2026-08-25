import { config } from "dotenv";

config({ path: ".env.local" });

import { and, asc, eq } from "drizzle-orm";

import type {
  categories,
  categoryTranslations,
  productCategories,
  productTranslations,
  products,
} from "@/db/schema";

type Locale = "en" | "ar";
type Product = typeof products.$inferSelect;
type ProductTranslation = typeof productTranslations.$inferSelect;
type Category = typeof categories.$inferSelect;
type CategoryTranslation = typeof categoryTranslations.$inferSelect;

type ProductPlan = {
  product: Product;
  english: ProductTranslation | undefined;
  arabic: ProductTranslation | undefined;
  categorySlugs: string[];
  categoryNames: string[];
  englishShortDescription: string;
  englishDescription: string;
  arabicName: string;
  arabicShortDescription: string;
  arabicDescription: string;
};

type CategoryPlan = {
  category: Category;
  english: CategoryTranslation | undefined;
  arabic: CategoryTranslation | undefined;
  productNames: string[];
  englishDescription: string;
  arabicName: string;
  arabicDescription: string;
};

const arabicNameBySlug: Record<string, string> = {
  "adivasi-oil": "زيت أديفاسي",
  "cloth-piece": "قطعة قماش",
  "fancy-suit": "بدلة فاخرة",
  "5-5m-measuring-tape-green": "شريط قياس 5.5 متر أخضر",
  "5m-measuring-tape-green": "شريط قياس 5 أمتار أخضر",
  "5m-measuring-tape-orange": "شريط قياس 5 أمتار برتقالي",
  "7-5m-measuring-tape-green": "شريط قياس 7.5 متر أخضر",
  pajama: "بيجاما",
};

const arabicCategoryBySlug: Record<string, string> = {
  "adivasi-oil": "زيت أديفاسي",
  "cloth-piece": "قطعة قماش",
  "fancy-suit": "بدلات فاخرة",
  "measuring-tape": "أشرطة القياس",
  pajama: "بيجاما",
};

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function arabicProductName(product: Product) {
  return arabicNameBySlug[product.slug] ?? product.slug.replaceAll("-", " ");
}

function arabicCategoryName(category: Category) {
  return arabicCategoryBySlug[category.slug] ?? category.slug.replaceAll("-", " ");
}

function buildProductCopy(product: Product, englishName?: string) {
  const name = englishName ?? product.slug.replaceAll("-", " ");
  let englishShortDescription = `${name} is identified by its established catalogue name.`;
  let englishDescription = `${name} is an item in the Qasr Al Mabrook catalogue, identified by its established product name. The current database record does not include further technical specifications or a detailed application for this item.`;
  let arabicShortDescription = `${arabicProductName(product)} معروف باسمه المعتمد في الكتالوج.`;
  let arabicDescription = `${arabicProductName(product)} منتج مسجل في كتالوج قصر المبارك باسمه المعتمد. لا يتضمن سجل قاعدة البيانات الحالي مواصفات فنية إضافية أو استخداماً تفصيلياً لهذا المنتج.`;

  if (product.slug.includes("measuring-tape")) {
    englishShortDescription = `${name} is a measuring tape with a recorded length and color for measuring tasks.`;
    englishDescription = `${name} is a measuring tape with the recorded length and color shown in the catalogue. It is suitable for tasks that require a tape measure. The product record does not specify additional materials, ratings, or technical features.`;
    arabicShortDescription = `${arabicProductName(product)} شريط قياس محدد بالطول واللون المسجلين له، لمهام القياس.`;
    arabicDescription = `${arabicProductName(product)} شريط قياس محدد في الكتالوج بالطول واللون المسجلين له. يُعرض لمهام القياس التي تتطلب استخدام شريط قياس. لا يذكر سجل المنتج مواد إضافية أو تصنيفات أو خصائص فنية أخرى.`;
  } else if (product.slug === "pajama") {
    englishShortDescription = "Pajama sleepwear for personal use.";
    englishDescription = "Pajama is sleepwear for personal use. The available database record does not specify fabric composition, sizing, or additional garment features.";
    arabicShortDescription = "بيجاما من ملابس النوم، محددة باسم المنتج المعتمد للاستخدام الشخصي.";
    arabicDescription = "بيجاما منتج من ملابس النوم محدد باسمه المعتمد في الكتالوج. يُعرض كقطعة من الملابس للاستخدام الشخصي. لا يحدد سجل قاعدة البيانات نوع القماش أو المقاسات أو خصائص إضافية للملابس.";
  } else if (product.slug === "cloth-piece") {
    englishShortDescription = "Cloth Piece is a textile item for cloth and garment-related projects.";
    englishDescription = "Cloth Piece is a textile item for cloth and garment-related projects. The database record does not specify the fabric composition, dimensions, or other technical properties.";
    arabicShortDescription = "قطعة قماش من منتجات النسيج لمشاريع القماش والملابس.";
    arabicDescription = "قطعة قماش منتج نسيجي محدد باسمه ومعروض لمشاريع القماش والملابس. لا يحدد سجل قاعدة البيانات نوع القماش أو الأبعاد أو الخصائص الفنية الأخرى.";
  } else if (product.slug === "fancy-suit") {
    englishShortDescription = "Fancy Suit is a suit garment for formal and occasion-focused clothing collections.";
    englishDescription = "Fancy Suit is a suit garment for formal and occasion-focused clothing collections. The available database record does not specify fabric, construction, sizing, or other garment details.";
    arabicShortDescription = "بدلة فاخرة من ملابس البدلات للمجموعات الرسمية ومناسبات ارتداء البدلات.";
    arabicDescription = "بدلة فاخرة قطعة من ملابس البدلات محددة باسمها المعتمد ومعروضة للمجموعات الرسمية ومناسبات ارتداء البدلات. لا يحدد سجل قاعدة البيانات نوع القماش أو طريقة التصنيع أو المقاسات أو تفاصيل أخرى للملابس.";
  } else if (product.slug === "adivasi-oil") {
    englishShortDescription = "Adivasi Oil is an oil product listed in the catalogue.";
    englishDescription = "Adivasi Oil is presented as an oil product in the catalogue. The current database record does not specify its ingredients, intended application, origin, or other product properties, so no additional claims are made here.";
    arabicShortDescription = "زيت أديفاسي منتج زيتي محدد باسمه المعتمد في الكتالوج.";
    arabicDescription = "زيت أديفاسي منتج زيتي محدد باسمه المعتمد في الكتالوج. لا يحدد سجل قاعدة البيانات الحالي مكوناته أو استخدامه المقصود أو منشأه أو خصائصه الأخرى، لذلك لا تتم إضافة ادعاءات أخرى هنا.";
  }

  return { englishShortDescription, englishDescription, arabicName: arabicProductName(product), arabicShortDescription, arabicDescription };
}

function buildCategoryCopy(category: Category, productNames: string[]) {
  const englishName = category.slug.replaceAll("-", " ");
  const productContext = productNames.length ? ` Products currently listed include ${productNames.join(", ")}.` : "";
  const arabicName = arabicCategoryName(category);
  return {
    englishDescription: category.slug === "measuring-tape"
      ? `This category groups measuring tape products identified by their recorded lengths and colors.${productContext}`
      : category.slug === "cloth-piece"
        ? `This category groups cloth pieces presented for textile and garment-related projects.${productContext}`
        : category.slug === "pajama"
          ? `This category groups pajama sleepwear products for personal use.${productContext}`
          : category.slug === "fancy-suit"
            ? `This category groups fancy suit garments for formal and occasion-focused clothing collections.${productContext}`
            : `This category groups the catalogue's Adivasi Oil product. The database does not record further ingredients or applications.${productContext}`,
    arabicName,
    arabicDescription: category.slug === "measuring-tape"
      ? `تضم هذه الفئة منتجات أشرطة القياس المحددة بالأطوال والألوان المسجلة لها.${productNames.length ? ` وتشمل المنتجات المسجلة: ${productNames.join("، ")}.` : ""}`
      : category.slug === "cloth-piece"
        ? `تضم هذه الفئة قطع القماش المعروضة لمشاريع النسيج والملابس.${productNames.length ? ` وتشمل المنتجات المسجلة: ${productNames.join("، ")}.` : ""}`
        : category.slug === "pajama"
          ? `تضم هذه الفئة منتجات البيجاما من ملابس النوم للاستخدام الشخصي.${productNames.length ? ` وتشمل المنتجات المسجلة: ${productNames.join("، ")}.` : ""}`
          : category.slug === "fancy-suit"
            ? `تضم هذه الفئة بدلات فاخرة للمجموعات الرسمية ومناسبات ارتداء البدلات.${productNames.length ? ` وتشمل المنتجات المسجلة: ${productNames.join("، ")}.` : ""}`
            : `تضم هذه الفئة منتج زيت أديفاسي المسجل في الكتالوج. لا تسجل قاعدة البيانات مكونات أو استخدامات إضافية.${productNames.length ? ` وتشمل المنتجات المسجلة: ${productNames.join("، ")}.` : ""}`,
  };
}

function isGenericProductCopy(value: string | null | undefined) {
  return Boolean(value && (/listed in the .* category\.?$/i.test(value.trim()) || /This catalogue entry is presented under/i.test(value) || /مدرج ضمن فئة/.test(value) || /هذا المنتج مسجل ضمن فئة/.test(value)));
}

function isGenericCategoryCopy(value: string | null | undefined) {
  return Boolean(value && (/products available in the catalogue/i.test(value) || /منتجات .* المتاحة في الكتالوج/.test(value)));
}

async function buildPlan() {
  const { db } = await import("@/db");
  const { categories, categoryTranslations, productCategories, productTranslations, products } = await import("@/db/schema");
  const publishedProducts = await db.select().from(products).where(eq(products.status, "PUBLISHED")).orderBy(asc(products.createdAt));
  const publishedCategories = await db.select().from(categories).where(eq(categories.status, "PUBLISHED")).orderBy(asc(categories.sortOrder), asc(categories.slug));
  const productTranslationRows = await db.select().from(productTranslations);
  const categoryTranslationRows = await db.select().from(categoryTranslations);
  const relations = await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId }).from(productCategories);

  const productPlans: ProductPlan[] = publishedProducts.map((product) => {
    const english = productTranslationRows.find((row) => row.productId === product.id && row.locale === "en");
    const arabic = productTranslationRows.find((row) => row.productId === product.id && row.locale === "ar");
    const relatedCategories = relations
      .filter((relation) => relation.productId === product.id)
      .map((relation) => {
        const category = publishedCategories.find((candidate) => candidate.id === relation.categoryId);
        const translation = categoryTranslationRows.find((row) => row.categoryId === relation.categoryId && row.locale === "en");
        return { slug: category?.slug, name: translation?.name ?? category?.slug };
      });
    const categorySlugs = relatedCategories.map(({ slug }) => slug).filter((slug): slug is string => Boolean(slug));
    const categoryNames = relatedCategories.map(({ name }) => name).filter((name): name is string => Boolean(name));
    const copy = buildProductCopy(product, english?.name);
    return { product, english, arabic, categorySlugs, categoryNames, ...copy };
  });

  const categoryPlans: CategoryPlan[] = publishedCategories.map((category) => {
    const english = categoryTranslationRows.find((row) => row.categoryId === category.id && row.locale === "en");
    const arabic = categoryTranslationRows.find((row) => row.categoryId === category.id && row.locale === "ar");
    const productNames = productPlans
      .filter((plan) => plan.categorySlugs.includes(category.slug))
      .map((plan) => plan.english?.name ?? plan.product.slug.replaceAll("-", " "));
    return { category, english, arabic, productNames, ...buildCategoryCopy(category, productNames) };
  });

  return { productPlans, categoryPlans };
}

function printPlan(plan: Awaited<ReturnType<typeof buildPlan>>) {
  console.log(`Products processed: ${plan.productPlans.length}`);
  for (const item of plan.productPlans) {
    const englishMissing = !item.english;
    const englishFields = [!hasValue(item.english?.shortDescription), !hasValue(item.english?.description)].filter(Boolean).length;
    const englishVerified = item.english?.shortDescription === item.englishShortDescription && item.english?.description === item.englishDescription;
    const arabicVerified = item.arabic?.name === item.arabicName && item.arabic?.shortDescription === item.arabicShortDescription && item.arabic?.description === item.arabicDescription;
    console.log(`PRODUCT ${item.product.slug} | EN ${englishMissing ? "MISSING" : englishVerified ? "VERIFIED" : englishFields ? "UPDATE" : "PRESENT"} | AR ${arabicVerified ? "VERIFIED" : item.arabic ? "UPDATE" : "WILL INSERT"} | SKU ${item.product.defaultSku ?? "NULL"}`);
    console.log(`  proposed EN short: ${item.englishShortDescription}`);
    console.log(`  proposed EN full: ${item.englishDescription}`);
    console.log(`  proposed AR short: ${item.arabicShortDescription}`);
    console.log(`  proposed AR full: ${item.arabicDescription}`);
  }
  console.log(`Categories processed: ${plan.categoryPlans.length}`);
  for (const item of plan.categoryPlans) {
    const englishVerified = item.english?.description === item.englishDescription;
    const arabicVerified = item.arabic?.name === item.arabicName && item.arabic?.description === item.arabicDescription;
    console.log(`CATEGORY ${item.category.slug} | EN description ${englishVerified ? "VERIFIED" : hasValue(item.english?.description) ? "PRESENT" : "WILL FILL"} | AR description ${arabicVerified ? "VERIFIED" : item.arabic ? "UPDATE" : "WILL INSERT"}`);
  }
}

async function applyPlan(plan: Awaited<ReturnType<typeof buildPlan>>) {
  const { db } = await import("@/db");
  const { categoryTranslations, productTranslations } = await import("@/db/schema");
  const result = { arabicProducts: 0, englishDescriptions: 0, arabicDescriptions: 0, arabicCategories: 0, categoryDescriptions: 0, arabicCategoryDescriptions: 0, preserved: 0 };

  await db.transaction(async (transaction) => {
    for (const item of plan.productPlans) {
      const currentEnglish = (await transaction.select().from(productTranslations).where(and(eq(productTranslations.productId, item.product.id), eq(productTranslations.locale, "en"))).limit(1))[0];
      if (currentEnglish) {
        const updates: Partial<typeof productTranslations.$inferInsert> = {};
        updates.shortDescription = item.englishShortDescription;
        updates.description = item.englishDescription;
        result.englishDescriptions += 2;
        if (Object.keys(updates).length) await transaction.update(productTranslations).set(updates).where(eq(productTranslations.id, currentEnglish.id));
        else result.preserved += 1;
      }

      const currentArabic = (await transaction.select().from(productTranslations).where(and(eq(productTranslations.productId, item.product.id), eq(productTranslations.locale, "ar"))).limit(1))[0];
      if (currentArabic) {
        const updates: Partial<typeof productTranslations.$inferInsert> = {};
        updates.name = item.arabicName;
        updates.shortDescription = item.arabicShortDescription;
        updates.description = item.arabicDescription;
        result.arabicDescriptions += 2;
        if (Object.keys(updates).length) await transaction.update(productTranslations).set(updates).where(eq(productTranslations.id, currentArabic.id));
        else result.preserved += 1;
      } else {
        await transaction.insert(productTranslations).values({ productId: item.product.id, locale: "ar", name: item.arabicName, shortDescription: item.arabicShortDescription, description: item.arabicDescription });
        result.arabicProducts += 1;
        result.arabicDescriptions += 1;
      }
    }

    for (const item of plan.categoryPlans) {
      const currentEnglish = (await transaction.select().from(categoryTranslations).where(and(eq(categoryTranslations.categoryId, item.category.id), eq(categoryTranslations.locale, "en"))).limit(1))[0];
      if (currentEnglish) {
        await transaction.update(categoryTranslations).set({ description: item.englishDescription }).where(eq(categoryTranslations.id, currentEnglish.id));
        result.categoryDescriptions += 1;
      } else {
        result.preserved += 1;
      }

      const currentArabic = (await transaction.select().from(categoryTranslations).where(and(eq(categoryTranslations.categoryId, item.category.id), eq(categoryTranslations.locale, "ar"))).limit(1))[0];
      if (currentArabic) {
        await transaction.update(categoryTranslations).set({ name: item.arabicName, description: item.arabicDescription }).where(eq(categoryTranslations.id, currentArabic.id)); result.arabicCategoryDescriptions += 1;
      } else {
        await transaction.insert(categoryTranslations).values({ categoryId: item.category.id, locale: "ar", name: item.arabicName, description: item.arabicDescription });
        result.arabicCategories += 1;
      }
    }
  });

  return result;
}

async function main() {
  const plan = await buildPlan();
  printPlan(plan);

  if (!process.argv.includes("--apply")) {
    console.log("Dry run only. No database changes made. Re-run with --apply to persist missing content.");
    return;
  }

  const result = await applyPlan(plan);
  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
