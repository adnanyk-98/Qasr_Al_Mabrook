import type { Metadata } from "next";
import { headers } from "next/headers";
import { Jost, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getBaseUrl, shouldNoindexHost } from "@/lib/seo";
import { DocumentLocaleSync } from "@/components/i18n/document-locale-sync";
import { resolvePageDirection } from "@/lib/homepage-content";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  return {
    title: {
      default: siteConfig.name,
      template: "%s",
    },
    metadataBase: new URL(getBaseUrl()),
    robots: shouldNoindexHost(host)
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-qam-locale") === "ar" ? "ar" : "en";
  const dir = resolvePageDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${jost.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DocumentLocaleSync />
        {children}
      </body>
    </html>
  );
}
