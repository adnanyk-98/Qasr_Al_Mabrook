import type { Locale } from "@/lib/locales";

export function GoogleMapEmbed({ locale, variant = "store", className = "" }: { locale: Locale; variant?: "store" | "footer"; className?: string }) {
  const title = locale === "ar" ? "خريطة موقع قصر المبارك" : "Qasr Al Mabrook location map";

  return (
    <div className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] ${className}`}>
      <iframe
        title={title}
        src="https://www.google.com/maps?q=qasr+al+mabrook&z=14&t=m&hl=en&output=embed"
        className={`block w-full border-0 ${variant === "footer" ? "h-[220px]" : "h-[280px] md:h-[300px] lg:h-[350px]"}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
