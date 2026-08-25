import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";
import { type Locale } from "@/lib/locales";

export async function PublicShell({ children, locale, path, showLocaleSwitcher = true }: { children: React.ReactNode; locale: Locale; path: string; showLocaleSwitcher?: boolean }) {
  return (
    <div className="min-h-screen bg-[var(--brand-surface)] text-[var(--foreground)]">
      <Header locale={locale} path={path} showLocaleSwitcher={showLocaleSwitcher} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
