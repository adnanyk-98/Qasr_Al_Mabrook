import { type MetadataRoute } from "next";
import { db } from "@/db";
import { categories, categoryTranslations, productTranslations, products, staticPageTranslations, staticPages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/seo";
import { localePath, locales } from "@/lib/locales";
import { reportServerError } from "@/lib/observability";

/**
 * Generate XML sitemap for search engines
 * Includes published products and categories in both locales
 * Excludes admin, search, filters, and non-indexable content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const sitemapEntries: MetadataRoute.Sitemap = [];

  try {
    // Add homepages for each locale
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}${localePath(locale, "/")}`,
        changeFrequency: "weekly",
        priority: 1.0,
      });
    }

    // Add static catalogue pages
    for (const locale of locales) {
      sitemapEntries.push(
        {
          url: `${baseUrl}${localePath(locale, "/categories")}`,
          changeFrequency: "weekly",
          priority: 0.9,
        },
        {
          url: `${baseUrl}${localePath(locale, "/products")}`,
          changeFrequency: "weekly",
          priority: 0.9,
        },
        {
          url: `${baseUrl}${localePath(locale, "/store-locator")}`,
          changeFrequency: "monthly",
          priority: 0.8,
        },
        {
          url: `${baseUrl}${localePath(locale, "/contact-us")}`,
          changeFrequency: "monthly",
          priority: 0.6,
        }
      );
    }

    const aboutPage = await db
      .select({ id: staticPages.id, updatedAt: staticPages.updatedAt })
      .from(staticPages)
      .where(and(eq(staticPages.slug, "about-us"), eq(staticPages.status, "PUBLISHED")))
      .limit(1);
    if (aboutPage[0]) {
      const aboutTranslations = await db
        .select({ locale: staticPageTranslations.locale })
        .from(staticPageTranslations)
        .where(eq(staticPageTranslations.staticPageId, aboutPage[0].id));
      const availableAboutLocales = new Set(aboutTranslations.map((translation) => translation.locale));
      for (const locale of locales.filter((candidate) => availableAboutLocales.has(candidate))) {
        sitemapEntries.push({
          url: `${baseUrl}${localePath(locale, "/about-us")}`,
          lastModified: aboutPage[0].updatedAt,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }

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
      for (const locale of locales.filter((candidate) => availableLocales.has(candidate))) {
        sitemapEntries.push({
          url: `${baseUrl}${localePath(locale, `/categories/${category.slug}`)}`,
          lastModified: category.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
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
      for (const locale of locales.filter((candidate) => availableLocales.has(candidate))) {
        sitemapEntries.push({
          url: `${baseUrl}${localePath(locale, `/products/${product.slug}`)}`,
          lastModified: product.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    reportServerError("sitemap", error);
    // Return minimal sitemap on error to avoid breaking the application
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}${localePath(locale, "/")}`,
        changeFrequency: "weekly",
        priority: 1.0,
      });
    }
  }

  return sitemapEntries;
}
