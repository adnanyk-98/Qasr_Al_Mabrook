import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/layout";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";

export async function Footer({ locale = "en" }: { locale?: Locale }) {
  const common = await getTranslations({ locale, namespace: "common" });
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-surface)]">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <div className="text-lg font-semibold text-[var(--foreground)]">{siteConfig.name}</div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-muted)]">{t("description")}</p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            {t("explore")}
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li><Link href={localePath(locale, "/")} className="hover:text-[var(--brand-primary)]">{common("home")}</Link></li>
            <li><Link href={localePath(locale, "/products")} className="hover:text-[var(--brand-primary)]">{common("catalogue")}</Link></li>
            <li><Link href={localePath(locale, "/categories")} className="hover:text-[var(--brand-primary)]">{common("categories")}</Link></li>
            <li><Link href={localePath(locale, "/contact-us")} className="hover:text-[var(--brand-primary)]">{common("contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            {t("contact")}
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li>{t("salesEnquiries")}</li>
            <li>{t("languageSupport")}</li>
            <li>{t("responsiveDiscovery")}</li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
