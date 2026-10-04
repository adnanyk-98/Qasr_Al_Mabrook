import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getBlogArticles, resolveBlogHref } from "@/lib/blog";
import { locales, type Locale } from "@/lib/locales";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const currentLocale = locale as Locale;
  const metadataT = await getTranslations({ locale: currentLocale, namespace: "metadata" });

  return createPublicPageMetadata({
    locale: currentLocale,
    path: "/blog",
    title: metadataT("blogTitle"),
    description: metadataT("blogDescription"),
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const commonT = await getTranslations({ locale: currentLocale, namespace: "common" });
  const metadataT = await getTranslations({ locale: currentLocale, namespace: "metadata" });
  const articles = getBlogArticles(currentLocale);

  return (
    <PublicShell locale={currentLocale} path="/blog">
      <Section>
        <Container className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
              {currentLocale === "ar" ? "المدونة" : "Blog"}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
              {metadataT("blogTitle")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              {metadataT("blogDescription")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.slug} className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="mb-5 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span>{new Intl.DateTimeFormat(currentLocale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(article.publishedAt))}</span>
                  <span>{currentLocale === "ar" ? "قصر المبارك" : "Qasr Al Mabrook"}</span>
                </div>

                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{article.title}</h2>
                <p className="mt-4 flex-1 text-base leading-7 text-[var(--text-muted)]">{article.excerpt}</p>

                <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {article.slug.includes("measuring") ? <span>{currentLocale === "ar" ? "أشرطة القياس" : "Measuring Tape"}</span> : null}
                  {article.slug.includes("pajama") ? <span>{currentLocale === "ar" ? "البيجاما" : "Pajama"}</span> : null}
                  {article.slug.includes("cloth") ? <span>{currentLocale === "ar" ? "قطع القماش" : "Cloth Piece"}</span> : null}
                  {article.slug.includes("fancy") ? <span>{currentLocale === "ar" ? "بدلات فاخرة" : "Fancy Suit"}</span> : null}
                  {article.slug.includes("adivasi") ? <span>{currentLocale === "ar" ? "زيت أديفاسي" : "Adivasi Oil"}</span> : null}
                  {article.slug.includes("guide") && !article.slug.includes("measuring") && !article.slug.includes("pajama") && !article.slug.includes("cloth") && !article.slug.includes("fancy") && !article.slug.includes("adivasi") ? <span>{currentLocale === "ar" ? "دليل التسوق" : "Shopping guide"}</span> : null}
                </div>

                <div className="mt-6">
                  <Link
                    href={resolveBlogHref(currentLocale, article.slug)}
                    className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-dark)]"
                  >
                    {commonT("viewDetails")}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>
    </PublicShell>
  );
}
