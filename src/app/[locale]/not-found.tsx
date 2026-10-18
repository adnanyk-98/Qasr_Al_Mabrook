import { headers } from "next/headers";

import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";

export default async function LocaleNotFound() {
  const requestHeaders = await headers();
  const messages =
    requestHeaders.get("x-qam-locale") === "ar" ? arMessages : enMessages;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">{messages.notFound.title}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {messages.notFound.description}
        </p>
      </div>
    </main>
  );
}
