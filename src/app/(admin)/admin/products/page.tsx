import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import {
  getProductById,
  listBrands,
  listCategories,
  listProductImagesForProduct,
  listProductTranslationsForProduct,
  listProducts,
} from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { upsertProductAction, upsertProductCategoryAction } from "@/server/services/admin-catalog";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  await requireAdminSession();

  const products = await listProducts();
  const brands = await listBrands();
  const categories = await listCategories();

  const params = await searchParams;
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
          <CardBody className="space-y-3">
            {products.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No products yet.</p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{product.slug}</p>
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {product.defaultSku ?? "No SKU"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
                      {product.status}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/admin/products?edit=${product.id}`}
                      className="text-sm text-[var(--brand-primary)]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
