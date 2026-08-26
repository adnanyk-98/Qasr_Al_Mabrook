import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { BrandLogoField } from "@/components/admin/brand-logo-field";
import { listBrands } from "@/server/repositories/catalog-admin";
import { deleteBrandAction, upsertBrandAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  await requireAdminSession();
  const params = await searchParams;
  const brands = await listBrands();
  const editing = brands.find((brand) => brand.id === params.edit) ?? null;

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Brands</h1>
        </div>

        {params.error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{params.error}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{editing ? "Edit brand" : "Create brand"}</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertBrandAction} className="space-y-4">
                {editing ? <input type="hidden" name="brandId" value={editing.id} /> : null}
                <div><Label htmlFor="name">Brand name</Label><Input id="name" name="name" defaultValue={editing?.name ?? ""} placeholder="Brand name" required /></div>
                <div><Label htmlFor="slug">Slug</Label><Input id="slug" name="slug" defaultValue={editing?.slug ?? ""} placeholder="brand-slug" /></div>
                <BrandLogoField currentImageUrl={editing?.logoUrl} />
                <div><Label htmlFor="sortOrder">Sort order</Label><Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? brands.length} /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={editing?.enabled ?? true} /> Enabled on homepage</label>
                <Button type="submit" className="w-full">Save brand</Button>
                {editing ? <a href="/admin/brands" className="block text-center text-sm text-[var(--brand-primary)]">Cancel edit</a> : null}
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Existing brands</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {brands.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No brands yet.</p>
              ) : (
                brands.map((brand) => (
                  <div key={brand.id} className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-4">
                    {brand.logoUrl ? <img src={brand.logoUrl} alt={`${brand.name} logo`} className="h-16 w-16 shrink-0 object-contain" /> : <div className="h-16 w-16 shrink-0 bg-[var(--brand-surface-alt)]" aria-hidden="true" />}
                    <div className="min-w-0 flex-1"><p className="font-medium text-[var(--foreground)]">{brand.name || brand.slug}</p><p className="text-xs text-[var(--text-muted)]">Order {brand.sortOrder} · {brand.enabled ? "Enabled" : "Disabled"}</p></div>
                    <a href={`/admin/brands?edit=${brand.id}`} className="text-sm text-[var(--brand-primary)]">Edit</a>
                    <form action={deleteBrandAction}><input type="hidden" name="brandId" value={brand.id} /><button type="submit" className="text-sm text-red-600">Delete</button></form>
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
