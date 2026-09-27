import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
	{ key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; frame-src https://www.google.com; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:;" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const mutableLocalAssetHeaders = [
	{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
];

const nextConfig: NextConfig = {
	async headers() {
		return [
			{ source: "/(.*)", headers: securityHeaders },
			{ source: "/brand/:path*", headers: mutableLocalAssetHeaders },
			{ source: "/catalogue/:path*", headers: mutableLocalAssetHeaders },
			{ source: "/store-locator/:path*", headers: mutableLocalAssetHeaders },
		];
	},
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
