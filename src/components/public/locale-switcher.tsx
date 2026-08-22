import Link from "next/link";

import { getAlternateLocale, localePath, type Locale } from "@/lib/locales";

export async function LocaleSwitcher({ locale, path }: { locale: Locale; path: string }) {
  const alternate = getAlternateLocale(locale);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-xs font-medium text-[var(--foreground)]">
      <Link href={localePath(locale, path)} className={locale === "en" ? "font-semibold text-[var(--brand-primary)]" : "opacity-70 hover:text-[var(--brand-primary)]"}>
        EN
      </Link>
      <span className="opacity-50">/</span>
      <Link href={localePath(alternate, path)} className={locale === "ar" ? "font-semibold text-[var(--brand-primary)]" : "opacity-70 hover:text-[var(--brand-primary)]"}>
        AR
      </Link>
    </div>
  );
}
