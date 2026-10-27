export const legacyCategoryRedirects = (["en", "ar"] as const).map((locale) => ({
  source: `/${locale}/categories/cloth-piece`,
  destination: `/${locale}/categories/fabrics-textiles`,
  permanent: true,
}));
