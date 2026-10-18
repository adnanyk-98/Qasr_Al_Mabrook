import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { blogArticles, getBlogArticleBySlug, getBlogArticles, resolveBlogHref } from "@/lib/blog";
import { locales, localePath, type Locale } from "@/lib/locales";
import {
  buildCanonical,
  createBlogPostingStructuredData,
  createBreadcrumbStructuredData,
  createPublicPageMetadata,
} from "@/lib/seo";

export async function generateStaticParams() {
  return locales.flatMap((locale) => blogArticles.map((article) => ({ locale, slug: article.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const currentLocale = locale as Locale;
  const article = getBlogArticleBySlug(currentLocale, slug);
  if (!article) return {};

  return createPublicPageMetadata({
    locale: currentLocale,
    path: `/blog/${slug}`,
    title: article.seoTitle,
    description: article.seoDescription,
    ogImage: article.featuredImage,
    ogImageAlt: article.title,
    hasAlternate: true,
  });
}

export default async function BlogArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const article = getBlogArticleBySlug(currentLocale, slug);
  if (!article) notFound();

  const authorLabel = currentLocale === "ar" ? "قصر المبارك" : "Qasr Al Mabrook";
  const relatedArticleMap: Record<string, string[]> = {
    "shopping-guide": ["choosing-everyday-essentials", "product-discovery-for-smarter-shopping", "pajama-guide"],
    "choosing-everyday-essentials": ["shopping-guide", "pajama-guide", "cloth-piece-guide", "fancy-suit-guide"],
    "product-discovery-for-smarter-shopping": ["measuring-tape-buying-guide", "shopping-guide"],
    "measuring-tape-buying-guide": ["product-discovery-for-smarter-shopping", "shopping-guide"],
    "pajama-guide": ["choosing-everyday-essentials", "shopping-guide"],
    "cloth-piece-guide": ["choosing-everyday-essentials", "shopping-guide"],
    "fancy-suit-guide": ["choosing-everyday-essentials", "shopping-guide"],
    "adivasi-oil-overview": ["shopping-guide"],
  };
  const preferredRelated = relatedArticleMap[slug] ?? ["shopping-guide", "choosing-everyday-essentials"];
  const relatedArticles = getBlogArticles(currentLocale)
    .filter((entry) => entry.slug !== slug)
    .sort((a, b) => {
      const aScore = preferredRelated.includes(a.slug) ? 1 : 0;
      const bScore = preferredRelated.includes(b.slug) ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 2);
  const articleUrl = buildCanonical(currentLocale, `/blog/${slug}`);

  return (
    <PublicShell locale={currentLocale} path={`/blog/${slug}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: createBlogPostingStructuredData({
            title: article.title,
            description: article.seoDescription,
            image: article.featuredImage,
            url: articleUrl,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            locale: currentLocale,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: createBreadcrumbStructuredData(currentLocale, [
            { name: currentLocale === "ar" ? "المدونة" : "Blog", path: "/blog" },
            { name: article.title, path: `/blog/${slug}` },
          ]),
        }}
      />

      <Section>
        <Container className="space-y-8 pb-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span>{new Intl.DateTimeFormat(currentLocale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(article.publishedAt))}</span>
              <span>•</span>
              <span>{authorLabel}</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">{article.title}</h1>
            <p className="max-w-2xl text-xl leading-8 text-[var(--text-muted)]">{article.excerpt}</p>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--brand-border)] pb-4">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {currentLocale === "ar" ? "ملخص" : "Summary"}
              </span>
            </div>
            <p className="mt-4 text-lg leading-8 text-[var(--foreground)]">{article.summary}</p>
          </div>

          {article.featuredImage ? (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 shadow-[var(--shadow-sm)]">
              <Image
                src={article.featuredImage}
                alt={article.title}
                width={1200}
                height={700}
                className="h-auto w-full rounded-[var(--radius-md)] object-cover"
              />
            </div>
          ) : null}

          <article
            className="blog-article prose max-w-none space-y-6 text-[var(--text-muted)]"
            dangerouslySetInnerHTML={{ __html: article.body.join("") }}
          />

          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-6">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">
              {currentLocale === "ar" ? "استكشف المزيد" : "Continue exploring"}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={localePath(currentLocale, "/categories")} className="inline-flex items-center rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-dark)]">
                {currentLocale === "ar" ? "استعراض الفئات" : "Explore categories"}
              </Link>
              <Link href={localePath(currentLocale, "/products")} className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]">
                {currentLocale === "ar" ? "تصفح المنتجات" : "Browse products"}
              </Link>
            </div>
          </div>

          {relatedArticles.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                {currentLocale === "ar" ? "مقالات ذات صلة" : "Related articles"}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.slug}
                    href={resolveBlogHref(currentLocale, relatedArticle.slug)}
                    className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  >
                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {new Intl.DateTimeFormat(currentLocale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(relatedArticle.publishedAt))}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">{relatedArticle.title}</h3>
                    <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">{relatedArticle.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </Section>
    </PublicShell>
  );
}
