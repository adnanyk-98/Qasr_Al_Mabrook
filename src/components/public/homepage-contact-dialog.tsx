"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { claimHomepageContactPopupSession } from "@/lib/homepage-contact";
import type { Locale } from "@/lib/locales";

let hasShownInThisDocument = false;

type HomepageContactDialogProps = {
  locale: Locale;
  phoneHref: string | null;
  whatsappUrl: string | null;
  mapsUrl: string;
};

function ContactIcon({ type }: { type: "phone" | "chat" | "map" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: "h-5 w-5 shrink-0",
  };

  if (type === "phone") {
    return (
      <svg {...common}>
        <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.6 2 2 0 0 1 3.1 1.4h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7 9.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.2Z" />
      </svg>
    );
  }

  if (type === "chat") {
    return (
      <svg {...common}>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.4a8.5 8.5 0 1 1 16.3-4.1Z" />
        <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ActionContents({
  type,
  children,
}: {
  type: "phone" | "chat" | "map";
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-3">
      <ContactIcon type={type} />
      <span>{children}</span>
    </span>
  );
}

export function HomepageContactDialog({
  locale,
  phoneHref,
  whatsappUrl,
  mapsUrl,
}: HomepageContactDialogProps) {
  const t = useTranslations("home.contactPopup");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const timer = window.setTimeout(() => {
      if (hasShownInThisDocument) return;

      let storage: Storage | null = null;
      try {
        storage = window.sessionStorage;
      } catch {
        storage = null;
      }

      if (!claimHomepageContactPopupSession(storage)) {
        hasShownInThisDocument = true;
        return;
      }

      hasShownInThisDocument = true;
      dialog.showModal();
      previousOverflow.current = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (dialog.open) dialog.close();
      if (previousOverflow.current !== null) {
        document.documentElement.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
  }, []);

  function restorePageScroll() {
    if (previousOverflow.current !== null) {
      document.documentElement.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
    restorePageScroll();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="homepage-contact-title"
      aria-describedby="homepage-contact-description"
      className="fixed inset-0 m-auto max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-[var(--brand-border)] bg-white p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/55"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      onClose={restorePageScroll}
    >
      <div className="px-[max(1.25rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-[max(1.75rem,env(safe-area-inset-left),env(safe-area-inset-right))] sm:pt-[max(1.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("eyebrow")}
            </p>
            <h2
              id="homepage-contact-title"
              className="text-xl font-semibold leading-tight sm:text-2xl"
            >
              {t("title")}
            </h2>
            <p
              id="homepage-contact-description"
              className="text-sm leading-6 text-[var(--text-muted)]"
            >
              {t("description")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            aria-label={t("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-border)] text-xl leading-none transition-colors hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] motion-reduce:transition-none"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {phoneHref ? (
            <TrackedLink
              event="phone_click"
              params={{ locale, source: "homepage-contact-popup" }}
              href={phoneHref}
              dir="ltr"
              className="flex min-h-12 w-full items-center rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-start font-semibold text-white transition-colors hover:bg-[var(--brand-primary-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] motion-reduce:transition-none"
            >
              <ActionContents type="phone">{t("callUs")}</ActionContents>
            </TrackedLink>
          ) : (
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full items-center rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-start font-semibold text-white opacity-60"
            >
              <ActionContents type="phone">{t("callUs")}</ActionContents>
            </button>
          )}

          {whatsappUrl ? (
            <TrackedLink
              event="whatsapp_click"
              params={{ locale, source: "homepage-contact-popup" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3 text-start font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] motion-reduce:transition-none"
            >
              <ActionContents type="chat">{t("chatOnWhatsApp")}</ActionContents>
            </TrackedLink>
          ) : (
            <div>
              <button
                type="button"
                disabled
                aria-describedby="homepage-whatsapp-unavailable"
                className="flex min-h-12 w-full items-center rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3 text-start font-semibold text-[var(--foreground)] opacity-60"
              >
                <ActionContents type="chat">{t("chatOnWhatsApp")}</ActionContents>
              </button>
              <p
                id="homepage-whatsapp-unavailable"
                className="mt-1 text-xs leading-5 text-[var(--text-muted)]"
              >
                {t("whatsAppUnavailable")}
              </p>
            </div>
          )}

          <TrackedLink
            event="map_click"
            params={{ locale, source: "homepage-contact-popup" }}
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3 text-start font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] motion-reduce:transition-none"
          >
            <ActionContents type="map">{t("findOurShop")}</ActionContents>
          </TrackedLink>
        </div>
      </div>
    </dialog>
  );
}
