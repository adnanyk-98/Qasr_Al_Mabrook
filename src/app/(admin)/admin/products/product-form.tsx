"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { ProductImageField } from "@/components/admin/product-image-field";
import type { ProductActionState } from "@/server/services/admin-catalog";
import { upsertProductAction } from "./actions";

type ProductFormValues = {
  id?: string;
  slug?: string | null;
  brandId?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  defaultSku?: string | null;
};

type ProductTranslationValues = {
  name: string;
  shortDescription: string | null;
  description: string | null;
};

type ImageValues = { id: string; publicUrl: string; objectKey: string; width: number | null; height: number | null; isPrimary: boolean };

export function ProductForm({
  product,
  translation,
  images,
  categories,
  brands,
  primaryCategoryId,
  primaryCategory,
  defaultLocale,
}: {
  product: ProductFormValues | null;
  translation: ProductTranslationValues | null;
  images: ImageValues[];
  categories: { id: string; slug: string }[];
  brands: { id: string; slug: string }[];
  primaryCategoryId: string;
  primaryCategory: boolean;
  defaultLocale: "en" | "ar";
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(upsertProductAction, { status: "idle" });

  useEffect(() => {
    if (state.status === "success" && state.productId) {
      router.replace(`/admin/products?edit=${state.productId}`);
      router.refresh();
    }
  }, [router, state]);

  const errorFor = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {product?.id ? <input type="hidden" name="productId" value={product.id} /> : null}
      <div>
        <Label htmlFor="productName">Product name ({defaultLocale})</Label>
        <Input id="productName" name="name" placeholder="Product name" required maxLength={255} defaultValue={translation?.name ?? ""} aria-invalid={Boolean(errorFor("name"))} />
        {errorFor("name") ? <p className="mt-1 text-sm text-red-700">{errorFor("name")}</p> : null}
      </div>

      <div>
        <Label htmlFor="productShortDescription">Short description ({defaultLocale})</Label>
        <Textarea id="productShortDescription" name="shortDescription" placeholder="Short product description" rows={2} required maxLength={10000} defaultValue={translation?.shortDescription ?? ""} aria-invalid={Boolean(errorFor("shortDescription"))} />
        {errorFor("shortDescription") ? <p className="mt-1 text-sm text-red-700">{errorFor("shortDescription")}</p> : null}
      </div>

      <div>
        <Label htmlFor="productDescription">Long description ({defaultLocale})</Label>
        <Textarea id="productDescription" name="description" placeholder="Long product description" rows={6} required maxLength={50000} defaultValue={translation?.description ?? ""} aria-invalid={Boolean(errorFor("description"))} />
        {errorFor("description") ? <p className="mt-1 text-sm text-red-700">{errorFor("description")}</p> : null}
      </div>

      <div>
        <Label htmlFor="productSlug">Slug</Label>
        <Input id="productSlug" name="slug" placeholder="product-slug" maxLength={255} defaultValue={product?.slug ?? ""} aria-invalid={Boolean(errorFor("slug"))} />
        {errorFor("slug") ? <p className="mt-1 text-sm text-red-700">{errorFor("slug")}</p> : null}
      </div>

      <div>
        <Label htmlFor="productBrandId">Brand</Label>
        <Select id="productBrandId" name="brandId" defaultValue={product?.brandId ?? ""}>
          <option value="">No brand</option>
          {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.slug}</option>)}
        </Select>
      </div>

      <div>
        <Label htmlFor="productDefaultSku">Default SKU</Label>
        <Input id="productDefaultSku" name="defaultSku" placeholder="QMB-001" maxLength={255} defaultValue={product?.defaultSku ?? ""} aria-invalid={Boolean(errorFor("defaultSku"))} />
        {errorFor("defaultSku") ? <p className="mt-1 text-sm text-red-700">{errorFor("defaultSku")}</p> : null}
      </div>

      <div>
        <Label htmlFor="productCategoryId">Category</Label>
        <Select id="productCategoryId" name="categoryId" defaultValue={primaryCategoryId}>
          <option value="">No category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.slug}</option>)}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
        <input type="checkbox" name="isPrimaryCategory" defaultChecked={primaryCategory} />
        Primary category
      </label>

      <div>
        <Label htmlFor="productStatus">Status</Label>
        <Select id="productStatus" name="status" defaultValue={product?.status ?? "DRAFT"}>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </Select>
      </div>

      <ProductImageField key={product?.id ?? "new"} currentImages={images} />

      {state.status === "error" && state.message ? <p className="text-sm text-red-700" role="alert">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-green-700" role="status">{state.message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : product?.id ? "Save product" : "Create product"}</Button>
    </form>
  );
}