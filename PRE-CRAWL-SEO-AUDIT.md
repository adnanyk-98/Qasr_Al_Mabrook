# Qasr Al Mabrook Pre-Crawl SEO Audit

Production target: https://www.qasralmabrook.com/
Audit date: 2026-09-27

## Scope And Method

This audit covers the Next.js source tree and the currently deployed production responses. Source inspection is not evidence that the current production deployment contains the same build. The live site was checked in a browser; no Google Search Console account or indexing data was available. No destructive operations were performed.

## Application Discovery

- Next.js 16.3.1, App Router (`src/app`); no Pages Router.
- React 19.2.8 and `next-intl` provide the English/Arabic localized experience.
- Localized routes are rooted at `/[locale]`, with `en` and `ar`; `src/proxy.ts` passes the selected locale to the root layout.
- `/` redirects to `/en`.
- Public static route templates: `/[locale]`, `/[locale]/products`, `/[locale]/categories`, `/[locale]/search`, `/[locale]/store-locator`, `/[locale]/about-us`, `/[locale]/contact-us`, and `/[locale]/request-quote`.
- Public dynamic route templates: `/[locale]/products/[slug]` and `/[locale]/categories/[slug]`.
- No public brand-detail or nested-subcategory route implementation was found. Brands are displayed on the homepage; there is no standalone brand URL template.
- Admin pages are under `/admin` and `/admin/*`; login is `/admin/login`. Admin layout requires an admin session.
- API route handlers: localized `/api/[locale]/search` and `/api/[locale]/search-index`; admin image upload/delete, product/category delete, homepage update/delete, and hero upload endpoints.
- SEO generators: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts`, root/localized layouts, and per-page `generateMetadata` functions.
- `metadataBase` is configured in `src/app/layout.tsx`; canonical/social/schema base URLs flow through `siteConfig.url` and `getBaseUrl()`.
- Structured data present: Organization, WebSite, Product, and BreadcrumbList. Offer/price/availability values are not present in Product JSON-LD, appropriately avoiding invented data.
- `src/app/icon.svg` is the Qasr Al Mabrook castle-mark SVG and was served successfully in production. No Apple touch icon or web manifest route/file was found.
- No `middleware.ts`; `src/proxy.ts` handles locale request headers. `next.config.ts` defines security/cache headers and no redirect/rewrites rules.
- SEO package/config: Next Metadata API; no dedicated SEO package. Site URL is controlled by `NEXT_PUBLIC_SITE_URL`, consumed by `siteConfig.url` and `getBaseUrl()`. The source default is the production URL, but `.env.example` and CI intentionally set localhost for local/test use.

## Route Matrix (Pre-Fix Production Observation)

| Route | Index? | Status | Canonical | Sitemap | Issue |
|---|---|---:|---|---|---|
| `/` | Redirect only | Redirects to `/en` | N/A | No | Redirect destination is localized homepage; validate redirects at edge after deployment. |
| `/en` | Yes | 200 | `http://localhost:3000/en` | Yes (as localhost) | Wrong production canonical; active-hero homepage had no H1 and nested main landmarks. |
| `/ar` | Yes | 200 observed | `http://localhost:3000/ar` | Yes (as localhost) | Wrong production canonical; active-hero H1 requires same correction as English. |
| `/en/products` | Yes, base listing | 200 | `http://localhost:3000/en/products` | Yes (as localhost) | Wrong canonical origin. |
| `/[locale]/products` with query filters/search/page | Noindex, follow | 200 observed for `q` and `page` | Base listing, but localhost origin | No | Current broad noindex policy avoids query-index bloat; production origin is wrong. |
| `/[locale]/products/[slug]` | Yes when published | 200 observed for `fancy-suit` | `http://localhost:3000/...` | Yes (as localhost) | Canonical, hreflang, Product/Breadcrumb URLs use localhost. |
| `/en/categories` | Yes | Source route exists | `http://localhost:3000/en/categories` | Yes (as localhost) | Wrong canonical origin; full production route inventory not exhaustively enumerated. |
| `/[locale]/categories/[slug]` | Yes when published | 200 observed for `fancy-suit` | `http://localhost:3000/...` | Yes (as localhost) | Wrong canonical and hreflang origin. |
| `/[locale]/search[?q=...]` | Noindex, follow | Source route exists | Localhost origin | No | Noindex implementation exists; live sample was not collected. |
| `/[locale]/contact-us` | Yes | Source route exists | Localhost origin | Yes (as localhost) | Contact metadata description falls back to generic text; query submission states were not explicitly noindexed. |
| `/[locale]/request-quote[?...]` | Noindex recommended | 200 observed with success query | Localhost origin | No | Utility/success state was indexable before fix. |
| `/[locale]/about-us` | Yes when published | Source route exists; fallback can render | Localhost origin | Yes (as localhost) | Dynamic database content and production availability require deployment verification. |
| `/[locale]/store-locator` | Yes | Source route exists | Localhost origin | Yes (as localhost) | Address/map and image availability need full production verification. |
| `/admin`, `/admin/*`, `/admin/login` | No | Session-dependent | Not a public canonical | No | Robots disallows `/admin`; authentication remains authoritative. Verify noindex on login/admin responses. |
| `/api/*` | No | Route-specific | N/A | No | Robots disallows `/api`; endpoint responses are not page URLs. |
| Unknown localized route | No | 404 observed | N/A | No | Not-found UI was displayed; response status and noindex header require independent production check. |

Pre-fix production sitemap observation: HTTP 200, `application/xml`, 38 URLs, all 38 unique, no query/admin/API URLs, but all 38 used `http://localhost:3000`. Production robots returned 200 but its Sitemap directive also used `http://localhost:3000/sitemap.xml`.

## Pre-Crawl Checklist (Baseline Before Fixes)

Status key: `[PASS]` working; `[WARNING]` attention; `[FAIL]` must fix; `[VERIFY]` requires production/infrastructure verification; `[N/A]` not applicable.

| # | Category | Baseline | Evidence / note |
|---:|---|---|---|
| 1 | DOMAIN & CANONICAL URL | [FAIL] | Live canonicals and generated base URLs resolve to localhost. |
| 2 | ROBOTS.TXT | [FAIL] | Live file is reachable but Sitemap points to localhost. Admin/API disallows are present. |
| 3 | SITEMAP.XML | [FAIL] | Live XML is valid/reachable/unique but every URL is localhost HTTP. |
| 4 | INDEXABILITY | [WARNING] | Search/filter pages noindex; quote success utility state was indexable. |
| 5 | CANONICAL TAGS | [FAIL] | Sampled production home/product/category canonicals use localhost. |
| 6 | TITLE TAGS | [PASS] | Sampled homepage/product/category titles are descriptive and differ by page. Full DB coverage pending. |
| 7 | META DESCRIPTIONS | [WARNING] | Shared generic fallback is used for some pages; contact/request quote metadata do not use page-specific descriptions. |
| 8 | H1/H2 HEADING STRUCTURE | [FAIL] | Active-hero homepage has no H1; nested `<main>` landmarks also observed there. Other sampled detail pages have H1. |
| 9 | OPEN GRAPH | [FAIL] | Sampled `og:url` and fallback `og:image` use localhost. |
| 10 | TWITTER/X CARDS | [FAIL] | Card type exists, but image URL uses localhost. |
| 11 | STRUCTURED DATA / JSON-LD | [FAIL] | JSON-LD parses, but all site/product/breadcrumb URLs use localhost. |
| 12 | PRODUCT SEO | [FAIL] | Product metadata/schema are populated, but absolute URLs use localhost. |
| 13 | CATEGORY SEO | [FAIL] | Category metadata exists, but absolute canonical/hreflang URLs use localhost. |
| 14 | LOCALIZATION / LANGUAGE | [FAIL] | `lang`, RTL/LTR, and reciprocal en/ar/x-default links exist; all alternate URLs use localhost. |
| 15 | INTERNAL LINKING | [PASS] | Sampled homepage, product, category, and quote CTAs resolve to localized route patterns. Full crawl pending. |
| 16 | BROKEN LINKS | [VERIFY] | No exhaustive link crawl completed in baseline. |
| 17 | IMAGE SEO | [WARNING] | Public media loaded in samples; actual source dimensions are large (up to 2500px) and should be reviewed against delivery strategy. |
| 18 | IMAGE ALT TEXT | [WARNING] | Sampled key logo, hero, product, and brand images had meaningful alt; full crawl and empty-alt classification pending. |
| 19 | PERFORMANCE-RELATED SEO | [VERIFY] | Source is server rendered and uses Next Image for major images; Core Web Vitals require production field/lab measurement. |
| 20 | MOBILE SEO | [VERIFY] | Responsive implementation exists; full mobile crawl/performance check not completed. |
| 21 | HTTPS / SECURITY | [PASS] | HTTPS production pages and media loaded. Security headers are configured in source. |
| 22 | REDIRECTS | [VERIFY] | HTTP/non-www root navigation converged on HTTPS www `/en`; exact status/chain and every old URL require edge/provider verification. |
| 23 | 404 / ERROR PAGES | [WARNING] | Not-found UI observed; HTTP status and robots metadata need explicit verification. |
| 24 | DUPLICATE URLS | [WARNING] | Query canonicalization exists for product listing and product variants; query states need explicit noindex review. |
| 25 | PAGINATION / FILTER URLS | [WARNING] | All query-bearing product lists are noindex; confirm this is intended for paginated discovery. |
| 26 | QUERY PARAMETERS | [WARNING] | Quote success/error states currently share a canonical with the base form and lack noindex. |
| 27 | INDEXABLE VS NON-INDEXABLE PAGES | [WARNING] | Public/admin/query policy is partly implemented; quote and admin login need review. |
| 28 | FAVICON / SITE IDENTITY | [PASS] | `/icon.svg` serves the branded castle SVG. Apple icon/manifest not found. |
| 29 | GOOGLE SEARCH CONSOLE READINESS | [FAIL] | Sitemap cannot be submitted safely while live URLs are localhost. GSC ownership/indexing not verified. |
| 30 | PRODUCTION ENVIRONMENT CONFIGURATION | [FAIL] | Live output behaves as if `NEXT_PUBLIC_SITE_URL` was compiled as localhost despite the source default and local env being canonical. |

## Pre-Fix Critical Issues

1. The deployed production build emits localhost URLs throughout robots, sitemap, canonical, hreflang, social metadata, and JSON-LD.
2. The active-hero homepage has no H1 and emits nested main landmarks.
3. Quote form/success query URLs are indexable despite being utility/personalized states.

## Pre-Fix Warnings

- Contact/request-quote metadata uses generic descriptions rather than page-specific copy.
- Static sitemap entries use generation-time `new Date()` values rather than content update times.
- Apple touch icon and web manifest are absent; branded Next icon is present.
- Full crawl, all published dynamic slugs, link integrity, DB content completeness, and Core Web Vitals need broader/deployed verification.

## Re-Audit

Pending code-level fixes and rerun. Production changes cannot be observed until the corrected build is deployed; do not treat source fixes as proof that the current live deployment is fixed.

## Final Production Readiness & Live SEO Verification (2026-09-27)

### Status Summary

This final pass focused on distinguishing source correctness from deployment reality. The repository contains verified source-level fixes for the canonical-origin and SEO issues, but the live production site remains unverified as fixed because the corrected build has not been deployed to the public host.

### SOURCE / CODE VERIFIED

- The canonical site origin logic was corrected in the source tree to use a single production-safe origin source, and the site config enforces the production host instead of localhost behavior.
- The production-readiness validation logic now rejects localhost and non-canonical hosts for public metadata generation.
- The sitemap generation was corrected to emit canonical production URLs and exclude non-public/admin paths.
- The locale fallback logic was tightened so metadata and sitemap generation reflect real translation coverage rather than advertising fallback English content as localized output.
- Noindex behavior was added for utility pages that are not intended to be indexed.
- The homepage markup issue was corrected: the visible H1 was restored and the nested duplicate main landmark was removed.
- Relevant validation commands passed in source: `npm run typecheck` and `npm test` (64 pass, 0 fail, 1 skipped). `git diff --check` also passed.

### LOCAL BUILD VERIFIED

- The app builds and runs locally without the audited SEO regressions when served from the project environment.
- Local runtime checks confirmed that the canonical domain logic resolves to the expected production host and that the sitemap/robots generation no longer emits localhost values in the local verified build.
- This is evidence of correct code behavior, but it is not evidence that the public production site has been updated.

### LIVE PRODUCTION VERIFIED

- This remains unverified as fixed.
- Live verification against `https://www.qasralmabrook.com` showed repeated localhost contamination in production responses.
- Evidence from the live checks:
  - `https://www.qasralmabrook.com/robots.txt` returned HTTP 200, but the sitemap directive still pointed to `http://localhost:3000/sitemap.xml`.
  - `https://www.qasralmabrook.com/sitemap.xml` returned HTTP 200 and contained 38 URLs, all beginning with `http://localhost:3000/`.
  - Representative pages such as `/en`, `/en/products`, `/en/products/fancy-suit`, `/en/categories/fancy-suit`, `/en/about-us`, `/en/contact-us`, and `/en/request-quote?success=demo` all returned canonical URLs beginning with `http://localhost:3000/...`.
  - `og:url` and fallback social/image URLs were also pointing to `http://localhost:3000`.
- Conclusion: the public production deployment is still serving the pre-fix SEO metadata and has not yet been updated with the verified source fix.

### SEARCH CONSOLE VERIFIED

- Not verified.
- No Google Search Console access, verification token, or production-indexing data were available in this environment.
- Search Console confirmation of sitemap submission, canonical indexing, or Google-side recovery remains pending and cannot be claimed.

### Final Recommendation

1. Deploy the source-verified fix set to the real production environment.
2. Re-run the live checks against `https://www.qasralmabrook.com/robots.txt`, `sitemap.xml`, and representative page URLs to confirm canonical host cleanup after deployment.
3. Only after deployment and a successful live check should the issue be described as fixed in the production environment.
4. Search Console status must be validated separately by the deployment owner or team with access to the live Search Console property.

### Final Overall Status

- SOURCE / CODE VERIFIED: Yes
- LOCAL BUILD VERIFIED: Yes
- LIVE PRODUCTION VERIFIED: No — blocked by deployment not yet performed
- SEARCH CONSOLE VERIFIED: No — not available in this environment

This is a deployment-blocked SEO issue: the code is fixed, the local verification is good, but the public production site is still serving localhost-based SEO metadata and therefore cannot be claimed as fixed until the updated build is deployed and then re-checked live.