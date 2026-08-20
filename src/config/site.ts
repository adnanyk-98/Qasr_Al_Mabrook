import { clientEnv } from "@/config/env";

export const siteConfig = {
  name: "Qasr Al Mabrook",
  domain: "qasralmabrook.com",
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  defaultLocale: "en" as const,
  locales: ["en", "ar"] as const,
  brand: {
    logoColorSvg: "/brand/logo-color.svg",
    logoColorPng: "/brand/logo-color.png",
    backgroundImage: "/brand/bg-logo-100.jpg",
    primaryColor: "#7f1518",
    palette: {
      primary: "#7f1518",
      primaryDark: "#5b0f13",
      primaryLight: "#f2e4e5",
      accent: "#2b2b2b",
      background: "#ffffff",
      surface: "#fffaf8",
      surfaceAlt: "#f5f1ee",
      text: "#171717",
      textMuted: "#5b5b5b",
      border: "#e7e1dd",
    },
  },
} as const;

export type SiteLocale = (typeof siteConfig.locales)[number];
