import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { getHomepageSectionById, listHomepageSections } from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { setHomepageSectionStatusAction, upsertHomepageSectionAction } from "@/server/services/admin-catalog";

type PageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function HomepagePage({ searchParams }: PageProps) {
  await requireAdminSession();
  const homepageSections = await listHomepageSections();
  const params = await searchParams;
  const editingSection = params.edit ? await getHomepageSectionById(params.edit) : null;
  const config = (editingSection?.configurationJson ?? {}) as Record<string, string | boolean | undefined>;

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
              <form action={upsertHomepageSectionAction} className="space-y-4">
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

                <div>
                  <Label htmlFor="imageUrl">Hero image URL</Label>
                  <Input id="imageUrl" name="imageUrl" placeholder="https://..." defaultValue={String(config.imageUrl ?? "")} />
                </div>

                <div>
                  <Label htmlFor="imageFile">Or upload hero image</Label>
                  <input id="imageFile" name="imageFile" type="file" accept="image/*" className="block w-full text-sm" />
                </div>

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
            <CardBody className="space-y-3">
              {homepageSections.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No homepage sections yet.</p>
              ) : (
                homepageSections.map((section) => (
                  <div key={section.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{section.sectionType}</p>
                        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">Sort: {section.sortOrder}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]">
                          {section.status}
                        </span>
                        <Link href={`/admin/homepage?edit=${section.id}`} className="text-sm text-[var(--brand-primary)]">
                          Edit
                        </Link>
                      </div>
                    </div>

                    <form action={setHomepageSectionStatusAction} className="mt-3 flex items-center gap-2">
                      <input type="hidden" name="sectionId" value={section.id} />
                      <Select name="status" defaultValue={section.status} className="max-w-[180px]">
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </Select>
                      <Button type="submit" variant="secondary" size="sm">
                        Update
                      </Button>
                    </form>
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
