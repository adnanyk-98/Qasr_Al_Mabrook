import Image from "next/image";

import { getTranslations } from "next-intl/server";
import { type Locale } from "@/lib/locales";

export async function HomeIntroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section aria-labelledby="homepage-intro-title" className="border-b border-[var(--brand-border)] bg-[var(--brand-surface-alt)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(120px,0.55fr)_minmax(0,2fr)_minmax(150px,0.8fr)] lg:gap-8">
          <div className="flex justify-center lg:justify-start">
            <Image src="/brand/logo-color.svg" alt={t("introLogoAlt")} width={404} height={362} className="h-auto w-28 sm:w-36 lg:w-40" />
          </div>

          <div className="text-center lg:text-start">
            <h1 id="homepage-intro-title" className="mx-auto max-w-2xl text-2xl font-semibold leading-tight text-[var(--foreground)] sm:text-3xl">
              {t("introTitle")}
            </h1>
            <div className="mx-auto mt-5 flex items-center justify-center gap-3 lg:mx-0 lg:justify-start" aria-hidden="true">
              <span className="h-px w-16 bg-[var(--brand-primary)]/40 sm:w-24" />
              <span className="text-sm text-[var(--brand-primary)]">◆</span>
              <span className="h-px w-16 bg-[var(--brand-primary)]/40 sm:w-24" />
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-base sm:leading-7">{t("introDescription")}</p>
          </div>

          <div className="relative mx-auto hidden h-28 w-full max-w-[230px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white/60 opacity-75 sm:block lg:h-36 lg:max-w-[260px]">
            <Image src="/store-locator/In-Store-Images-01.jpg" alt={t("introStoreAlt")} fill sizes="(max-width: 1024px) 230px, 260px" className="object-cover object-center grayscale" />
            <div className="absolute inset-0 bg-[var(--brand-surface-alt)]/45" aria-hidden="true" />
          </div>
        </div>

      </div>
    </section>
  );
}
