import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { type Locale } from "@/lib/locales";
import { submitQuoteRequestAction } from "@/server/services/enquiries";
import { getTranslations } from "next-intl/server";

export async function EnquiryForm({
  locale,
  source,
  productSlug,
  productName,
  variantId,
  variantSku,
  error,
}: {
  locale: Locale;
  source: "PRODUCT" | "CONTACT";
  productSlug?: string;
  productName?: string;
  variantId?: string;
  variantSku?: string | null;
  error?: string;
}) {
  const t = await getTranslations({ locale, namespace: "enquiry" });

  return (
    <form action={submitQuoteRequestAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="returnPath" value={source === "PRODUCT" ? "/request-quote" : "/contact-us"} />
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <Input id="website" name="website" tabIndex={-1} autoComplete="off" className="sr-only" />
      </div>
      {productSlug ? <input type="hidden" name="productSlug" value={productSlug} /> : null}
      {variantId ? <input type="hidden" name="variantId" value={variantId} /> : null}

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error === "validation" ? t("validationError") : t("submissionError")}
        </div>
      ) : null}

      {productName ? (
        <div className="rounded-[var(--radius-md)] bg-[var(--brand-surface-alt)] p-4 text-sm">
          <p className="font-semibold text-[var(--foreground)]">{productName}</p>
          {variantSku ? <p className="mt-1 text-[var(--text-muted)]">SKU: {variantSku}</p> : null}
        </div>
      ) : null}

      <div>
        <Label htmlFor="customerName">{t("fullName")}</Label>
        <Input id="customerName" name="customerName" required minLength={2} autoComplete="name" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="customerEmail">{t("email")}</Label>
          <Input id="customerEmail" name="customerEmail" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="customerPhone">{t("phone")}</Label>
          <Input id="customerPhone" name="customerPhone" type="tel" required autoComplete="tel" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="companyName">{t("company")}</Label>
          <Input id="companyName" name="companyName" autoComplete="organization" />
        </div>
        <div>
          <Label htmlFor="city">{t("city")}</Label>
          <Input id="city" name="city" autoComplete="address-level2" />
        </div>
      </div>

      <div>
        <Label htmlFor="country">{t("country")}</Label>
        <Input id="country" name="country" autoComplete="country-name" />
      </div>

      <div>
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" name="message" rows={5} maxLength={5000} />
      </div>

      <Button type="submit" size="lg" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
