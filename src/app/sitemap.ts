import { type MetadataRoute } from "next";
import { db } from "@/db";
import { categories, categoryTranslations, productTranslations, products } from "@/db/schema";
import { siteSettings } from "@/db/schema/settings";
import { eq } from "drizzle-orm";
import { blogArticles } from "@/lib/blog";
import { getBaseUrl } from "@/lib/seo";
import { localePath, locales, type Locale } from "@/lib/locales";
import { reportServerError } from "@/lib/observability";

function addLocalizedEntries(
  entries: MetadataRoute.Sitemap,
  baseUrl: string,
  path: string,
  availableLocales: readonly Locale[],
  options: { lastModified?: Date | string; changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]; priority?: number } = {},
) {
  const languages = Object.fromEntries(
    availableLocales.map((locale) => [locale, `${baseUrl}${localePath(locale, path)}`]),
  );
  if (availableLocales.includes("en")) languages["x-default"] = languages.en;

  for (const locale of availableLocales) {
    entries.push({
      url: `${baseUrl}${localePath(locale, path)}`,
      ...(options.lastModified ? { lastModified: options.lastModified } : {}),
      ...(options.changeFrequency ? { changeFrequency: options.changeFrequency } : {}),
      ...(options.priority !== undefined ? { priority: options.priority } : {}),
      alternates: { languages },
    });
  }
}

function latestDate(values: Array<Date | string | null | undefined>): Date | undefined {
  const timestamps = values
    .map((value) => value instanceof Date ? value.getTime() : value ? new Date(value).getTime() : Number.NaN)
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : undefined;
}

/**
 * Generate XML sitemap for search engines
 * Includes published products and categories in both locales
 * Excludes admin, search, filters, and non-indexable content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const sitemapEntries: MetadataRoute.Sitemap = [];

  try {
    // Add published categories for each locale
    const publishedCategories = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.status, "PUBLISHED"));
    const categoryTranslationRows = await db
      .select({ categoryId: categoryTranslations.categoryId, locale: categoryTranslations.locale })
      .from(categoryTranslations);

    for (const category of publishedCategories) {
      const availableLocales = new Set(
        categoryTranslationRows
          .filter((translation) => translation.categoryId === category.id)
          .map((translation) => translation.locale)
      );
      addLocalizedEntries(
        sitemapEntries,
        baseUrl,
        `/categories/${category.slug}`,
        locales.filter((candidate) => availableLocales.has(candidate)),
        { lastModified: category.updatedAt, changeFrequency: "weekly", priority: 0.8 },
      );
    }

    // Add published products for each locale
    const publishedProducts = await db
      .select({
        id: products.id,
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.status, "PUBLISHED"));
    const productTranslationRows = await db
      .select({ productId: productTranslations.productId, locale: productTranslations.locale })
      .from(productTranslations);

    for (const product of publishedProducts) {
      const availableLocales = new Set(
        productTranslationRows
          .filter((translation) => translation.productId === product.id)
          .map((translation) => translation.locale)
      );
      addLocalizedEntries(
        sitemapEntries,
        baseUrl,
        `/products/${product.slug}`,
        locales.filter((candidate) => availableLocales.has(candidate)),
        { lastModified: product.updatedAt, changeFrequency: "weekly", priority: 0.7 },
      );
    }

    const contactSettingRows = await db
      .select({ updatedAt: siteSettings.updatedAt })
      .from(siteSettings)
      .where(eq(siteSettings.key, "business_phone"));
    const blogLastModified = latestDate(blogArticles.map((article) => article.updatedAt));
    const categoriesLastModified = latestDate(publishedCategories.map((category) => category.updatedAt));
    const productsLastModified = latestDate(publishedProducts.map((product) => product.updatedAt));
    const homepageLastModified = latestDate([
      ...publishedCategories.map((category) => category.updatedAt),
      ...publishedProducts.map((product) => product.updatedAt),
    ]);

    addLocalizedEntries(sitemapEntries, baseUrl, "/", locales, { lastModified: homepageLastModified, changeFrequency: "weekly", priority: 1.0 });
    addLocalizedEntries(sitemapEntries, baseUrl, "/categories", locales, { lastModified: categoriesLastModified, changeFrequency: "weekly", priority: 0.9 });
    addLocalizedEntries(sitemapEntries, baseUrl, "/products", locales, { lastModified: productsLastModified, changeFrequency: "weekly", priority: 0.9 });
    addLocalizedEntries(sitemapEntries, baseUrl, "/store-locator", locales, { lastModified: contactSettingRows[0]?.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    addLocalizedEntries(sitemapEntries, baseUrl, "/blog", locales, { lastModified: blogLastModified, changeFrequency: "weekly", priority: 0.8 });

    for (const article of blogArticles) {
      addLocalizedEntries(sitemapEntries, baseUrl, `/blog/${article.slug}`, locales, {
        lastModified: new Date(article.updatedAt),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch (error) {
    reportServerError("sitemap", error);
    addLocalizedEntries(sitemapEntries, baseUrl, "/", locales, { changeFrequency: "weekly", priority: 1.0 });
  }

  return sitemapEntries;
}
