import type { Locale } from "@/lib/locales";

export function resolvePageDirection(locale: string | null | undefined): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function readLocalizedConfigString(configuration: unknown, key: string, locale: Locale) {
  if (!configuration || typeof configuration !== "object") return undefined;

  const value = (configuration as Record<string, unknown>)[key];

  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const localizedValue = (value as Record<string, unknown>)[locale] ?? (value as Record<string, unknown>).en;
    if (typeof localizedValue === "string" && localizedValue.trim()) return localizedValue;
  }

  return undefined;
}

export function buildLoopedCategorySequence<T>(items: T[]): T[] {
  if (!items.length) return [];
  return [...items, ...items];
}
