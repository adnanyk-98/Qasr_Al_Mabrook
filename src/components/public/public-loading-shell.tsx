"use client";

import { useEffect, useState } from "react";

type PublicLoadingShellProps = {
  locale: "en" | "ar";
  pageLabel: string;
  takingLongerLabel: string;
  retryLabel: string;
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`qam-skeleton ${className}`} />;
}

export function PublicLoadingShell({ locale, pageLabel, takingLongerLabel, retryLabel }: PublicLoadingShellProps) {
  const [takingLonger, setTakingLonger] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLonger(true), 6500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="bg-[var(--brand-surface)] text-[var(--foreground)]" data-testid="public-loading-shell" aria-busy="true">
      <div className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-[var(--brand-primary-light)]" role="progressbar" aria-label={pageLabel}>
        <div className="qam-loading-progress h-full w-1/3 bg-[var(--brand-primary)]" />
      </div>

      <main className="min-w-0" aria-label={pageLabel}>
        <section className="w-full">
          <Skeleton className="aspect-[9/10] w-full md:aspect-[8/3]" />
        </section>

        <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-56" /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={`category-${index}`} className="aspect-[4/5] w-full" />)}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
          <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-48" /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={`product-${index}`} className="aspect-[4/5] w-full" />)}
          </div>
        </section>

        {takingLonger ? (
          <div className="mx-auto max-w-md px-4 pb-12 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-[var(--text-muted)]">{takingLongerLabel}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)]">{retryLabel}</button>
          </div>
        ) : null}
      </main>

    </div>
  );
}