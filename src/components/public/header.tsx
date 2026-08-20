import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Catalogue", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--brand-border)] bg-white/90 backdrop-blur-sm">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">
          <Image
            src={siteConfig.brand.logoColorSvg}
            alt={`${siteConfig.name} logo`}
            width={160}
            height={56}
            priority
            className="h-auto w-28 sm:w-36"
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-xs font-medium text-[var(--foreground)] sm:flex">
            EN / AR
          </div>
          <Button variant="primary" size="sm" className="hidden sm:inline-flex">
            Request Quote
          </Button>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-border)] text-base text-[var(--foreground)] md:hidden"
          >
            ☰
          </button>
        </div>
      </Container>
    </header>
  );
}
