/**
 * SEO utilities for generating metadata, canonicals, and structured data
 */

import { type Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getAlternateLocale, localePath, type Locale } from "@/lib/locales";

/**
 * Get the base URL for SEO/metadata generation
 */
export function getBaseUrl(): string {
  return siteConfig.url;
}

/**
 * Build a canonical URL for a given path and locale
 */
export function buildCanonical(locale: Locale, path: string): string {
  const base = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${localePath(locale, normalizedPath)}`;
}

/**
 * Build hreflang alternates for a page with locale variants
 * @param locale Current locale
 * @param path Base path (without locale prefix)
 * @param hasAlternate Whether the alternate locale has valid content
 */
export function buildAlternates(locale: Locale, path: string, hasAlternate = true): Metadata["alternates"] {
  if (!hasAlternate) {
    return undefined;
  }

  const alternateLocale = getAlternateLocale(locale);
  return {
    languages: {
      [locale]: buildCanonical(locale, path),
      [alternateLocale]: buildCanonical(alternateLocale, path),
      "x-default": buildCanonical("en", path),
    },
  };
}

/**
 * Create a metadata object with sensible defaults for public pages
 * Supports fallback chains and locale-aware content
 */
export interface CreateMetadataOptions {
  locale: Locale;
  path: string;
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
  ogImageAlt?: string | null;
  ogImageWidth?: number;
  ogImageHeight?: number;
  hasAlternate?: boolean; // Whether alternate locale version exists
}

export function createPublicPageMetadata(options: CreateMetadataOptions): Metadata {
  const {
    locale,
    path,
    title,
    description,
    ogImage,
    ogImageAlt,
    ogImageWidth = 1200,
    ogImageHeight = 630,
    hasAlternate = true,
  } = options;

  // Fallback title
  const finalTitle = title || siteConfig.name;

  // Fallback description
  const finalDescription = description || "Qasr Al Mabrook catalogue and enquiry platform.";

  // Canonical URL
  const canonical = buildCanonical(locale, path);

  // Build metadata object
  const openGraphImage = {
    url: ogImage || `${getBaseUrl()}${siteConfig.brand.logoColorPng}`,
    alt: ogImageAlt || finalTitle,
    ...(ogImage ? { width: ogImageWidth, height: ogImageHeight } : {}),
  };

  const metadata: Metadata = {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      ...buildAlternates(locale, path, hasAlternate),
      canonical,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      siteName: siteConfig.name,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
      images: [openGraphImage],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [ogImage || `${getBaseUrl()}${siteConfig.brand.logoColorPng}`],
    },
  };

  return metadata;
}

/**
 * Create metadata for a product page
 * Includes Product structured data support
 */
export interface CreateProductMetadataOptions extends CreateMetadataOptions {
  productName?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  productImage?: string | null;
  productImageAlt?: string | null;
}

export function createProductMetadata(options: CreateProductMetadataOptions): Metadata {
  const { seoTitle, seoDescription, productName, shortDescription, fullDescription, productImage, productImageAlt, ...rest } = options;

  // Title fallback chain: seoTitle -> productName -> site default
  const title = seoTitle || productName || siteConfig.name;

  // Description fallback chain: seoDescription -> shortDescription -> fullDescription -> site default
  const description = seoDescription || shortDescription || fullDescription;

  return createPublicPageMetadata({
    ...rest,
    title,
    description,
    ogImage: productImage || undefined,
    ogImageAlt: productImageAlt || productName || undefined,
  });
}

/**
 * Create metadata for a category page
 */
export interface CreateCategoryMetadataOptions extends CreateMetadataOptions {
  categoryName?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  description?: string | null;
}

export function createCategoryMetadata(options: CreateCategoryMetadataOptions): Metadata {
  const { seoTitle, seoDescription, categoryName, description: categoryDescription, ...rest } = options;

  // Title fallback chain
  const title = seoTitle || categoryName || siteConfig.name;

  // Description fallback chain
  const description = seoDescription || categoryDescription;

  return createPublicPageMetadata({
    ...rest,
    title,
    description,
  });
}

/**
 * Create JSON-LD structured data for Product
 * Only includes actual product data, no fabricated values
 */
export interface ProductStructuredDataOptions {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sku?: string | null;
  brand?: string | null;
  url: string;
}

export function createProductStructuredData(options: ProductStructuredDataOptions): string {
  const { id, name, description, image, sku, brand, url } = options;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url,
  } as Record<string, unknown>;

  // Only add fields with actual values
  if (description) schema.description = description;
  if (image) schema.image = image;
  if (sku) schema.sku = sku;
  if (brand) schema.brand = { "@type": "Brand", name: brand };

  // Add identifier
  schema.identifier = {
    "@type": "PropertyValue",
    name: "Product ID",
    value: id,
  };

  return JSON.stringify(schema);
}

/**
 * Create JSON-LD structured data for Organization
 * Used on homepage and as global schema
 */
export function createOrganizationStructuredData(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getBaseUrl(),
    logo: `${getBaseUrl()}${siteConfig.brand.logoColorSvg}`,
  };

  return JSON.stringify(schema);
}

export function createWebSiteStructuredData(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getBaseUrl(),
    inLanguage: ["en", "ar"],
  });
}

/**
 * Create JSON-LD structured data for BreadcrumbList
 */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function createBreadcrumbStructuredData(locale: Locale, items: BreadcrumbItem[]): string {
  const breadcrumbs = [
    { name: locale === "ar" ? "الرئيسية" : "Home", path: "/" },
    ...items,
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonical(locale, item.path),
    })),
  };

  return JSON.stringify(schema);
}

/**
 * Check if a URL should be noindexed based on query parameters
 * Non-empty search query params should typically be noindexed to prevent index bloat
 */
export function shouldNoindexFilteredView(searchParams: Record<string, string | string[] | undefined>): boolean {
  // If there are any filter parameters present, noindex
  const hasAnyParams = Object.keys(searchParams).length > 0;
  return hasAnyParams;
}

