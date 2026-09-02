export type AutocompleteResult = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  sku: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export function filterAutocompleteResults(results: AutocompleteResult[], query: string, limit = 6) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return results
    .filter((result) => result.slug.toLocaleLowerCase().includes(normalizedQuery) || result.name.toLocaleLowerCase().includes(normalizedQuery))
    .slice(0, Math.max(1, Math.min(12, limit)));
}