import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { listSpecificationDefinitions, listSpecificationTranslations } from "@/server/repositories/catalog-admin";
import { upsertSpecificationAction, upsertSpecificationTranslationAction } from "@/server/services/admin-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";

export default async function SpecificationsPage() {
  await requireAdminSession();
  const definitions = await listSpecificationDefinitions();
  const translations = await listSpecificationTranslations();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Specifications</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Create specification definition</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertSpecificationAction} className="space-y-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="material" required />
                </div>
                <div>
                  <Label htmlFor="dataType">Data type</Label>
                  <Select id="dataType" name="dataType" defaultValue="TEXT">
                    <option value="TEXT">TEXT</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </Select>
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
                <Button type="submit" className="w-full">Save specification</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Add translation</h2>
            </CardHeader>
            <CardBody>
              <form action={upsertSpecificationTranslationAction} className="space-y-4">
                <div>
                  <Label htmlFor="specificationDefinitionId">Specification</Label>
                  <Select id="specificationDefinitionId" name="specificationDefinitionId" defaultValue="">
                    <option value="">Select specification</option>
                    {definitions.map((definition) => (
                      <option key={definition.id} value={definition.id}>{definition.code}</option>
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
                  <Input id="name" name="name" placeholder="Material" required />
                </div>
                <Button type="submit" className="w-full">Save translation</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Specification definitions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {definitions.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No specification definitions yet.</p>
            ) : (
              definitions.map((definition) => (
                <div key={definition.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                  <p className="font-medium text-[var(--foreground)]">{definition.code}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{definition.dataType}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Translations</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {translations.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No translations yet.</p>
            ) : (
              translations.map((translation) => (
                <div key={translation.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                  <p className="font-medium text-[var(--foreground)]">{translation.name}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{translation.locale}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
