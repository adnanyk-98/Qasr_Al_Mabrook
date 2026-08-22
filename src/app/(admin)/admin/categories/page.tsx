import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listCategories, getCategoryById } from "@/server/repositories/catalog-admin";
import { upsertCategoryAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

type PageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function CategoriesPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const categories = await listCategories();

  const params = await searchParams;
  const editId = params.edit ?? "";
  const editingCategory = editId ? await getCategoryById(editId) : null;

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Categories</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create category</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertCategoryAction} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Seasonal essentials" required defaultValue={editingCategory?.slug ?? ""} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="seasonal-essentials" defaultValue={editingCategory?.slug ?? ""} />
                </div>
                <div>
                  <Label htmlFor="parentId">Parent category</Label>
                  <Input id="parentId" name="parentId" placeholder="Optional parent category id" defaultValue={editingCategory?.parentId ?? ""} />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={editingCategory?.sortOrder ?? 0} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue={editingCategory?.status ?? "DRAFT"}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Save category</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Existing categories</h2>
            </CardHeader>
            <CardBody className="space-y-3">
                {categories.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No categories yet.</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{category.slug}</p>
                        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{category.status}</p>
                      </div>
                      <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
                        #{category.sortOrder}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link href={`/admin/categories?edit=${category.id}`} className="text-sm text-[var(--brand-primary)]">
                        Edit
                      </Link>
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
