import { Button } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { siteConfig } from "@/config/site";
import { buildTelephoneHref } from "@/lib/phone-display";

export async function SalesActions({ locale, email, whatsapp, productName, productSlug, variantId }: { locale: Locale; email?: string; whatsapp?: string; productName?: string; productSlug?: string; variantId?: string }) {
  const t = await getTranslations({ locale, namespace: "sales" });
  const subject = productName ? `Enquiry about ${productName}` : "Sales enquiry";
  const cleanWhatsapp = whatsapp?.replace(/[^\d]/g, "");
  const bulkOrderPhoneHref = buildTelephoneHref(siteConfig.contact.phone);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <TrackedLink
        event="map_click"
        params={{
          product_name: productName,
          product_slug: productSlug,
          locale,
          source: "product-detail",
        }}
        href={siteConfig.contact.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-5 py-2 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--brand-primary-dark)] active:bg-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:w-auto"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
          <path
            d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {t("getItNow")}
      </TrackedLink>
      {bulkOrderPhoneHref ? (
        <TrackedLink
          event="phone_click"
          params={{
            product_name: productName,
            product_slug: productSlug,
            locale,
            source: "product-detail-bulk-orders",
          }}
          href={bulkOrderPhoneHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] px-5 py-2 text-base font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-light)]/90 active:bg-[var(--brand-primary-light)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
            <path
              d="M6.6 3.8 9 3.2l2 4.8-2.1 1.5a15.1 15.1 0 0 0 5.6 5.6L16 13l4.8 2-.6 2.4a3 3 0 0 1-3.3 2.2A17.8 17.8 0 0 1 4.4 7.1a3 3 0 0 1 2.2-3.3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("bulkOrdersCallUs")}
        </TrackedLink>
      ) : null}
      <TrackedLink event="product_request_quote" params={{ product_name: productName, product_slug: productSlug, locale, source: "product-detail" }} href={localePath(locale, productSlug ? `/request-quote?source=PRODUCT&product=${encodeURIComponent(productSlug)}${variantId ? `&variant=${encodeURIComponent(variantId)}` : ""}` : "/request-quote?source=CONTACT")}>
        <Button variant="outline" size="lg">{locale === "ar" ? "طلب عرض سعر" : "Request Quote"}</Button>
      </TrackedLink>
      {cleanWhatsapp ? (
        <TrackedLink event="whatsapp_click" params={{ product_name: productName, product_slug: productSlug, locale, source: "product-detail" }} href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] px-4 text-sm font-medium text-[var(--brand-primary)]">{t("whatsapp")}</TrackedLink>
      ) : null}
      {email ? (
        <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`} className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-4 text-sm font-medium text-[var(--foreground)]">{t("email")}</a>
      ) : null}
    </div>
  );
}
