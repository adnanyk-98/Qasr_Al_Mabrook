import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/layout";
import { localePath, type Locale } from "@/lib/locales";
import { buildTelephoneHref, formatPublicPhoneNumber } from "@/lib/phone-display";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics/tracked-link";

export async function Footer({ locale = "en" }: { locale?: Locale }) {
  const common = await getTranslations({ locale, namespace: "common" });
  const header = await getTranslations({ locale, namespace: "header" });
  const t = await getTranslations({ locale, namespace: "footer" });
  const phoneHref = buildTelephoneHref(siteConfig.contact.phone);
  const displayedPhoneNumber = formatPublicPhoneNumber(siteConfig.contact.phone);

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
            <li><Link href={localePath(locale, "/blog")} className="hover:text-[var(--brand-primary)]">{common("blog")}</Link></li>
            <li><Link href={localePath(locale, "/about-us")} className="hover:text-[var(--brand-primary)]">{common("aboutUs")}</Link></li>
            <li><Link href={localePath(locale, "/contact-us")} className="hover:text-[var(--brand-primary)]">{common("contact")}</Link></li>
            <li><Link href={localePath(locale, "/sitemap")} className="hover:text-[var(--brand-primary)]">{common("htmlSitemap")}</Link></li>
            <li><Link href={localePath(locale, "/store-locator")} className="hover:text-[var(--brand-primary)]">{common("storeLocator")}</Link></li>
          </ul>
          <div className="mt-5 border-t border-[var(--brand-border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{common("browseCategories")}</h3>
            <Link href={localePath(locale, "/categories")} className="mt-2 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
              {common("categories")}
            </Link>
          </div>
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
              {phoneHref ? (
                <TrackedLink event="phone_click" params={{ locale, source: "footer" }} href={phoneHref} dir="ltr" className="hover:text-[var(--brand-primary)]">
                  <bdi dir="ltr">{displayedPhoneNumber}</bdi>
                </TrackedLink>
              ) : <bdi dir="ltr">{displayedPhoneNumber}</bdi>}
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
