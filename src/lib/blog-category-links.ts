import { localePath, type Locale } from "@/lib/locales";
import { canonicalPublicCategorySlug } from "@/lib/public-catalog-mapping";

const categoryReferencePattern = /href="category-id:([0-9a-f-]{36})"/g;
const categoryAnchorPattern = /<a href="category-id:([0-9a-f-]{36})">([\s\S]*?)<\/a>/g;

export function getBlogCategoryIds(body: readonly string[]) {
  return [
    ...new Set(
      body.flatMap((html) =>
        [...html.matchAll(categoryReferencePattern)].map((match) => match[1]),
      ),
    ),
  ];
}

export function renderBlogCategoryLinks(
  locale: Locale,
  html: string,
  categorySlugs: ReadonlyMap<string, string>,
) {
  return html.replace(
    categoryAnchorPattern,
    (_anchor, categoryId: string, label: string) => {
      const storedSlug = categorySlugs.get(categoryId);
      if (!storedSlug) return label;

      const slug = canonicalPublicCategorySlug(storedSlug);
      const href = localePath(locale, `/categories/${encodeURIComponent(slug)}`);
      return `<a href="${href}">${label}</a>`;
    },
  );
}
