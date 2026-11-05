import { clientEnv } from "@/config/env";

export const PRODUCTION_SITE_URL = "https://www.qasralmabrook.com";

export function resolveSiteUrl(nodeEnv: string | undefined, configuredUrl: string): string {
  return nodeEnv === "production" ? PRODUCTION_SITE_URL : configuredUrl;
}

const businessAddress = "Al Ghuwair - Hay Al Gharb - Sharjah - United Arab Emirates";
const googleMapsListingUrl =
  "https://www.google.com/maps/place/Qasr+Al+Mabrook+Trading+LLC/@25.3595724,55.3887041,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f5a31d351dcf7:0x45b5fd047feac859!8m2!3d25.3595676!4d55.391279!16s%2Fg%2F11bbwps06h?entry=ttu&g_ep=EgoyMDI2MTEwMi4wIKXMDSoASAFQAw%3D%3D";

export const siteConfig = {
  name: "Qasr Al Mabrook",
  domain: "qasralmabrook.com",
  url: resolveSiteUrl(process.env.NODE_ENV, clientEnv.NEXT_PUBLIC_SITE_URL),
  contact: {
    address: businessAddress,
    phone: "+971503093800",
    mapsUrl: googleMapsListingUrl,
  },
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
