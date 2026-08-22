import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { listAttributeTranslations, listCategoryTranslations, listProductTranslations } from "@/server/repositories/catalog-admin";
import { upsertAttributeTranslationAction, upsertCategoryTranslationAction, upsertProductTranslationAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";
import { listAttributes, listCategories, listProducts } from "@/server/repositories/catalog-admin";

export default async function TranslationsPage() {
  await requireAdminSession();
  const products = await listProducts();
  const categories = await listCategories();
  const attributes = await listAttributes();
  const categoryTranslations = await listCategoryTranslations();
  const productTranslations = await listProductTranslations();
  const attributeTranslations = await listAttributeTranslations();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Translations</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Product translation</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertProductTranslationAction} className="space-y-4">
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
                  <Label htmlFor="locale">Locale</Label>
                  <Select id="locale" name="locale" defaultValue="en">
                    <option value="en">en</option>
                    <option value="ar">ar</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Product name" required />
                </div>
                <div>
                  <Label htmlFor="shortDescription">Short description</Label>
                  <Input id="shortDescription" name="shortDescription" placeholder="Short text" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Long description" />
                </div>
                <Button type="submit" className="w-full">Save product translation</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Category translation</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertCategoryTranslationAction} className="space-y-4">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select id="categoryId" name="categoryId" defaultValue="">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.slug}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="locale">Locale</Label>
                  <Select id="locale" name="locale" defaultValue="en">
                    <option value="en">en</option>
                    <option value="ar">ar</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Category name" required />
                </div>
                <Input id="description" name="description" placeholder="Category description" />
                <Button type="submit" className="w-full">Save category translation</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Attribute translation</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertAttributeTranslationAction} className="space-y-4">
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
                  <Label htmlFor="locale">Locale</Label>
                  <Select id="locale" name="locale" defaultValue="en">
                    <option value="en">en</option>
                    <option value="ar">ar</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Label</Label>
                  <Input id="name" name="name" placeholder="Attribute name" required />
                </div>
                <Button type="submit" className="w-full">Save attribute translation</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Product translations</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {productTranslations.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No product translations yet.</p> : productTranslations.map((entry) => <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3"><p className="font-medium text-[var(--foreground)]">{entry.name}</p><p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{entry.locale}</p></div>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Category translations</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {categoryTranslations.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No category translations yet.</p> : categoryTranslations.map((entry) => <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3"><p className="font-medium text-[var(--foreground)]">{entry.name}</p><p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{entry.locale}</p></div>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Attribute translations</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {attributeTranslations.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No attribute translations yet.</p> : attributeTranslations.map((entry) => <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3"><p className="font-medium text-[var(--foreground)]">{entry.name}</p><p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{entry.locale}</p></div>)}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
