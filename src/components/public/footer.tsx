import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/layout";

export function Footer() {
  return (
    <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-surface)]">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <div className="text-lg font-semibold text-[var(--foreground)]">{siteConfig.name}</div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-muted)]">
            Premium catalogue and enquiry platform for product discovery across English and Arabic experiences.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            Explore
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li><Link href="/" className="hover:text-[var(--brand-primary)]">Home</Link></li>
            <li><Link href="/products" className="hover:text-[var(--brand-primary)]">Catalogue</Link></li>
            <li><Link href="/categories" className="hover:text-[var(--brand-primary)]">Categories</Link></li>
            <li><Link href="/contact-us" className="hover:text-[var(--brand-primary)]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
            Contact
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-muted)]">
            <li>Sales enquiries</li>
            <li>English / Arabic support</li>
            <li>Responsive product discovery</li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
