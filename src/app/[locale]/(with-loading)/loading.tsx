import { headers } from "next/headers";

import { PublicLoadingShell } from "@/components/public/public-loading-shell";
import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";
import { getTranslations } from "next-intl/server";

export default async function LocaleLoading() {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-qam-locale") === "ar" ? "ar" : "en";
  const t = await getTranslations({ locale, namespace: "loading" });

  return (
    <div className="min-h-screen bg-[var(--brand-surface)] text-[var(--foreground)]">
      <Header locale={locale} path="/" />
      <PublicLoadingShell locale={locale} pageLabel={t("page")} takingLongerLabel={t("takingLonger")} retryLabel={t("retry")} />
      <Footer locale={locale} />
    </div>
  );
}
