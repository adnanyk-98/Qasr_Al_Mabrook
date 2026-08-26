import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/layout";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics/tracked-link";

export async function Footer({ locale = "en" }: { locale?: Locale }) {
  const common = await getTranslations({ locale, namespace: "common" });
  const header = await getTranslations({ locale, namespace: "header" });
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-header-background)] backdrop-blur-sm">
      <Container className="grid gap-8 py-12 md:grid-cols-[1fr_0.8fr_1.15fr]">
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
              <TrackedLink event="phone_click" params={{ locale, source: "footer" }} href={`tel:${siteConfig.contact.phone}`} className="hover:text-[var(--brand-primary)]">{siteConfig.contact.phone}</TrackedLink>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
