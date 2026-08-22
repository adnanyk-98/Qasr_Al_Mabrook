import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listBrands } from "@/server/repositories/catalog-admin";
import { upsertBrandAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function BrandsPage() {
  await requireAdminSession();
  const brands = await listBrands();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Brands</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create brand</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertBrandAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Brand name" required />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="brand-slug" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="DRAFT">
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Save brand</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Brand list</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {brands.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No brands yet.</p>
              ) : (
                brands.map((brand) => (
                  <div key={brand.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--foreground)]">{brand.slug}</p>
                      <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
                        {brand.status}
                      </span>
                    </div>
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
