import Image from "next/image";
import Link from "next/link";

import { DealProductSelector } from "@/components/admin/deal-product-selector";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import {
  getHomepageDealById,
  listHomepageDeals,
  listProductsForDealSelector,
} from "@/server/repositories/catalog-admin";
import { deactivateHomepageDealAction, upsertHomepageDealAction } from "./actions";
import { requireAdminSession } from "@/server/services/admin-auth";

type PageProps = {
  searchParams: Promise<{ edit?: string; error?: string; productSearch?: string; saved?: string }>;
};

export default async function DealsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const deals = await listHomepageDeals();
  const productSearch = typeof params.productSearch === "string" ? params.productSearch : "";
  const products = await listProductsForDealSelector(productSearch);
  const editingDeal = params.edit ? await getHomepageDealById(params.edit) : null;
  const selectorProducts = editingDeal && !products.some((product) => product.id === editingDeal.productId)
    ? [editingDeal.product, ...products]
    : products;
  const formError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Homepage Deals</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Manage up to three active product deals shown on the homepage.</p>
          </div>
          <AdminBackButton />
        </div>

        {formError ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{formError}</p> : null}
        {params.saved ? <p className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">Deal saved.</p> : null}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader><h2 className="text-xl font-semibold text-[var(--foreground)]">{editingDeal ? "Edit deal" : "Add deal"}</h2></CardHeader>
            <CardBody>
              <form action={upsertHomepageDealAction} className="space-y-4">
                {editingDeal ? <input type="hidden" name="dealId" value={editingDeal.id} /> : null}
                <DealProductSelector products={selectorProducts} selectedId={editingDeal?.productId} />
                <div>
                  <label htmlFor="discountPercent" className="mb-2 block text-sm font-medium text-[var(--foreground)]">Discount percentage</label>
                  <Input id="discountPercent" name="discountPercent" type="number" min="1" max="100" step="1" defaultValue={editingDeal?.discountPercent ?? 15} required />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Displayed automatically as “Up to X% off”.</p>
                </div>
                <div>
                  <label htmlFor="position" className="mb-2 block text-sm font-medium text-[var(--foreground)]">Position</label>
                  <Input id="position" name="position" type="number" min="1" max="3" step="1" defaultValue={(editingDeal?.sortOrder ?? deals.length) + 1} required />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]"><input type="checkbox" name="isActive" defaultChecked={editingDeal?.isActive ?? true} /> Active on homepage</label>
                <Button type="submit" className="w-full">Save deal</Button>
                {editingDeal ? <Link href="/admin/deals" className="block text-center text-sm text-[var(--brand-primary)]">Cancel edit</Link> : null}
              </form>

              <div className="mt-6 border-t border-[var(--brand-border)] pt-5">
                <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Find a product</p>
                <form method="get" action="/admin/deals" className="flex gap-2">
                  <Input name="productSearch" defaultValue={productSearch} placeholder="Search products..." />
                  <Button type="submit" variant="secondary">Search</Button>
                </form>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Search uses existing published product names, slugs, and SKUs.</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-xl font-semibold text-[var(--foreground)]">Current deals</h2></CardHeader>
            <CardBody className="space-y-3">
              {deals.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No homepage deals yet.</p> : deals.map((deal) => (
                <div key={deal.id} className="flex flex-wrap items-center gap-4 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-[var(--brand-border)] bg-[var(--brand-surface-alt)]">
                    {deal.product.primaryImageUrl ? <Image src={deal.product.primaryImageUrl} alt={deal.product.name} fill sizes="80px" className="object-contain" unoptimized /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)]">{deal.product.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Up to {deal.discountPercent}% off · Position {deal.sortOrder + 1}</p>
                    <p className="text-xs text-[var(--text-muted)]">{deal.isActive ? "Active" : "Inactive"} · /products/{deal.product.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/deals?edit=${deal.id}${productSearch ? `&productSearch=${encodeURIComponent(productSearch)}` : ""}`} className="text-sm text-[var(--brand-primary)]">Edit</Link>
                    {deal.isActive ? <form action={deactivateHomepageDealAction}><input type="hidden" name="dealId" value={deal.id} /><button type="submit" className="text-sm text-red-600">Deactivate</button></form> : null}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
