export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localePath(locale: Locale, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized === "/") {
    return `/${locale}`;
  }

  if (normalized.startsWith(`/${locale}`)) {
    return normalized;
  }

  return `/${locale}${normalized}`;
}

export function getAlternateLocale(currentLocale: Locale) {
  return currentLocale === "en" ? "ar" : "en";
}
