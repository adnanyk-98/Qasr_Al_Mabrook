export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-4 sm:p-6" aria-busy="true" aria-label="Admin console loading">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="qam-skeleton h-10 w-10 rounded-full" />
            <div className="space-y-2"><div className="qam-skeleton h-3 w-28" /><div className="qam-skeleton h-2 w-20" /></div>
          </div>
          <nav aria-label="Admin navigation loading" className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="qam-skeleton h-9 w-full rounded-[var(--radius-sm)]" />)}
          </nav>
        </aside>

        <section className="min-w-0 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <header className="flex items-center justify-between gap-4 border-b border-[var(--brand-border)] pb-5">
            <div className="space-y-3"><div className="qam-skeleton h-3 w-14" /><div className="qam-skeleton h-9 w-52" /></div>
            <div className="qam-skeleton h-9 w-24 rounded-[var(--radius-sm)]" />
          </header>

          <div className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="qam-skeleton h-10 min-w-[min(100%,18rem)] flex-1 rounded-[var(--radius-sm)]" /><div className="qam-skeleton h-9 w-28 rounded-[var(--radius-sm)]" /></div>
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--brand-border)] p-3">
              <div className="space-y-4">
                {Array.from({ length: 8 }, (_, index) => <div key={index} className="grid grid-cols-[2rem_minmax(0,1fr)_6rem_5rem] items-center gap-3 border-b border-[var(--brand-border)] pb-4 last:border-0 last:pb-0"><div className="qam-skeleton h-3 w-5" /><div className="qam-skeleton h-4 w-full max-w-sm" /><div className="qam-skeleton h-6 w-16 rounded-full" /><div className="qam-skeleton h-8 w-20 rounded-[var(--radius-sm)]" /></div>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><div className="qam-skeleton h-4 w-36" /><div className="flex gap-2"><div className="qam-skeleton h-8 w-16 rounded-[var(--radius-sm)]" /><div className="qam-skeleton h-8 w-16 rounded-[var(--radius-sm)]" /><div className="qam-skeleton h-8 w-16 rounded-[var(--radius-sm)]" /></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
