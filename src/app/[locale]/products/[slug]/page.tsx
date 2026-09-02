import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/public/product-card";
import ProductGallery from '@/components/public/product-gallery';
import { SalesActions } from "@/components/public/sales-actions";
import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getTranslations } from "next-intl/server";
import { getPublicContactSettings } from "@/server/repositories/enquiries";
import {
  getProductBySlug,
  listProductCategoriesForProduct,
  listProductImagesForPublic,
  listProductSpecifications,
  listProductVariantGroups,
  listRelatedProducts,
  listVariantCombinationValuesForProduct,
  listVariantCombinationsForProduct,
} from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { createBreadcrumbStructuredData, createProductMetadata, createProductStructuredData, buildCanonical } from "@/lib/seo";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const product = await getProductBySlug(locale as Locale, slug);
  if (!product) return {};

  const currentLocale = locale as Locale;
  const alternateProduct = await getProductBySlug(currentLocale === "en" ? "ar" : "en", slug);
  
  // Get product images to extract primary image for OG metadata
  const images = await listProductImagesForPublic(product.id);
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  return createProductMetadata({
    locale: currentLocale,
    path: `/products/${slug}`,
    productName: product.name,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    shortDescription: product.shortDescription,
    fullDescription: product.description,
    productImage: primaryImage?.publicUrl,
    productImageAlt: primaryImage ? (currentLocale === "ar" ? primaryImage.altTextAr ?? primaryImage.altTextEn : primaryImage.altTextEn ?? primaryImage.altTextAr) : undefined,
    hasAlternate: Boolean(alternateProduct),
  });
}

export default async function ProductDetailPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ variant?: string }> }) {
  const { locale, slug } = await params;
  const query = await searchParams;

  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "product" });
  const common = await getTranslations({ locale: currentLocale, namespace: "common" });
  const product = await getProductBySlug(currentLocale, slug);

  if (!product) notFound();

  const [images, categories, variants, variantValues, specifications, contactSettings] = await Promise.all([
    listProductImagesForPublic(product.id),
    listProductCategoriesForProduct(product.id, currentLocale),
    listVariantCombinationsForProduct(product.id),
    listVariantCombinationValuesForProduct(product.id, currentLocale),
    listProductSpecifications(product.id, currentLocale),
    getPublicContactSettings(),
  ]);
  const relatedProducts = await listRelatedProducts(currentLocale, product.id, categories.map(({ category }) => category.id));

  const productCategoryNames = categories.map(({ category, translation }) => ({
    id: category.id,
    slug: category.slug,
    name: translation?.name ?? category.slug,
  }));
  const relatedHeading = productCategoryNames[0]?.name
    ? currentLocale === "ar"
      ? `استكشف المزيد من ${productCategoryNames[0].name}`
      : `Explore more from ${productCategoryNames[0].name}`
    : currentLocale === "ar"
      ? "منتجات ذات صلة"
      : "Related products";
  const variantGroups = await listProductVariantGroups(product.id, currentLocale);
  const selectedVariant = variants.find((variant) => variant.id === query.variant) ?? variants[0] ?? null;
  const defaultImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;
  const attributeSelectionsByGroup = variantGroups.map((group) => ({
    ...group,
    options: variantValues
      .filter((selection) => selection.attributeId === group.attributeId)
      .map((selection) => ({ id: selection.combinationId, label: selection.label }))
      .filter((option, index, options) => options.findIndex((candidate) => candidate.id === option.id) === index),
  }));

  return (
    <PublicShell locale={currentLocale} path={`/products/${slug}${query.variant ? `?variant=${encodeURIComponent(query.variant)}` : ""}`}>
      <Section>
        <Container className="space-y-10">
          <AnalyticsTracker event="product_view" params={{ product_id: product.id, product_name: product.name, product_slug: product.slug, sku: selectedVariant?.sku ?? product.defaultSku, category: productCategoryNames.map((category) => category.name).join(", "), locale: currentLocale }} />
          {/* JSON-LD Structured Data for Product */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: createProductStructuredData({
                id: product.id,
                name: product.name,
                description: product.shortDescription ?? product.description,
                image: defaultImage?.publicUrl,
                sku: selectedVariant?.sku ?? product.defaultSku,
                brand: product.brandName,
                url: buildCanonical(currentLocale, `/products/${slug}`),
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: createBreadcrumbStructuredData(currentLocale, [
                { name: t("products"), path: "/products" },
                ...productCategoryNames.map((category) => ({ name: category.name, path: `/categories/${category.slug}` })),
                { name: product.name, path: `/products/${slug}` },
              ]),
            }}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]" dir={currentLocale === "ar" ? "rtl" : "ltr"}>
            <Link href={localePath(currentLocale, "/products")} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
              {t("products")}
            </Link>
            {productCategoryNames.length > 0 ? (
              <>
                <span>/</span>
                {productCategoryNames.map((category) => (
                  <Link key={category.id} href={localePath(currentLocale, `/categories/${category.slug}`)} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                    {category.name}
                  </Link>
                ))}
              </>
            ) : null}
            <span aria-hidden="true">/</span>
            <span className="min-w-0 max-w-full truncate text-[var(--foreground)]" aria-current="page">{product.name}</span>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12">
            <div>
              <ProductGallery
                images={images.map((img) => ({
                  id: img.id,
                  publicUrl: img.publicUrl,
                  width: img.width,
                  height: img.height,
                  altTextEn: img.altTextEn,
                  altTextAr: img.altTextAr,
                  sortOrder: img.sortOrder,
                  isPrimary: img.isPrimary,
                }))}
                locale={currentLocale}
                productName={product.name}
              />
            </div>

            <div className="space-y-6 lg:pt-2" dir={currentLocale === "ar" ? "rtl" : "ltr"}>
              <div>
                {product.brandName ? <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{product.brandName}</p> : null}
                <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{product.name}</h1>
              </div>

              {product.shortDescription ? (
                <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">{product.shortDescription}</p>
              ) : null}

              {attributeSelectionsByGroup.length > 0 ? (
                <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("selectVariant")}</h2>
                  <div className="grid gap-3">
                    {attributeSelectionsByGroup.map((group) => (
                      <div key={group.attributeId} className="space-y-2">
                        <p className="text-sm font-medium text-[var(--foreground)]">{group.attributeName}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.options.length > 0 ? group.options.map((option) => (
                            <Link key={option.id} href={localePath(currentLocale, `/products/${slug}?variant=${encodeURIComponent(option.id)}`)} className="rounded-full border border-[var(--brand-border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:border-[var(--brand-primary)]">
                              {option.label}
                            </Link>
                          )) : <span className="text-sm text-[var(--text-muted)]">{t("noOptions")}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{selectedVariant ? `${t("selectedVariant")}: ${selectedVariant.sku}` : t("noVariants")}</p>
                </div>
              ) : null}

              <SalesActions locale={currentLocale} phone={contactSettings.business_phone} email={contactSettings.business_email} whatsapp={contactSettings.whatsapp_number} productName={product.name} productSlug={product.slug} variantId={selectedVariant?.id} />

              {(Boolean(selectedVariant?.sku ?? product.defaultSku) || productCategoryNames.length > 0) ? (
                <dl className="grid max-w-xl grid-cols-1 gap-3 rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-4 sm:grid-cols-2">
                  {selectedVariant?.sku ?? product.defaultSku ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{common("sku")}</dt>
                      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{selectedVariant?.sku ?? product.defaultSku}</dd>
                    </div>
                  ) : null}
                  {productCategoryNames.length > 0 ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{common("category")}</dt>
                      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{productCategoryNames.map((category) => category.name).join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </div>

          <div className="mx-auto max-w-[820px] pt-2" dir={currentLocale === "ar" ? "rtl" : "ltr"}>
            {specifications.length > 0 || product.description ? (
              <div className="space-y-6">
                {specifications.length > 0 ? (
                  <section className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("specifications")}</h2>
                    <div className="mt-5 space-y-3">
                      {specifications.map((specification) => (
                        <div key={specification.id} className="flex items-center justify-between gap-4 border-b border-[var(--brand-border)] py-2 text-sm">
                          <span className="font-medium text-[var(--foreground)]">{specification.name}</span>
                          <span className="text-[var(--text-muted)]">{specification.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {product.description ? (
                  <section className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("details")}</h2>
                    <div className="prose mt-5 max-w-none text-sm leading-7 text-[var(--text-muted)]">
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>

          {relatedProducts.length > 0 ? (
            <section className="space-y-6" dir={currentLocale === "ar" ? "rtl" : "ltr"}>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{relatedHeading}</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {relatedProducts.map((item) => <ProductCard key={item.id} locale={currentLocale} product={item} />)}
              </div>
            </section>
          ) : null}

          <section className="border-t border-[var(--brand-border)] pt-8" dir={currentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="mx-auto max-w-xl text-center">
              <p className="text-lg font-medium text-[var(--foreground)]">{currentLocale === "ar" ? "هل أنت مهتم بهذا المنتج؟" : "Interested in this product?"}</p>
              <div className="mt-4 flex justify-center">
                <SalesActions locale={currentLocale} phone={contactSettings.business_phone} email={contactSettings.business_email} whatsapp={contactSettings.whatsapp_number} productName={product.name} productSlug={product.slug} variantId={selectedVariant?.id} />
              </div>
            </div>
          </section>
        </Container>
      </Section>
    </PublicShell>
  );
}
