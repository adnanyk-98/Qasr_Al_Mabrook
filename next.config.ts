import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { legacyCategoryRedirects } from "./src/lib/legacy-category-redirects";
import { CONTENT_SECURITY_POLICY } from "./src/lib/security-policy";
import { HTML_LIMITED_BOTS } from "./src/lib/html-limited-bots";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const mutableLocalAssetHeaders = [
  { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
];

const nextConfig: NextConfig = {
  htmlLimitedBots: HTML_LIMITED_BOTS,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.qasralmabrook.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/brand/:path*", headers: mutableLocalAssetHeaders },
      { source: "/catalogue/:path*", headers: mutableLocalAssetHeaders },
      { source: "/store-locator/:path*", headers: mutableLocalAssetHeaders },
    ];
  },
  async redirects() {
    return legacyCategoryRedirects;
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
