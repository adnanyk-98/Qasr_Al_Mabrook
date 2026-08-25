import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/layout";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";

export async function Footer({ locale = "en" }: { locale?: Locale }) {
  const common = await getTranslations({ locale, namespace: "common" });
  const header = await getTranslations({ locale, namespace: "header" });
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-header-background)] backdrop-blur-sm">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-3">
            <Image
              src={siteConfig.brand.logoColorSvg}
              alt={header("logoAlt")}
              width={404}
              height={362}
              className="h-auto w-16 sm:w-20 md:w-24"
            />
            <div className="text-lg font-semibold text-[var(--foreground)]">{siteConfig.name}</div>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-muted)]">{t("description")}</p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            {t("explore")}
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li><Link href={localePath(locale, "/")} className="hover:text-[var(--brand-primary)]">{common("home")}</Link></li>
            <li><Link href={localePath(locale, "/products")} className="hover:text-[var(--brand-primary)]">{common("products")}</Link></li>
            <li><Link href={localePath(locale, "/store-locator")} className="hover:text-[var(--brand-primary)]">{common("storeLocator")}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            {t("contact")}
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li>
              <span className="block font-medium text-[var(--foreground)]">{t("address")}</span>
              <span className="block max-w-xs leading-6">{siteConfig.contact.address}</span>
            </li>
            <li>
              <span className="block font-medium text-[var(--foreground)]">{t("phone")}</span>
              <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-[var(--brand-primary)]">{siteConfig.contact.phone}</a>
            </li>
            <li>
              <a href={siteConfig.contact.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={t("mapsAriaLabel")} className="inline-flex items-center gap-2 hover:text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                  <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                {t("viewOnMaps")}
              </a>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
