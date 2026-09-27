import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { localePath, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics/tracked-link";

export async function Header({ locale = "en", path = "/", showLocaleSwitcher = true }: { locale?: Locale; path?: string; showLocaleSwitcher?: boolean }) {
  const t = await getTranslations({ locale, namespace: "common" });
  const header = await getTranslations({ locale, namespace: "header" });
  const navItems = [
    { label: t("home"), href: localePath(locale, "/") },
    { label: t("products"), href: localePath(locale, "/products") },
    { label: t("storeLocator"), href: localePath(locale, "/store-locator") },
  ];

  return (
    <header className="relative z-40 border-b border-[var(--brand-border)] bg-[var(--brand-header-background)] backdrop-blur-sm">
      <Container className="flex items-center justify-between gap-4 py-3 sm:py-4">
        <Link href={localePath(locale, "/")} className="flex shrink-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">
          <Image
            src={siteConfig.brand.logoColorSvg}
            alt={header("logoAlt")}
            width={404}
            height={362}
            priority
            className="h-auto w-[96px] sm:w-[144px]"
          />
        </Link>

        <nav aria-label={header("mainNavigation")} className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-medium text-[var(--foreground)] transition-colors hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {showLocaleSwitcher ? <LocaleSwitcher locale={locale} path={path} /> : null}
          <TrackedLink event="product_request_quote" params={{ locale, source: "header" }} href={localePath(locale, "/request-quote")} className="hidden sm:inline-flex">
            <Button variant="primary" size="sm">{t("requestQuote")}</Button>
          </TrackedLink>
          <details className="md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--brand-border)] text-base text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" aria-label={header("openMenu")}>
              <span aria-hidden="true">&#9776;</span>
            </summary>
            <nav aria-label={header("mainNavigation")} className="absolute left-0 right-0 top-full z-50 min-w-52 space-y-1 rounded-b-[var(--radius-md)] border-t border-[var(--brand-border)] bg-white p-2 shadow-[var(--shadow-md)]">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium hover:bg-[var(--brand-surface-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
