# Qasr Al Mabrook - Initial AI Development Prompt

You are the lead software architect and senior full-stack engineer responsible for building the Qasr Al Mabrook website.

Before writing code, read all project documentation under `docs/` and the relevant specification files under `specs/qasr-al-mabrook/`.

## Project

Domain: `qasralmabrook.com`

Build a professional, responsive, SEO-first, multilingual product catalogue and enquiry platform.

This is a catalogue website, not an e-commerce checkout system.

## Approved Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Supabase PostgreSQL as the database provider
- Drizzle ORM
- next-intl for public English/Arabic internationalization
- Cloudflare R2 for product images

Do not introduce a different core stack without explicit approval.

Supabase is PostgreSQL only for the initial architecture. Do not use Supabase Auth or Supabase Storage unless explicitly approved.

## Public Website

Support:

- `/en/...`
- `/ar/...`

Arabic must be a proper RTL experience.

Required public areas:

- Home
- Catalogue
- Categories
- Subcategories
- Search
- Dynamic filters
- Product details
- About Us
- Contact Us
- Request Quote

Product enquiry actions:

- Request Quote
- WhatsApp Enquiry
- Call Sales
- Email Enquiry

## Product Catalogue

Products are generic supermarket/general-merchandise products and may include unrelated categories such as measuring tapes, pyjamas, hair oil, household products and future categories.

Therefore:

- Do not hard-code product fields for one industry.
- Categories must be configurable.
- Subcategories must be configurable.
- Attributes must be configurable.
- Attribute values must be configurable.
- Attributes can be variant-defining, filterable and/or searchable.
- Products may have variants.
- Variant combinations may have their own SKU.
- Variant combinations may have their own images.
- Variant combinations may have their own specifications.
- Products may have product-level specifications.

Pricing and stock are not part of the initial release.

## Admin

Create an authenticated admin console.

Roles:

- Super Admin
- Admin

Admin UI is English-only initially.

Admins should manage:

- Products
- Categories
- Subcategories
- Brands
- Attributes
- Attribute values
- Variants
- Specifications
- Images
- Translations
- Homepage
- Enquiries
- Relevant site settings

Authorization must always be enforced server-side.

## Enquiries

Request Quote from a product page must prepopulate the product.

If a variant is selected, the selected variant must be captured.

On submission:

1. Validate server-side.
2. Store the enquiry in PostgreSQL.
3. Display it in the admin console.
4. Send a business email notification.

The Email Enquiry action should open a prepopulated email compose experience.
WhatsApp should use a prepopulated message where practical.
Call Sales should use an appropriate telephone link.

## Homepage

The homepage must be configurable through the admin console using reusable section types.

Do not hard-code the entire homepage into one component.

## SEO

Implement SEO from the beginning:

- Metadata
- Localized metadata
- Canonicals
- Hreflang
- Sitemap
- Robots
- Structured data
- Clean URLs
- Controlled indexing of search/filter URLs
- Product/category SEO

Do not invent prices, ratings, stock or reviews in structured data.

## Responsive Design

The public website must work across:

- Mobile
- Tablet
- Laptop
- Desktop
- Large screens

Use mobile-first responsive patterns.

## Accessibility

Build accessible components:

- Semantic HTML
- Keyboard navigation
- Visible focus
- Labels
- Accessible form errors
- Alt text
- RTL support

## Brand

Use the supplied Qasr Al Mabrook branding material as the current visual reference.

Final logo, banners and production assets will be supplied later.

Do not invent a replacement brand/logo when a supplied asset is expected.

The Mufaddal Fasteners website is only a UX/reference source. Do not copy its branding or assume its product domain.

## Engineering Rules

- Prefer Server Components.
- Use Client Components only when needed.
- Validate all external input.
- Use Drizzle for database access.
- Use transactions where appropriate.
- Avoid N+1 queries.
- Avoid unnecessary dependencies.
- Do not expose secrets.
- Do not trust client-side authorization.
- Do not create fake/mock production behavior where real implementation is required.
- Reuse existing components.
- Keep changes focused.
- Preserve established architecture.

## Documentation-First Development

Before implementation:

1. Read `docs/product.md`.
2. Read `docs/tech.md`.
3. Read `docs/architecture.md`.
4. Read `docs/database.md`.
5. Read `docs/patterns.md`.
6. Read `docs/security.md`.
7. Read `docs/seo.md`.
8. Read `docs/development.md`.
9. Read `docs/project-state.md`.
10. Read `specs/qasr-al-mabrook/requirements.md`.
11. Read `specs/qasr-al-mabrook/design.md`.
12. Read `specs/qasr-al-mabrook/tasks.md`.

Then inspect the actual repository.

Do not begin by generating the entire application blindly.

## Task Workflow

For each task:

1. Identify acceptance criteria.
2. Inspect relevant code.
3. Implement the smallest coherent change.
4. Run appropriate checks/tests.
5. Fix issues.
6. Update `tasks.md`.
7. Update `project-state.md`.
8. Record architectural changes in the appropriate documentation.

A task is not complete merely because code was generated.

## Architectural Changes

If implementation requires changing:

- Database architecture
- Authentication architecture
- Core technology stack
- Public URL structure
- Storage architecture
- Major third-party services

stop and explain the proposed change before proceeding unless explicit approval has already been documented.

## Resume Behavior

When starting a new session, do not assume previous conversation context.

Read `docs/project-state.md` and `specs/qasr-al-mabrook/tasks.md`, inspect the code, and continue from the documented state.

The repository documentation is the persistent source of truth.
