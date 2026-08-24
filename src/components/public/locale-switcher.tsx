import Link from "next/link";

import { getAlternateLocale, localePath, type Locale } from "@/lib/locales";

export async function LocaleSwitcher({ locale, path }: { locale: Locale; path: string }) {
  const alternate = getAlternateLocale(locale);

  // Render a single control that displays the OTHER locale and navigates there,
  // preserving the current path (including query string) via localePath.
  return (
    <div className="inline-flex items-center">
      <Link
        href={localePath(alternate, path)}
        aria-label={alternate.toUpperCase()}
        className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--brand-surface-alt)]"
      >
        {alternate.toUpperCase()}
      </Link>
    </div>
  );
}
