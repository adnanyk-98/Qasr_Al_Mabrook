import { Button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics/tracked-link";

export async function SalesActions({ locale, phone, email, whatsapp, productName, productSlug, variantId }: { locale: Locale; phone?: string; email?: string; whatsapp?: string; productName?: string; productSlug?: string; variantId?: string }) {
  const t = await getTranslations({ locale, namespace: "sales" });
  const subject = productName ? `Enquiry about ${productName}` : "Sales enquiry";
  const cleanWhatsapp = whatsapp?.replace(/[^\d]/g, "");

  return (
    <div className="flex flex-wrap gap-3">
      <TrackedLink event="product_request_quote" params={{ product_name: productName, product_slug: productSlug, locale, source: "product-detail" }} href={localePath(locale, productSlug ? `/request-quote?source=PRODUCT&product=${encodeURIComponent(productSlug)}${variantId ? `&variant=${encodeURIComponent(variantId)}` : ""}` : "/request-quote?source=CONTACT")}>
        <Button variant="primary" size="lg">{locale === "ar" ? "طلب عرض سعر" : "Request Quote"}</Button>
      </TrackedLink>
      {cleanWhatsapp ? <TrackedLink event="whatsapp_click" params={{ product_name: productName, product_slug: productSlug, locale, source: "product-detail" }} href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] px-4 text-sm font-medium text-[var(--brand-primary)]">{t("whatsapp")}</TrackedLink> : null}
      {phone ? <TrackedLink event="phone_click" params={{ product_name: productName, product_slug: productSlug, locale, source: "product-detail" }} href={`tel:${phone}`} className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-4 text-sm font-medium text-[var(--foreground)]">{t("call")}</TrackedLink> : null}
      {email ? <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`} className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-4 text-sm font-medium text-[var(--foreground)]">{t("email")}</a> : null}
    </div>
  );
}
