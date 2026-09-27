"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import {
  deleteCategoryTranslation,
  deleteProductTranslation,
  saveCategoryTranslation,
  saveProductTranslation,
} from "./actions";

type ParentOption = { id: string; slug: string };
type ProductTranslation = {
  id: string;
  productId: string;
  locale: "en" | "ar";
  name: string;
  shortDescription: string | null;
  description: string | null;
};
type CategoryTranslation = {
  id: string;
  categoryId: string;
  locale: "en" | "ar";
  name: string;
  shortDescription: string | null;
  description: string | null;
};
type Feedback = { kind: "success" | "error"; message: string } | null;
type DeleteTarget = { kind: "product" | "category"; id: string; label: string } | null;

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p aria-live="polite" className={`text-sm ${feedback.kind === "success" ? "text-green-700" : "text-red-700"}`}>
      {feedback.message}
    </p>
  );
}

export function TranslationManager({
  products,
  categories,
  defaultLocale,
  productTranslations,
  categoryTranslations,
}: {
  products: ParentOption[];
  categories: ParentOption[];
  defaultLocale: "en" | "ar";
  productTranslations: ProductTranslation[];
  categoryTranslations: CategoryTranslation[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [productEdit, setProductEdit] = useState<ProductTranslation | null>(null);
  const [categoryEdit, setCategoryEdit] = useState<CategoryTranslation | null>(null);
  const [productFeedback, setProductFeedback] = useState<Feedback>(null);
  const [categoryFeedback, setCategoryFeedback] = useState<Feedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setProductFeedback(null);
    startTransition(async () => {
      const result = await saveProductTranslation({
        translationId: productEdit?.id,
        productId: String(values.get("productId") ?? ""),
        locale: String(values.get("locale") ?? ""),
        name: String(values.get("name") ?? ""),
        shortDescription: String(values.get("shortDescription") ?? ""),
        description: String(values.get("description") ?? ""),
      });
      setProductFeedback({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        setProductEdit(null);
        form.reset();
        router.refresh();
      }
    });
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setCategoryFeedback(null);
    startTransition(async () => {
      const result = await saveCategoryTranslation({
        translationId: categoryEdit?.id,
        categoryId: String(values.get("categoryId") ?? ""),
        locale: String(values.get("locale") ?? ""),
        name: String(values.get("name") ?? ""),
        shortDescription: String(values.get("shortDescription") ?? ""),
        description: String(values.get("description") ?? ""),
      });
      setCategoryFeedback({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        setCategoryEdit(null);
        form.reset();
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = target.kind === "product"
        ? await deleteProductTranslation({ translationId: target.id })
        : await deleteCategoryTranslation({ translationId: target.id });
      const setFeedback = target.kind === "product" ? setProductFeedback : setCategoryFeedback;
      setFeedback({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        if (target.kind === "product" && productEdit?.id === target.id) setProductEdit(null);
        if (target.kind === "category" && categoryEdit?.id === target.id) setCategoryEdit(null);
        router.refresh();
      }
      setDeleteTarget(null);
    });
  }

  const productName = (id: string) => products.find((product) => product.id === id)?.slug ?? "Unknown product";
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.slug ?? "Unknown category";

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{productEdit ? "Edit product translation" : "Product translation"}</h2>
          </CardHeader>
          <CardBody>
            <form key={productEdit?.id ?? "product-create"} onSubmit={submitProduct} className="space-y-4">
              <div>
                <Label htmlFor="product-translation-product">Product</Label>
                <Select id="product-translation-product" name="productId" required defaultValue={productEdit?.productId ?? ""} disabled={Boolean(productEdit)}>
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.slug}</option>)}
                </Select>
                {productEdit ? <input type="hidden" name="productId" value={productEdit.productId} /> : null}
              </div>
              <div>
                <Label htmlFor="product-translation-locale">Locale</Label>
                <Select id="product-translation-locale" name="locale" defaultValue={productEdit?.locale ?? (defaultLocale === "en" ? "ar" : "en")} disabled={Boolean(productEdit)}>
                  {(["en", "ar"] as const).filter((locale) => locale !== defaultLocale || productEdit?.locale === locale).map((locale) => <option key={locale} value={locale}>{locale}</option>)}
                </Select>
                {productEdit ? <input type="hidden" name="locale" value={productEdit.locale} /> : null}
              </div>
              <div>
                <Label htmlFor="product-translation-name">Name</Label>
                <Input id="product-translation-name" name="name" placeholder="Product name" required defaultValue={productEdit?.name ?? ""} />
              </div>
              <div>
                <Label htmlFor="product-translation-short-description">Short description</Label>
                <Input id="product-translation-short-description" name="shortDescription" placeholder="Short text" defaultValue={productEdit?.shortDescription ?? ""} />
              </div>
              <div>
                <Label htmlFor="product-translation-description">Description</Label>
                <Textarea id="product-translation-description" name="description" placeholder="Long description" rows={4} defaultValue={productEdit?.description ?? ""} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={pending}>{pending ? "Saving…" : productEdit ? "Save" : "Save product translation"}</Button>
                {productEdit ? <Button type="button" variant="outline" disabled={pending} onClick={() => { setProductEdit(null); setProductFeedback(null); }}>Cancel</Button> : null}
              </div>
              <FeedbackMessage feedback={productFeedback} />
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{categoryEdit ? "Edit category translation" : "Category translation"}</h2>
          </CardHeader>
          <CardBody>
            <form key={categoryEdit?.id ?? "category-create"} onSubmit={submitCategory} className="space-y-4">
              <div>
                <Label htmlFor="category-translation-category">Category</Label>
                <Select id="category-translation-category" name="categoryId" required defaultValue={categoryEdit?.categoryId ?? ""} disabled={Boolean(categoryEdit)}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.slug}</option>)}
                </Select>
                {categoryEdit ? <input type="hidden" name="categoryId" value={categoryEdit.categoryId} /> : null}
              </div>
              <div>
                <Label htmlFor="category-translation-locale">Locale</Label>
                <Select id="category-translation-locale" name="locale" defaultValue={categoryEdit?.locale ?? "en"} disabled={Boolean(categoryEdit)}>
                  <option value="en">en</option>
                  <option value="ar">ar</option>
                </Select>
                {categoryEdit ? <input type="hidden" name="locale" value={categoryEdit.locale} /> : null}
              </div>
              <div>
                <Label htmlFor="category-translation-name">Name</Label>
                <Input id="category-translation-name" name="name" placeholder="Category name" required defaultValue={categoryEdit?.name ?? ""} />
              </div>
              <div>
                <Label htmlFor="category-translation-short-description">Short description</Label>
                <Input id="category-translation-short-description" name="shortDescription" placeholder="Short description" defaultValue={categoryEdit?.shortDescription ?? ""} />
              </div>
              <div>
                <Label htmlFor="category-translation-description">Description</Label>
                <Textarea id="category-translation-description" name="description" placeholder="Category description" rows={4} defaultValue={categoryEdit?.description ?? ""} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={pending}>{pending ? "Saving…" : categoryEdit ? "Save" : "Save category translation"}</Button>
                {categoryEdit ? <Button type="button" variant="outline" disabled={pending} onClick={() => { setCategoryEdit(null); setCategoryFeedback(null); }}>Cancel</Button> : null}
              </div>
              <FeedbackMessage feedback={categoryFeedback} />
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-xl font-semibold text-[var(--foreground)]">Product translations</h2></CardHeader>
          <CardBody className="space-y-3">
            {productTranslations.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No product translations yet.</p> : productTranslations.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)]">{entry.name}</p>
                  <p className="text-xs uppercase text-[var(--text-muted)]">{productName(entry.productId)} · {entry.locale}</p>
                  {entry.shortDescription ? <p className="mt-2 text-sm text-[var(--text-muted)]">{entry.shortDescription}</p> : null}
                  {entry.description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{entry.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  {entry.locale === defaultLocale ? (
                    <Link href={`/admin/products?edit=${entry.productId}`} className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--brand-border)] px-3 text-sm text-[var(--foreground)]">Manage in Products</Link>
                  ) : (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setProductEdit(entry); setProductFeedback(null); }}>Edit</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget({ kind: "product", id: entry.id, label: `${productName(entry.productId)} (${entry.locale})` })}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            <FeedbackMessage feedback={productFeedback} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-xl font-semibold text-[var(--foreground)]">Category translations</h2></CardHeader>
          <CardBody className="space-y-3">
            {categoryTranslations.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No category translations yet.</p> : categoryTranslations.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] p-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)]">{entry.name}</p>
                  <p className="text-xs uppercase text-[var(--text-muted)]">{categoryName(entry.categoryId)} · {entry.locale}</p>
                  {entry.shortDescription ? <p className="mt-2 text-sm text-[var(--text-muted)]">{entry.shortDescription}</p> : null}
                  {entry.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{entry.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setCategoryEdit(entry); setCategoryFeedback(null); }}>Edit</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget({ kind: "category", id: entry.id, label: `${categoryName(entry.categoryId)} (${entry.locale})` })}>Delete</Button>
                </div>
              </div>
            ))}
            <FeedbackMessage feedback={categoryFeedback} />
          </CardBody>
        </Card>
      </div>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete ${deleteTarget.label}?` : undefined}
        message="Only this translation will be deleted. The product or category will remain."
        confirmLabel="Delete translation"
        loading={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}