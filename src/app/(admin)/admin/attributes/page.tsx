import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listAttributes, listCategories } from "@/server/repositories/catalog-admin";
import { upsertAttributeAction, upsertCategoryAttributeAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function AttributesPage() {
  await requireAdminSession();
  const attributes = await listAttributes();
  const categories = await listCategories();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Attributes</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create attribute</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertAttributeAction} className="space-y-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="material-type" required />
                </div>
                <div>
                  <Label htmlFor="dataType">Data type</Label>
                  <Select id="dataType" name="dataType" defaultValue="TEXT">
                    <option value="TEXT">TEXT</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="SELECT">SELECT</option>
                    <option value="MULTI_SELECT">MULTI_SELECT</option>
                    <option value="COLOR">COLOR</option>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isVariantDefining" /> Variant defining</label>
                  <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isFilterable" /> Filterable</label>
                  <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isSearchable" /> Searchable</label>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="DRAFT">
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Save attribute</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Map attribute to category</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertCategoryAttributeAction} className="space-y-4">
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
                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isRequired" /> Required</label>
                <Button type="submit" className="w-full">Link attribute</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Attribute list</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {attributes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No attributes yet.</p>
            ) : (
              attributes.map((attribute) => (
                <div key={attribute.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{attribute.code}</p>
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{attribute.dataType}</p>
                    </div>
                    <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
                      {attribute.status}
                    </span>
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
