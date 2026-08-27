import Image from "next/image";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";

type Offer = {
  title: string;
  discount: string;
  imageUrl?: string | null;
  imageAlt: string;
  href: string;
  productId?: string;
  productSlug?: string;
};

export async function SpecialOffersSection({ locale, offers }: { locale: Locale; offers: Offer[] }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section aria-labelledby="homepage-special-offers-title" className="bg-[var(--brand-primary)] px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,2.15fr)] lg:items-center lg:gap-12">
        <div className="text-center lg:text-start">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary-light)]">{t("dealsEyebrow")}</p>
          <h2 id="homepage-special-offers-title" className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{t("dealsTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">{t("dealsSubtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {offers.map((offer) => (
            <TrackedLink
              key={offer.title}
              event="featured_product_click"
              params={{ product_id: offer.productId, product_name: offer.title, product_slug: offer.productSlug, locale, source: "special-offers" }}
              href={offer.href}
              className="group grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-center gap-4 rounded-[var(--radius-lg)] border border-white/25 bg-white p-3 text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-primary)] sm:block sm:p-5"
            >
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--brand-surface-alt)] sm:mb-5">
                {offer.imageUrl ? <Image src={offer.imageUrl} alt={offer.imageAlt} fill sizes="(max-width: 640px) 88px, 28vw" unoptimized className="object-contain object-center transition-transform duration-300 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">{t("discoverDeal")}</span>}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-tight sm:min-h-10">{offer.title}</h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">{offer.discount}</p>
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
