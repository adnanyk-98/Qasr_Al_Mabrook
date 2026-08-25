"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

import { resolvePageDirection } from "@/lib/homepage-content";
import { locales, type Locale } from "@/lib/locales";

export function DocumentLocaleSync() {
  const pathname = usePathname();
  const routeLocale = pathname.split("/")[1] as Locale;
  const locale = locales.includes(routeLocale) ? routeLocale : "en";

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = resolvePageDirection(locale);
  }, [locale]);

  return null;
}
