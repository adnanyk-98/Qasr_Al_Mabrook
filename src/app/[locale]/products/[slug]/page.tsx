import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/public/product-card";
import { PublicImageSlot } from "@/components/public/public-image-slot";
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
  listProductVariantGroups,
  listRelatedProducts,
  listVariantCombinationValuesForProduct,
  listVariantCombinationsForProduct,
} from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { createProductMetadata, createProductStructuredData, buildCanonical } from "@/lib/seo";

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

  const [images, categories, variants, variantValues, contactSettings] = await Promise.all([
    listProductImagesForPublic(product.id),
    listProductCategoriesForProduct(product.id, currentLocale),
    listVariantCombinationsForProduct(product.id),
    listVariantCombinationValuesForProduct(product.id, currentLocale),
    getPublicContactSettings(),
  ]);
  const relatedProducts = await listRelatedProducts(currentLocale, product.id, categories.map(({ category }) => category.id));

  const productCategoryNames = categories.map(({ category, translation }) => ({
    id: category.id,
    name: translation?.name ?? category.slug,
  }));
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
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <Link href={localePath(currentLocale, "/products")} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
              {t("products")}
            </Link>
            {productCategoryNames.length > 0 ? (
              <>
                <span>/</span>
                {productCategoryNames.map((category) => (
                  <Link key={category.id} href={localePath(currentLocale, `/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`)} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                    {category.name}
                  </Link>
                ))}
              </>
            ) : null}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {/* Client-side gallery component */}
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
            </div>

            <div className="space-y-6">
              <div>
                {product.brandName ? <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{product.brandName}</p> : null}
                <h1 className="mt-2 text-4xl font-semibold text-[var(--foreground)]">{product.name}</h1>
              </div>

              <p className="text-base leading-7 text-[var(--text-muted)]">{product.shortDescription ?? product.description ?? t("noSummary")}</p>

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
              <Link href={localePath(currentLocale, "/products")} className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                {common("backToCatalogue")}
              </Link>

              <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-5 text-sm leading-6 text-[var(--text-muted)]">
                {product.description ? <div dangerouslySetInnerHTML={{ __html: product.description }} /> : t("noDescription")}
              </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("specifications")}</h2>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--brand-border)] py-2 text-sm">
                  <span className="font-medium text-[var(--foreground)]">{common("sku")}</span>
                  <span className="text-[var(--text-muted)]">{selectedVariant?.sku ?? product.defaultSku ?? "—"}</span>
                </div>
                {productCategoryNames.length > 0 ? (
                  <div className="flex items-center justify-between border-b border-[var(--brand-border)] py-2 text-sm">
                    <span className="font-medium text-[var(--foreground)]">{common("category")}</span>
                    <span className="text-[var(--text-muted)]">{productCategoryNames.map((category) => category.name).join(", ")}</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("details")}</h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
                <p>{product.description ?? product.shortDescription ?? t("noDescription")}</p>
              </div>
            </section>
          </div>

          {relatedProducts.length > 0 ? (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("related")}</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {relatedProducts.map((item) => <ProductCard key={item.id} locale={currentLocale} product={item} />)}
              </div>
            </section>
          ) : null}
        </Container>
      </Section>
    </PublicShell>
  );
}
