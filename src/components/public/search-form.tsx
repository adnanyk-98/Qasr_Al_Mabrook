"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { localePath, type Locale } from "@/lib/locales";

type AutocompleteResult = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  sku: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

type SearchLabels = {
  eyebrow: string;
  placeholder: string;
  label: string;
  viewAll: string;
  loading: string;
  noResults: string;
  error: string;
};

function highlightMatch(value: string, query: string) {
  const index = value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0 || !query) return value;
  return <>{value.slice(0, index)}<mark className="rounded-sm bg-[var(--brand-accent)]/30 px-0.5 text-inherit">{value.slice(index, index + query.length)}</mark>{value.slice(index + query.length)}</>;
}

export function SearchForm({ locale, defaultValue = "", labels }: { locale: Locale; defaultValue?: string; labels: SearchLabels }) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const listId = `${inputId}-results`;
  const requestRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/${locale}/search?q=${encodeURIComponent(trimmedQuery)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Search request failed");
        const payload = await response.json() as { results?: AutocompleteResult[] };
        if (requestId !== requestRef.current) return;
        setResults(payload.results ?? []);
        setStatus("ready");
        setActiveIndex(-1);
      } catch {
        if (requestId === requestRef.current) {
          setResults([]);
          setStatus("error");
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [locale, trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function closePanel() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      window.location.assign(localePath(locale, `/products/${results[activeIndex].slug}`));
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
      setActiveIndex(-1);
    } else {
      setStatus("loading");
      setOpen(true);
    }
  }

  const showPanel = open && Boolean(trimmedQuery);
  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <form action={localePath(locale, "/search")} method="get" className="flex w-full items-center gap-2" role="search">
        <div className="relative min-w-0 flex-1">
          <input
            id={inputId}
            type="search"
            name="q"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => { if (trimmedQuery) setOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={labels.placeholder}
            aria-label={labels.label}
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            role="combobox"
            className="h-10 w-full rounded-full border border-[var(--brand-border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>
        <button type="submit" className="shrink-0 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">{labels.eyebrow}</button>
      </form>

      {showPanel ? (
        <div id={listId} role="listbox" aria-label={labels.label} className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-2 shadow-[var(--shadow-md)]">
          {status === "loading" ? <p className="px-3 py-4 text-sm text-[var(--text-muted)]" role="status">{labels.loading}</p> : null}
          {status === "error" ? <p className="px-3 py-4 text-sm text-[var(--text-muted)]" role="status">{labels.error}</p> : null}
          {status === "ready" && results.length === 0 ? (
            <>
              <p className="px-3 py-4 text-sm text-[var(--text-muted)]" role="status">{labels.noResults}</p>
              <Link href={`${localePath(locale, "/search")}?q=${encodeURIComponent(trimmedQuery)}`} onClick={closePanel} className="block border-t border-[var(--brand-border)] px-3 py-3 text-center text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-surface-alt)]">{labels.viewAll}</Link>
            </>
          ) : null}
          {status === "ready" && results.length > 0 ? (
            <>
              {results.map((result, index) => (
                <Link
                  key={result.id}
                  href={localePath(locale, `/products/${result.slug}`)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={closePanel}
                  className={`flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors ${index === activeIndex ? "bg-[var(--brand-surface-alt)]" : "hover:bg-[var(--brand-surface-alt)]"}`}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--brand-surface-alt)]">
                    {result.imageUrl ? <Image src={result.imageUrl} alt={result.imageAlt ?? result.name} fill sizes="48px" unoptimized className="object-contain" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{highlightMatch(result.name, trimmedQuery)}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{result.categoryName ?? ""}{result.categoryName && result.sku ? " · " : ""}{result.sku ?? ""}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 px-1 text-lg text-[var(--brand-primary)]">{locale === "ar" ? "←" : "→"}</span>
                </Link>
              ))}
              <Link href={`${localePath(locale, "/search")}?q=${encodeURIComponent(trimmedQuery)}`} onClick={closePanel} className="mt-1 block border-t border-[var(--brand-border)] px-3 py-3 text-center text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-surface-alt)]">{labels.viewAll}</Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
