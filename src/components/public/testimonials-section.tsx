import { getTranslations } from "next-intl/server";

import { Container, Section } from "@/components/ui/layout";
import type { Locale } from "@/lib/locales";

const testimonialKeys = ["retail", "tailoring", "procurement"] as const;

export async function TestimonialsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "testimonials" });

  return (
    <Section className="border-t border-[var(--brand-border)] bg-[var(--brand-surface-alt)]">
      <Container className="space-y-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("eyebrow")}</p>
          <h2 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{t("title")}</h2>
          <p className="text-sm leading-6 text-[var(--text-muted)]">{t("sampleNote")}</p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {testimonialKeys.map((key) => (
            <figure key={key} className="flex h-full min-h-[250px] flex-col rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <blockquote className="flex-1 text-base leading-7 text-[var(--text-muted)]">
                <span className="mb-3 block text-4xl leading-none text-[var(--brand-primary)]" aria-hidden="true">&ldquo;</span>
                {t(`${key}.quote`)}
              </blockquote>
              <figcaption className="mt-6 border-t border-[var(--brand-border)] pt-4">
                <span className="block font-semibold text-[var(--brand-primary)]">{t(`${key}.name`)}</span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">({t(`${key}.role`)})</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
