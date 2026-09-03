import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export const PUBLIC_CACHE_REVALIDATE_SECONDS = 300;

export function withPublicCache<T>(cacheKey: readonly string[], callback: () => Promise<T>, options?: { revalidate?: number; tags?: string[] }) {
  try {
    const cached = unstable_cache(callback, [...cacheKey], {
      revalidate: options?.revalidate ?? PUBLIC_CACHE_REVALIDATE_SECONDS,
      tags: options?.tags ?? [],
    });

    return cached().catch((error: unknown) => {
      if (error instanceof Error && /incrementalCache missing/i.test(error.message)) {
        return callback();
      }
      throw error;
    });
  } catch (error) {
    if (error instanceof Error && /incrementalCache missing/i.test(error.message)) {
      return callback();
    }
    throw error;
  }
}

export const publicCacheTags = {
  brands: "catalogue:brands",
  categories: "catalogue:categories",
  homepage: "catalogue:homepage",
  products: "catalogue:products",
  product: (id: string) => `catalogue:product:${id}`,
  productSlug: (slug: string) => `catalogue:product-slug:${slug}`,
  category: (id: string) => `catalogue:category:${id}`,
  categorySlug: (slug: string) => `catalogue:category-slug:${slug}`,
  staticPage: (slug: string, locale: string) => `catalogue:static-page:${slug}:${locale}`,
  settings: "catalogue:public-settings",
};

export async function invalidatePublicTag(tag: string) {
  revalidateTag(tag, "max");
}

export async function invalidateProductPublicCache(productId: string, slug?: string) {
  revalidateTag(publicCacheTags.products, "max");
  revalidateTag(publicCacheTags.product(productId), "max");
  if (slug) {
    revalidateTag(publicCacheTags.productSlug(slug), "max");
    revalidatePath(`/en/products/${slug}`);
    revalidatePath(`/ar/products/${slug}`);
  }
  revalidatePath("/en/products");
  revalidatePath("/ar/products");
  revalidatePath("/en");
  revalidatePath("/ar");
}

export async function invalidateCategoryPublicCache(categoryId: string, slug?: string) {
  revalidateTag(publicCacheTags.categories, "max");
  revalidateTag(publicCacheTags.category(categoryId), "max");
  revalidateTag(publicCacheTags.products, "max");
  if (slug) {
    revalidateTag(publicCacheTags.categorySlug(slug), "max");
    revalidatePath(`/en/categories/${slug}`);
    revalidatePath(`/ar/categories/${slug}`);
  }
  revalidatePath("/en/categories");
  revalidatePath("/ar/categories");
  revalidatePath("/en/products");
  revalidatePath("/ar/products");
  revalidatePath("/en");
  revalidatePath("/ar");
}

export async function invalidateBrandPublicCache() {
  revalidateTag(publicCacheTags.brands, "max");
  revalidateTag(publicCacheTags.products, "max");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/products");
  revalidatePath("/ar/products");
}

export async function invalidateHomepagePublicCache() {
  revalidateTag(publicCacheTags.homepage, "max");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/store-locator");
  revalidatePath("/ar/store-locator");
}