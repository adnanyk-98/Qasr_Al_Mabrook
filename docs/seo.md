# Qasr Al Mabrook - SEO Specification

## 1. Objective

Build a technically sound multilingual catalogue that can rank for relevant product, category and business searches.

## 2. URL Strategy

Public URLs:

- `/en/...`
- `/ar/...`

Use readable slugs.

Examples:

- `/en/products/measuring-tape-5m`
- `/ar/products/measuring-tape-5m`
- `/en/categories/beauty-personal-care`
- `/ar/categories/beauty-personal-care`

Avoid IDs in public URLs unless necessary.

## 3. Canonicals

Every indexable page must have one canonical URL.

Canonical rules must account for:

- Locale
- Query parameters
- Duplicate routes
- Filter URLs

## 4. Hreflang

Where both locale versions exist, provide reciprocal:

- `en`
- `ar`
- `x-default` where justified

Do not create alternate links to pages that are not actually available.

## 5. Metadata

Every indexable page should have:

- Title
- Description
- Canonical
- Open Graph metadata
- Appropriate social image where available

Product/category metadata should be configurable.

## 6. Sitemap

Use Next.js sitemap generation.

Include:

- Published products
- Published categories
- Published subcategories
- Approved static pages
- Localized URLs where content exists

Exclude:

- Draft
- Archived
- Admin
- Internal search
- Unapproved filter combinations

## 7. Robots

`robots.txt` should:

- Allow public catalogue pages.
- Block admin routes.
- Avoid crawling obvious internal/non-canonical paths.
- Reference sitemap.

Do not use robots.txt as a substitute for authentication.

## 8. Structured Data

Potential schemas:

- Organization
- WebSite
- BreadcrumbList
- Product
- WebPage

Only output Product structured data when the page represents an actual product and required values are valid.

No fabricated:

- Price
- Availability
- Ratings
- Reviews

because these are not part of the initial business model.

## 9. Search / Filters

Default filter combinations should not automatically become indexable.

Prefer:

- Canonical to the base category/list page, or
- `noindex,follow` for non-targeted combinations

Specific SEO landing pages can be introduced later as an explicit content strategy.

## 10. Performance

SEO and performance are related.

Optimize:

- Images
- Font loading
- Client JavaScript
- Database queries
- Caching/revalidation
- Layout stability

## 11. Content

Avoid:

- Keyword stuffing
- Duplicate descriptions
- Automatically generated low-value pages
- Thin category pages

Use useful, accurate product/category descriptions.

## 12. Multilingual Content

English and Arabic pages should be treated as separate localized content.

Machine translation assistance may be used to create drafts, but published content should be reviewable and editable.
