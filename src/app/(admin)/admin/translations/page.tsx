import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { listAttributeTranslations, listCategoryTranslations, listProductTranslations } from "@/server/repositories/catalog-admin";
import { upsertAttributeTranslationAction } from "./actions";
import { requireAdminSession } from "@/server/services/admin-auth";
import { siteConfig } from "@/config/site";
import { listAttributes, listCategories, listProducts } from "@/server/repositories/catalog-admin";
import { TranslationManager } from "./translation-manager";

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Translations</h1>
          </div>
          <AdminBackButton />
        </div>

        <TranslationManager
          products={products.map(({ id, slug }) => ({ id, slug }))}
          categories={categories.map(({ id, slug }) => ({ id, slug }))}
          defaultLocale={siteConfig.defaultLocale}
          productTranslations={productTranslations.map(({ id, productId, locale, name, shortDescription, description }) => ({ id, productId, locale, name, shortDescription, description }))}
          categoryTranslations={categoryTranslations.map(({ id, categoryId, locale, name, shortDescription, description }) => ({ id, categoryId, locale, name, shortDescription, description }))}
        />

        <div className="grid gap-6 xl:grid-cols-3">
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
