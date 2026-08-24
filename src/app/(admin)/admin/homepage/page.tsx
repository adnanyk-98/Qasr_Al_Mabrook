import Link from "next/link";

import { HeroImageField } from "@/components/admin/hero-image-field";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { getHomepageSectionById, listHomepageSectionsPaginated } from "@/server/repositories/catalog-admin";
import ClientHomepageList from "@/components/admin/homepage-list";
import ClientAdminPagination from "@/components/admin/admin-pagination";
import AdminPageSizeSelect from "@/components/admin/admin-page-size-select";
import { requireAdminSession } from "@/server/services/admin-auth";
import { setHomepageSectionStatusAction } from "@/server/services/admin-catalog";

type PageProps = {
  searchParams: Promise<{ edit?: string; error?: string; page?: string; pageSize?: string; search?: string }>;
};

export default async function HomepagePage({ searchParams }: PageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const pageNum = params.page ? Number(params.page) || 1 : 1;
  const pageSize = [10, 20, 30, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const searchQ = typeof params.search === "string" ? params.search : "";
  const homepageSectionsPaginated = await listHomepageSectionsPaginated({ page: pageNum, pageSize, search: searchQ });
  const homepageSections = homepageSectionsPaginated.items;
  const editingSection = params.edit ? await getHomepageSectionById(params.edit) : null;
  const config = (editingSection?.configurationJson ?? {}) as Record<string, string | boolean | undefined>;
  const currentImageUrl = typeof config.imageUrl === "string" && config.imageUrl.trim() ? config.imageUrl : undefined;
  const formError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Homepage</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {editingSection ? `Edit ${editingSection.sectionType}` : "Add homepage section"}
              </h2>
            </CardHeader>
            <CardBody>
              {formError ? (
                <div className="mb-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <form action="/api/admin/homepage" method="POST" encType="multipart/form-data" className="space-y-4">
                {editingSection ? <input type="hidden" name="sectionId" value={editingSection.id} /> : null}

                <div>
                  <Label htmlFor="sectionType">Section type</Label>
                  <Input
                    id="sectionType"
                    name="sectionType"
                    placeholder="hero"
                    required
                    defaultValue={editingSection?.sectionType ?? "hero"}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue={editingSection?.status ?? "DRAFT"}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Homepage hero" defaultValue={String(config.title ?? "")} />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input id="subtitle" name="subtitle" placeholder="Optional subtitle" defaultValue={String(config.subtitle ?? "")} />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Supporting copy" defaultValue={String(config.description ?? "")} />
                </div>

                <HeroImageField currentImageUrl={currentImageUrl} currentAlt={String(config.imageAlt ?? "Hero banner preview")} />

                <div>
                  <Label htmlFor="imageAlt">Image alt text</Label>
                  <Input id="imageAlt" name="imageAlt" placeholder="Hero banner alt text" defaultValue={String(config.imageAlt ?? "")} />
                </div>

                <div>
                  <Label htmlFor="ctaLabel">CTA label</Label>
                  <Input id="ctaLabel" name="ctaLabel" placeholder="Shop now" defaultValue={String(config.ctaLabel ?? "")} />
                </div>

                <div>
                  <Label htmlFor="ctaHref">CTA link</Label>
                  <Input id="ctaHref" name="ctaHref" placeholder="/en/products" defaultValue={String(config.ctaHref ?? "")} />
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={Number(editingSection?.sortOrder ?? 0)} />
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input type="checkbox" name="enabled" defaultChecked={Boolean(config.enabled)} />
                  Enabled
                </label>

                <Button type="submit" className="w-full">Save section</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Configured sections</h2>
            </CardHeader>
            <CardBody className="space-y-3 min-w-0 max-w-full break-words">
              {homepageSections.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No homepage sections found.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                      <form method="get" action="/admin/homepage" className="flex gap-2 min-w-0 flex-1">
                        <input name="search" defaultValue={searchQ} placeholder="Search sections..." className="rounded border px-3 py-2 text-sm flex-1 min-w-0" />
                      <button type="submit" className="rounded bg-[var(--brand-primary)] text-white px-3 py-2 text-sm">Search</button>
                    </form>
                    <div className="flex-shrink-0">
                      <AdminPageSizeSelect value={homepageSectionsPaginated.pageSize} />
                    </div>
                  </div>

                  {/* Client homepage list */}
                  {/* @ts-ignore */}
                  <ClientHomepageList initialItems={homepageSections} total={homepageSectionsPaginated.total} page={homepageSectionsPaginated.page} pageSize={homepageSectionsPaginated.pageSize} basePath="/admin/homepage" search={searchQ} />

                  <div className="mt-4">
                    {/* @ts-ignore */}
                    <ClientAdminPagination total={homepageSectionsPaginated.total} page={homepageSectionsPaginated.page} pageSize={homepageSectionsPaginated.pageSize} basePath="/admin/homepage" search={searchQ} />
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
