import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listProductImages, listProducts } from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { upsertImageAction } from "@/server/services/admin-catalog";

export default async function ImagesPage() {
  await requireAdminSession();
  const products = await listProducts();
  const images = await listProductImages();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Images</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Add product image</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertImageAction} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Product</Label>
                  <Select id="productId" name="productId" defaultValue="">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.slug}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="publicUrl">Image URL</Label>
                  <Input id="publicUrl" name="publicUrl" placeholder="https://..." required />
                </div>
                <div>
                  <Label htmlFor="objectKey">Object key</Label>
                  <Input id="objectKey" name="objectKey" placeholder="product/image.jpg" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="width">Width</Label>
                    <Input id="width" name="width" type="number" defaultValue={0} />
                  </div>
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input id="height" name="height" type="number" defaultValue={0} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isPrimary" /> Primary image</label>
                <Button type="submit" className="w-full">Save image</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Current image library</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {images.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No product images yet.</p>
              ) : (
                images.map((image) => (
                  <div key={image.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                    <p className="font-medium text-[var(--foreground)]">{image.productId}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">#{image.sortOrder}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
