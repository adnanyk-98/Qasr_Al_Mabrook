import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { blogArticles, getBlogArticleBySlug } from "@/lib/blog";
import {
  getCategoryLandingContent,
  getProductLandingContent,
} from "@/lib/catalogue-landing-content";
import {
  createBlogPostingStructuredData,
  createProductMetadata,
  createPublicPageMetadata,
} from "@/lib/seo";

test("Vaultex category and product landing content are localized", () => {
  for (const locale of ["en", "ar"] as const) {
    const category = getCategoryLandingContent(locale, "safety-shoes");
    const product = getProductLandingContent(locale, "vaultex-safety-shoes");
    assert.ok(category);
    assert.ok(product);
    assert.ok(category.links.some((link) => link.href === "/products/vaultex-safety-shoes"));
    assert.ok(product.imageAlt);
  }
});

test("Vaultex product metadata uses the suggested title and description", () => {
  const product = getProductLandingContent("en", "vaultex-safety-shoes");
  assert.equal(product?.heading, "VAULTEX SAFETY SHOES");
  assert.equal(product?.seoTitle, "Vaultex Safety Shoes in UAE | Qasr Al Mabrook");
  assert.match(product?.seoDescription ?? "", /industrial, construction and warehouse workplaces/);
  assert.equal(
    product?.imageAlt,
    "Vaultex VTI brown safety shoes with protective footwear packaging",
  );
  assert.doesNotMatch(product?.description ?? "", /steel toe|anti-slip|puncture|electrical hazard|EN \d/i);
});

test("Vaultex product metadata keeps localized canonical and alternate URLs", () => {
  for (const locale of ["en", "ar"] as const) {
    const product = getProductLandingContent(locale, "vaultex-safety-shoes");
    assert.ok(product);
    const metadata = createProductMetadata({
      locale,
      path: "/products/vaultex-safety-shoes",
      productName: product.heading,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      productImageAlt: product.imageAlt,
      hasAlternate: true,
    });
    assert.equal(
      metadata.alternates?.canonical,
      `https://www.qasralmabrook.com/${locale}/products/vaultex-safety-shoes`,
    );
    assert.equal(
      metadata.alternates?.languages?.en,
      "https://www.qasralmabrook.com/en/products/vaultex-safety-shoes",
    );
    assert.equal(
      metadata.alternates?.languages?.ar,
      "https://www.qasralmabrook.com/ar/products/vaultex-safety-shoes",
    );
  }
});

test("bilingual safety article metadata and internal links are complete", () => {
  const article = getBlogArticleBySlug("en", "choose-safety-shoes-industrial-work-uae");
  assert.ok(article);
  assert.equal(article.title, "How to Choose the Right Safety Shoes for Industrial Work in the UAE");
  assert.ok(article.body.join("").includes("/en/products/vaultex-safety-shoes"));
  assert.ok(article.body.join("").includes("/en/categories/safety-shoes"));

  const arabic = getBlogArticleBySlug("ar", "choose-safety-shoes-industrial-work-uae");
  assert.ok(arabic);
  assert.equal(arabic.title, "كيفية اختيار أحذية السلامة المناسبة للعمل الصناعي في الإمارات");
  assert.ok(arabic.body.join("").includes("/ar/products/vaultex-safety-shoes"));
  assert.ok(arabic.body.join("").includes("/ar/categories/safety-shoes"));
});

test("bilingual safety article metadata and structured data are localized", () => {
  for (const locale of ["en", "ar"] as const) {
    const article = getBlogArticleBySlug(
      locale,
      "choose-safety-shoes-industrial-work-uae",
    );
    assert.ok(article);

    const path = `/blog/${article.slug}`;
    const url = `https://www.qasralmabrook.com/${locale}${path}`;
    const metadata = createPublicPageMetadata({
      locale,
      path,
      title: article.seoTitle,
      description: article.seoDescription,
      ogImage: article.featuredImage,
      ogImageAlt: article.title,
      hasAlternate: true,
    });
    assert.equal(metadata.alternates?.canonical, url);
    assert.equal(metadata.alternates?.languages?.en, `https://www.qasralmabrook.com/en${path}`);
    assert.equal(metadata.alternates?.languages?.ar, `https://www.qasralmabrook.com/ar${path}`);
    assert.equal(metadata.description, article.seoDescription);

    const json = JSON.parse(
      createBlogPostingStructuredData({
        title: article.title,
        description: article.seoDescription,
        image: article.featuredImage,
        url,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        locale,
      }),
    );
    assert.equal(json["@type"], "BlogPosting");
    assert.equal(json.inLanguage, locale);
    assert.equal(json.url, url);
  }
});

test("blog article records have truthful stable dates and distinct values are preserved", () => {
  for (const article of blogArticles) {
    assert.match(article.publishedAt, /^\d{4}-\d{2}-\d{2}$/u);
  }
  const newArticle = blogArticles.find(
    (article) => article.slug === "choose-safety-shoes-industrial-work-uae",
  );
  assert.ok(newArticle);
  assert.equal(newArticle.publishedAt, "2026-11-23");
  assert.equal(newArticle.updatedAt, newArticle.publishedAt);
});

test("category breadcrumb and sitemap use stable static blog timestamps", () => {
  const cwd = process.cwd();
  const productPage = readFileSync(
    join(cwd, "src/app/[locale]/(with-loading)/products/[slug]/page.tsx"),
    "utf8",
  );
  const sitemap = readFileSync(join(cwd, "src/app/sitemap.ts"), "utf8");
  assert.match(productPage, /\/categories\/\$\{category\.slug\}/u);
  assert.match(productPage, /productName=\{landingContent\?\.imageAlt \?\? product\.name\}/u);
  assert.doesNotMatch(sitemap, /new Date\(article\.updatedAt\)/u);
  assert.match(sitemap, /article\.updatedAt \?\? article\.publishedAt/u);
});
