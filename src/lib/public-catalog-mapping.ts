import type { Locale } from "@/lib/locales";

type LocalizedRecord = { locale: Locale };

export function findLocaleTranslation<T extends LocalizedRecord>(
  translations: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === "en")
  );
}

export function mapPublishedBrands<
  Brand extends { id: string; baseName: string; logoUrl: string | null },
  Translation extends { brandId: string; locale: Locale; name: string },
>(brands: readonly Brand[], translations: readonly Translation[], locale: Locale) {
  return brands.map((brand) => {
    const translation = findLocaleTranslation(
      translations.filter((candidate) => candidate.brandId === brand.id),
      locale,
    );
    return {
      id: brand.id,
      name: translation?.name ?? brand.baseName,
      logoUrl: brand.logoUrl,
    };
  });
}

export function mapPublishedCategories<
  Category extends { id: string; status: string; slug: string },
  Translation extends {
    categoryId: string;
    locale: Locale;
    name: string;
    description: string | null;
  },
>(
  categories: readonly Category[],
  translations: readonly Translation[],
  locale: Locale,
) {
  return categories.flatMap((category) => {
    if (category.status !== "PUBLISHED") return [];
    const translation = translations.find(
      (candidate) =>
        candidate.categoryId === category.id && candidate.locale === locale,
    );
    if (!translation) return [];
    return [
      {
        ...category,
        name: translation.name,
        description: translation.description,
      },
    ];
  });
}

export function mapProductCategoriesForLocale<
  Category extends { id: string; status: string },
  Translation extends { categoryId: string; locale: Locale },
>(
  rows: readonly { category: Category }[],
  translations: readonly Translation[],
  locale: Locale,
) {
  return rows.flatMap(({ category }) => {
    if (category.status !== "PUBLISHED") return [];
    const translation =
      findLocaleTranslation(
        translations.filter((candidate) => candidate.categoryId === category.id),
        locale,
      ) ?? null;
    return [{ category, translation }];
  });
}

export type AutocompleteRow = {
  productId: string;
  slug: string;
  sku: string | null;
  productName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  primaryImageUrl: string | null;
  primaryImageAltEn: string | null;
  primaryImageAltAr: string | null;
};

export function mapAutocompleteRows(rows: readonly AutocompleteRow[], locale: Locale) {
  const seen = new Set<string>();

  return rows.flatMap((row) => {
    if (seen.has(row.productId)) return [];
    seen.add(row.productId);
    return [
      {
        id: row.productId,
        slug: row.slug,
        name: row.productName ?? row.slug,
        categoryName: row.categoryName ?? row.categorySlug ?? null,
        sku: row.sku,
        imageUrl: row.primaryImageUrl,
        imageAlt:
          locale === "ar"
            ? (row.primaryImageAltAr ?? row.primaryImageAltEn)
            : (row.primaryImageAltEn ?? row.primaryImageAltAr),
      },
    ];
  });
}
