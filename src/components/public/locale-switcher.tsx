import { getAlternateLocale, localePath, type Locale } from "@/lib/locales";
import { TrackedLink } from "@/components/analytics/tracked-link";

export async function LocaleSwitcher({ locale, path }: { locale: Locale; path: string }) {
  const alternate = getAlternateLocale(locale);

  // Render a single control that displays the OTHER locale and navigates there,
  // preserving the current path (including query string) via localePath.
  return (
    <div className="inline-flex items-center">
      <TrackedLink
        event="language_switch"
        params={{ from_locale: locale, to_locale: alternate }}
        href={localePath(alternate, path)}
        aria-label={alternate.toUpperCase()}
        data-testid="locale-switcher"
        className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--brand-surface-alt)]"
      >
        {alternate.toUpperCase()}
      </TrackedLink>
    </div>
  );
}
