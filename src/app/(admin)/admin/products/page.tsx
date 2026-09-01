import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import {
  getProductById,
  listBrands,
  listCategories,
  listProductImagesForProduct,
  listProductTranslationsForProduct,
} from "@/server/repositories/catalog-admin";
import { ProductImageField } from "@/components/admin/product-image-field";
import { requireAdminSession } from "@/server/services/admin-auth";
import { upsertProductAction, upsertProductCategoryAction } from "@/server/services/admin-catalog";
import Link from "next/link";
import ClientProductList from "@/components/admin/product-list";
import ClientAdminPagination from "@/components/admin/admin-pagination";
import AdminPageSizeSelect from "@/components/admin/admin-page-size-select";
import { listProductsPaginated } from "@/server/repositories/catalog-admin";

type PageProps = {
  searchParams: Promise<{ edit?: string; page?: string; pageSize?: string; search?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const pageNum = params.page ? Number(params.page) || 1 : 1;
  const pageSize = [10, 20, 30, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const searchQ = typeof params.search === "string" ? params.search : "";
  const productsPaginated = await listProductsPaginated({ page: pageNum, pageSize, search: searchQ });
  const products = productsPaginated.items;
  const brands = await listBrands();
  const categories = await listCategories();
  const editId = params.edit ?? "";
  const editingProduct = editId ? await getProductById(editId) : null;
  const editingTranslations = editingProduct
    ? await listProductTranslationsForProduct(editingProduct.id)
    : [];
  const editingImages = editingProduct
    ? await listProductImagesForProduct(editingProduct.id)
    : [];

  const defaultProductName =
    editingTranslations.find((translation) => translation.locale === "en")?.name ??
    editingTranslations[0]?.name ??
    editingProduct?.slug ??
    "";

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Products</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create product</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertProductAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Product name"
                    required
                    defaultValue={defaultProductName}
                  />
                </div>

                <div>
                  <Label htmlFor="productId">Product ID (for edit)</Label>
                  <Input
                    id="productId"
                    name="productId"
                    placeholder="paste product id to edit"
                    defaultValue={editingProduct?.id ?? ""}
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="product-slug"
                    defaultValue={editingProduct?.slug ?? ""}
                  />
                </div>

                <div>
                  <Label htmlFor="brandId">Brand</Label>
                  <Select id="brandId" name="brandId" defaultValue="">
                    <option value="">No brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.slug}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultSku">Default SKU</Label>
                  <Input id="defaultSku" name="defaultSku" placeholder="QMB-001" />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="DRAFT">
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>

                <ProductImageField key={editingProduct?.id ?? "new"} currentImages={editingImages.map((img) => ({ id: img.id, publicUrl: img.publicUrl, objectKey: img.objectKey, width: img.width, height: img.height, isPrimary: img.isPrimary }))} />

                <Button type="submit" className="w-full">
                  Save product
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Assign to category</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertProductCategoryAction} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Product</Label>
                  <Select id="productId" name="productId" defaultValue="">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.slug}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select id="categoryId" name="categoryId" defaultValue="">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.slug}
                      </option>
                    ))}
                  </Select>
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input type="checkbox" name="isPrimary" />
                  Primary category
                </label>

                <Button type="submit" className="w-full">
                  Link category
                </Button>
              </form>
            </CardBody>
          </Card>

          {editingProduct ? (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Editing: {editingProduct.slug}
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">Translations</h3>
                    {editingTranslations.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">No translations</p>
                    ) : (
                      <ul className="text-sm">
                        {editingTranslations.map((translation) => (
                          <li key={translation.id}>
                            {translation.locale}: {translation.name ?? "(no name)"}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Use the {" "}
                      <Link href="/admin/translations" className="text-[var(--brand-primary)]">
                        Translations
                      </Link>{" "}
                      admin to edit translations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Images</h3>
                    {editingImages.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">No images</p>
                    ) : (
                      <ul className="text-sm">
                        {editingImages.map((image) => (
                          <li key={image.id}>
                            {image.publicUrl} {image.isPrimary ? "(primary)" : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Use the {" "}
                      <Link href="/admin/images" className="text-[var(--brand-primary)]">
                        Images
                      </Link>{" "}
                      admin to add or edit images.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Product list</h2>
          </CardHeader>
          <CardBody className="space-y-3 min-w-0 max-w-full break-words">
            {products.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No products found.</p>
            ) : (
              <>
                {/* Search and page size controls */}
                <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                  <form method="get" action="/admin/products" className="flex gap-2 min-w-0 flex-1">
                    <input name="search" defaultValue={searchQ} placeholder="Search products..." className="rounded border px-3 py-2 text-sm flex-1 min-w-0" />
                    <button type="submit" className="rounded bg-[var(--brand-primary)] text-white px-3 py-2 text-sm">Search</button>
                  </form>
                  <div className="flex-shrink-0">
                    <AdminPageSizeSelect value={productsPaginated.pageSize} />
                  </div>
                </div>

                {/* Product list component (responsive) */}
                <div>
                  {/* Client component will manage delete UX */}
                  <ClientProductList initialItems={products} total={productsPaginated.total} page={productsPaginated.page} pageSize={productsPaginated.pageSize} basePath="/admin/products" search={searchQ} />
                </div>

                <div className="mt-4">
                  {/* Pagination */}
                  <ClientAdminPagination total={productsPaginated.total} page={productsPaginated.page} pageSize={productsPaginated.pageSize} basePath="/admin/products" search={searchQ} />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
