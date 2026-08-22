"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global application error", { digest: error?.digest });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p>Please try again.</p>
            <button type="button" onClick={() => reset()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}