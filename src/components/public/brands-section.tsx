import type { Locale } from "@/lib/locales";

export function BrandsSection({ locale, brands }: { locale: Locale; brands: Array<{ id: string; name: string; logoUrl: string }> }) {
  if (!brands.length) return null;

  return (
    <section aria-labelledby="homepage-brands-title" className="bg-[var(--brand-surface-alt)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{locale === "ar" ? "علاماتنا التجارية" : "Our brands"}</p>
          <h2 id="homepage-brands-title" className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{locale === "ar" ? "شركاء تثق بهم" : "Brands you can trust"}</h2>
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible lg:grid-cols-6" aria-label={locale === "ar" ? "العلامات التجارية" : "Brands"}>
          {brands.map((brand) => (
            <div key={brand.id} className="flex min-w-[calc(50%-0.5rem)] snap-start items-center justify-center rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-5 sm:min-w-0 sm:p-6">
              <img src={brand.logoUrl} alt={`${brand.name} logo`} className="h-20 w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
