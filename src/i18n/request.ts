import { getRequestConfig } from "next-intl/server";

import { isLocale } from "@/lib/locales";

import ar from "./messages/ar.json";
import en from "./messages/en.json";

const messages = { en, ar } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : "en";

  return {
    locale,
    messages: messages[locale],
  };
});
