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

export function createFaqStructuredData(
  faqs: Array<{ question: string; answer: string }>,
): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  });
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
export function buildAlternates(
  locale: Locale,
  path: string,
  hasAlternate = true,
): Metadata["alternates"] {
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

export function normalizeSeoText(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
}

export function truncateSeoText(value: string, maxLength = 155): string {
  const characters = Array.from(value);
  if (characters.length <= maxLength) return value;

  const shortened = characters.slice(0, maxLength - 1).join("");
  const lastSpace = shortened.lastIndexOf(" ");
  const readable =
    lastSpace >= Math.floor(maxLength * 0.65)
      ? shortened.slice(0, lastSpace)
      : shortened.trimEnd();
  return `${readable}…`;
}

export function buildCategorySeoTitle(categoryName?: string | null): string {
  const name = normalizeSeoText(categoryName) || "Products";
  return `${name} | Qasr Al Mabrook`;
}

export function buildCategorySeoDescription(
  categoryName?: string | null,
  description?: string | null,
  productNames: string[] = [],
  locale: Locale = "en",
): string {
  const name = normalizeSeoText(categoryName) || "Products";
  const cleanDescription = normalizeSeoText(description);
  const exampleProducts = productNames
    .map(normalizeSeoText)
    .filter((productName): productName is string => Boolean(productName))
    .slice(0, 2);
  const productText = exampleProducts.length
    ? locale === "ar"
      ? `ومنها ${exampleProducts.join(" و")}.`
      : `Including ${exampleProducts.join(" and ")}.`
    : "";
  const descriptionText = cleanDescription ? `${cleanDescription} ` : "";
  const base =
    locale === "ar"
      ? `تصفح منتجات ${name} في كتالوج قصر المبارك. ${productText} ${descriptionText}`
      : `Browse ${name} products at Qasr Al Mabrook. ${productText} ${descriptionText}`;
  return truncateSeoText(normalizeSeoText(base) ?? base);
}

export function buildProductSeoTitle(
  productName?: string | null,
  categoryName?: string | null,
): string {
  const name = normalizeSeoText(productName) || "Product";
  const category = normalizeSeoText(categoryName);
  const includesCategory =
    category && name.toLocaleLowerCase().includes(category.toLocaleLowerCase());
  return category && !includesCategory
    ? `${name} | ${category} | Qasr Al Mabrook`
    : `${name} | Qasr Al Mabrook`;
}

export function buildProductSeoDescription(
  productName?: string | null,
  shortDescription?: string | null,
  categoryName?: string | null,
): string {
  const cleanName = normalizeSeoText(productName) || "Product";
  const cleanShortDescription = normalizeSeoText(shortDescription);
  if (cleanShortDescription) return truncateSeoText(cleanShortDescription);
  const category = normalizeSeoText(categoryName);
  if (category) {
    return truncateSeoText(
      `Explore ${cleanName} in the ${category} collection at Qasr Al Mabrook.`,
    );
  }

  return truncateSeoText(
    `Explore ${cleanName} at Qasr Al Mabrook and browse the selection available in our catalogue.`,
  );
}

export function createPublicPageMetadata(options: CreateMetadataOptions): Metadata {
  const {
    locale,
    path,
    title,
    description,
    ogImage,
    ogImageAlt,
    ogImageWidth,
    ogImageHeight,
    hasAlternate = true,
  } = options;

  const finalTitle = normalizeSeoText(title) || siteConfig.name;

  const finalDescription =
    normalizeSeoText(description) ||
    "Browse the Qasr Al Mabrook catalogue for clothing, essentials, fabrics, footwear, and everyday products. Explore categories and request a quote for what you need.";

  // Canonical URL
  const canonical = buildCanonical(locale, path);

  const resolveSeoImageUrl = (imagePath?: string | null): string | null => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    if (imagePath.startsWith("/")) return `${getBaseUrl()}${imagePath}`;
    return `${getBaseUrl()}/${imagePath}`;
  };

  const resolvedOgImage =
    resolveSeoImageUrl(ogImage) ?? `${getBaseUrl()}${siteConfig.brand.logoColorPng}`;

  // Build metadata object
  const openGraphImage = {
    url: resolvedOgImage,
    alt: ogImageAlt || finalTitle,
    ...(ogImage && ogImageWidth && ogImageHeight
      ? { width: ogImageWidth, height: ogImageHeight }
      : {}),
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
      images: [resolvedOgImage],
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
  categoryName?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  productImage?: string | null;
  productImageAlt?: string | null;
}

export function createProductMetadata(options: CreateProductMetadataOptions): Metadata {
  const {
    productName,
    categoryName,
    seoTitle,
    seoDescription,
    shortDescription,
    fullDescription,
    productImage,
    productImageAlt,
    ...rest
  } = options;

  const title =
    normalizeSeoText(seoTitle) || buildProductSeoTitle(productName, categoryName);
  const description =
    normalizeSeoText(seoDescription) ||
    normalizeSeoText(fullDescription) ||
    normalizeSeoText(shortDescription) ||
    buildProductSeoDescription(productName, shortDescription, categoryName);

  return createPublicPageMetadata({
    ...rest,
    title,
    description: truncateSeoText(description),
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
  productNames?: string[];
}

export function createCategoryMetadata(
  options: CreateCategoryMetadataOptions,
): Metadata {
  const {
    categoryName,
    seoTitle,
    seoDescription,
    description: categoryDescription,
    productNames = [],
    ...rest
  } = options;

  const title = normalizeSeoText(seoTitle) || buildCategorySeoTitle(categoryName);
  const description =
    normalizeSeoText(seoDescription) ||
    buildCategorySeoDescription(
      categoryName,
      categoryDescription,
      productNames,
      rest.locale,
    );

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

export function createProductStructuredData(
  options: ProductStructuredDataOptions,
): string {
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

  return serializeJsonLd(schema);
}

/**
 * Create JSON-LD structured data for Organization
 * Used on localized homepages only
 */
export function createOrganizationStructuredData(): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getBaseUrl(),
    logo: `${getBaseUrl()}${siteConfig.brand.logoColorSvg}`,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: "Sharjah",
      addressRegion: "Sharjah",
      addressCountry: "AE",
    },
  };

  return serializeJsonLd(schema);
}

export function createWebSiteStructuredData(): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getBaseUrl(),
    inLanguage: ["en", "ar"],
  });
}

export interface BlogPostingStructuredDataOptions {
  title: string;
  description?: string | null;
  image?: string | null;
  url: string;
  datePublished: string;
  dateModified?: string | null;
  locale: Locale;
}

export function createBlogPostingStructuredData(
  options: BlogPostingStructuredDataOptions,
): string {
  const { title, description, image, url, datePublished, dateModified, locale } =
    options;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: locale === "ar" ? "ar" : "en",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: `${getBaseUrl()}${siteConfig.brand.logoColorSvg}`,
    },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    mainEntityOfPage: url,
  } as Record<string, unknown>;

  if (description) schema.description = description;
  if (image) schema.image = `${getBaseUrl()}${image}`;

  return serializeJsonLd(schema);
}

/**
 * Create JSON-LD structured data for BreadcrumbList
 */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function createBreadcrumbStructuredData(
  locale: Locale,
  items: BreadcrumbItem[],
): string {
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

  return serializeJsonLd(schema);
}

/**
 * Check if a URL should be noindexed based on query parameters
 * Non-empty search query params should typically be noindexed to prevent index bloat
 */
export function shouldNoindexFilteredView(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  // If there are any filter parameters present, noindex
  const hasAnyParams = Object.keys(searchParams).length > 0;
  return hasAnyParams;
}

export function shouldNoindexStateQuery(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return ["success", "error"].some((key) =>
    Object.prototype.hasOwnProperty.call(searchParams, key),
  );
}

function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
