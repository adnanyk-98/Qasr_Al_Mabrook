import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listAttributes, listProducts, listVariantCombinations, listVariantDefinitions } from "@/server/repositories/catalog-admin";
import { upsertVariantAction, upsertVariantCombinationAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function VariantsPage() {
  await requireAdminSession();
  const products = await listProducts();
  const attributes = await listAttributes();
  const variantDefinitions = await listVariantDefinitions();
  const variantCombinations = await listVariantCombinations();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Variants</h1>
          </div>
          <AdminBackButton />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Define variant attribute</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertVariantAction} className="space-y-4">
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
                  <Label htmlFor="attributeId">Attribute</Label>
                  <Select id="attributeId" name="attributeId" defaultValue="">
                    <option value="">Select attribute</option>
                    {attributes.map((attribute) => (
                      <option key={attribute.id} value={attribute.id}>{attribute.code}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
                </div>
                <Button type="submit" className="w-full">Save variant definition</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create variant combination</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertVariantCombinationAction} className="space-y-4">
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
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" name="sku" placeholder="QMB-SIZE-01" required />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="DRAFT">
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Save variant</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Variant definitions</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {variantDefinitions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No variant definitions yet.</p>
              ) : (
                variantDefinitions.map((definition) => (
                  <div key={definition.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                    <p className="font-medium text-[var(--foreground)]">{definition.productId}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Attribute: {definition.attributeId}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Variant combinations</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {variantCombinations.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No combinations yet.</p>
              ) : (
                variantCombinations.map((combination) => (
                  <div key={combination.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                    <p className="font-medium text-[var(--foreground)]">{combination.sku}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{combination.status}</p>
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
