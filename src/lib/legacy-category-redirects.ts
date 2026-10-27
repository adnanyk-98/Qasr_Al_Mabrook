export const legacyCategoryRedirects = (["en", "ar"] as const).flatMap((locale) => [
  {
    source: `/${locale}/categories/cloth-piece`,
    destination: `/${locale}/categories/fabrics-textiles`,
    permanent: true,
  },
  {
    source: `/${locale}/categories/pajama`,
    destination: `/${locale}/categories/mens-bottom-wear`,
    permanent: true,
  },
  {
    source: `/${locale}/categories/adivasi-oil`,
    destination: `/${locale}/categories/hair-oils`,
    permanent: true,
  },
]);
