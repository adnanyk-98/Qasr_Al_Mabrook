import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listCategoriesPaginated, getCategoryById } from "@/server/repositories/catalog-admin";
import ClientCategoryList from "@/components/admin/category-list";
import ClientAdminPagination from "@/components/admin/admin-pagination";
import AdminPageSizeSelect from "@/components/admin/admin-page-size-select";
import { CategoryImageField } from "@/components/admin/category-image-field";
import { upsertCategoryAction } from "./actions";
import { requireAdminSession } from "@/server/services/admin-auth";

type PageProps = {
  searchParams: Promise<{ edit?: string; page?: string; pageSize?: string; search?: string }>;
};

export default async function CategoriesPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const pageNum = params.page ? Number(params.page) || 1 : 1;
  const pageSize = [10, 20, 30, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const searchQ = typeof params.search === "string" ? params.search : "";
  const categoriesPaginated = await listCategoriesPaginated({ page: pageNum, pageSize, search: searchQ });
  const categories = categoriesPaginated.items;

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
                {editingCategory ? <input type="hidden" name="categoryId" value={editingCategory.id} /> : null}
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
                <CategoryImageField currentImageUrl={editingCategory?.imagePublicUrl ?? null} />
                <Button type="submit" className="w-full">Save category</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Existing categories</h2>
            </CardHeader>
            <CardBody className="space-y-3 min-w-0 max-w-full break-words">
              {categories.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No categories found.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                    <form method="get" action="/admin/categories" className="flex gap-2 min-w-0 flex-1">
                      <input name="search" defaultValue={searchQ} placeholder="Search categories..." className="rounded border px-3 py-2 text-sm flex-1 min-w-0" />
                      <button type="submit" className="rounded bg-[var(--brand-primary)] text-white px-3 py-2 text-sm">Search</button>
                    </form>
                    <div className="flex-shrink-0">
                      <AdminPageSizeSelect value={categoriesPaginated.pageSize} />
                    </div>
                  </div>

                  <ClientCategoryList initialItems={categories} total={categoriesPaginated.total} page={categoriesPaginated.page} pageSize={categoriesPaginated.pageSize} basePath="/admin/categories" search={searchQ} />

                  <div className="mt-4">
                    <ClientAdminPagination total={categoriesPaginated.total} page={categoriesPaginated.page} pageSize={categoriesPaginated.pageSize} basePath="/admin/categories" search={searchQ} />
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
