import { type MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

/**
 * Generate robots.txt for search engines
 * Allows public catalogue pages, disallows admin and auth routes
 * 
 * Note: Query parameters (search, filters, pagination) are handled via noindex metadata,
 * not robots.txt blocking. This allows crawlers to see the pages and the noindex directive,
 * enabling proper link value passing while preventing indexing.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en/", "/ar/"],
        disallow: [
          "/admin", // Admin interface
          "/api", // API routes
          "/search", // Search results are utility pages, not landing pages
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
