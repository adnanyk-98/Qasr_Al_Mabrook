import { type MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/db";
import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
} from "@/db/schema";
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
  options: {
    lastModified?: Date | string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
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
    .map((value) =>
      value instanceof Date
        ? value.getTime()
        : value
          ? new Date(value).getTime()
          : Number.NaN,
    )
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : undefined;
}

export type SitemapData = {
  categories: Array<{ id: string; slug: string; updatedAt: Date | string | null }>;
  categoryTranslations: Array<{ categoryId: string; locale: Locale }>;
  products: Array<{ id: string; slug: string; updatedAt: Date | string | null }>;
  productTranslations: Array<{ productId: string; locale: Locale }>;
  contactUpdatedAt?: Date | string | null;
};

export function buildSitemapEntries(data: SitemapData): MetadataRoute.Sitemap {
  const { categories, categoryTranslations, products, productTranslations } = data;
  const entries: MetadataRoute.Sitemap = [];
  const baseUrl = getBaseUrl();

  for (const category of categories) {
    const availableLocales = new Set(
      categoryTranslations
        .filter((translation) => translation.categoryId === category.id)
        .map((translation) => translation.locale),
    );
    addLocalizedEntries(
      entries,
      baseUrl,
      `/categories/${category.slug}`,
      locales.filter((candidate) => availableLocales.has(candidate)),
      {
        lastModified: category.updatedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    );
  }

  for (const product of products) {
    const availableLocales = new Set(
      productTranslations
        .filter((translation) => translation.productId === product.id)
        .map((translation) => translation.locale),
    );
    addLocalizedEntries(
      entries,
      baseUrl,
      `/products/${product.slug}`,
      locales.filter((candidate) => availableLocales.has(candidate)),
      {
        lastModified: product.updatedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      },
    );
  }

  const blogLastModified = latestDate(blogArticles.map((article) => article.updatedAt));
  const categoriesLastModified = latestDate(
    categories.map((category) => category.updatedAt),
  );
  const productsLastModified = latestDate(products.map((product) => product.updatedAt));
  const homepageLastModified = latestDate([
    ...categories.map((category) => category.updatedAt),
    ...products.map((product) => product.updatedAt),
  ]);

  addLocalizedEntries(entries, baseUrl, "/", locales, {
    lastModified: homepageLastModified,
    changeFrequency: "weekly",
    priority: 1.0,
  });
  addLocalizedEntries(entries, baseUrl, "/categories", locales, {
    lastModified: categoriesLastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  });
  addLocalizedEntries(entries, baseUrl, "/products", locales, {
    lastModified: productsLastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  });
  addLocalizedEntries(entries, baseUrl, "/store-locator", locales, {
    lastModified: data.contactUpdatedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.8,
  });
  addLocalizedEntries(entries, baseUrl, "/blog", locales, {
    lastModified: blogLastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  });

  for (const article of blogArticles) {
    addLocalizedEntries(entries, baseUrl, `/blog/${article.slug}`, locales, {
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}

/**
 * Generate XML sitemap for search engines
 * Includes published products and categories in both locales
 * Excludes admin, search, filters, and non-indexable content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  try {
    const publishedCategories = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.status, "PUBLISHED"));
    const categoryTranslationRows = await db
      .select({
        categoryId: categoryTranslations.categoryId,
        locale: categoryTranslations.locale,
      })
      .from(categoryTranslations);

    const publishedProducts = await db
      .select({
        id: products.id,
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.status, "PUBLISHED"));
    const productTranslationRows = await db
      .select({
        productId: productTranslations.productId,
        locale: productTranslations.locale,
      })
      .from(productTranslations);
    const contactSettingRows = await db
      .select({ updatedAt: siteSettings.updatedAt })
      .from(siteSettings)
      .where(eq(siteSettings.key, "business_phone"));
    return buildSitemapEntries({
      categories: publishedCategories,
      categoryTranslations: categoryTranslationRows,
      products: publishedProducts,
      productTranslations: productTranslationRows,
      contactUpdatedAt: contactSettingRows[0]?.updatedAt,
    });
  } catch (error) {
    reportServerError("sitemap", error);
    return buildSitemapEntries({
      categories: [],
      categoryTranslations: [],
      products: [],
      productTranslations: [],
    });
  }
}
