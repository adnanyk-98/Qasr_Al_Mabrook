"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Public route error", { digest: error?.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-[var(--text-muted)]">Please try again.</p>
        <button type="button" onClick={() => reset()} className="rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-white">Try again</button>
      </div>
    </main>
  );
}