# Qasr Al Mabrook - Technical Specification

## 1. Approved Stack

| Concern           | Decision                           |
| ----------------- | ---------------------------------- |
| Framework         | Next.js App Router                 |
| Language          | TypeScript                         |
| Database          | PostgreSQL                         |
| Database provider | Supabase PostgreSQL                |
| ORM               | Drizzle ORM                        |
| Public i18n       | next-intl                          |
| Image storage     | Cloudflare R2                      |
| Public languages  | English + Arabic                   |
| Locale routing    | `/en/...`, `/ar/...`               |
| Admin language    | English initially                  |
| Authentication    | Application-managed authentication |
| Analytics         | Deferred                           |

## 2. Supabase Boundary

Supabase is used as a managed PostgreSQL provider.

Initial architecture does NOT depend on:

- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase client APIs for core database access

The application accesses PostgreSQL through Drizzle.

## 3. Rendering

Prefer Next.js Server Components and server-side data access by default.

Use Client Components only where interactivity requires them, such as:

- Filters
- Search input interactions
- Variant selectors
- Image galleries
- Admin forms
- Modals/drawers

## 4. API / Server Boundary

Business logic should not be duplicated between pages and APIs.

Use a service/repository pattern where appropriate:

- UI/server action/API route
- service/domain logic
- repository/database layer
- Drizzle

Public endpoints must validate all input server-side.

## 5. Dependencies

Do not add a dependency merely because it is convenient.

Before adding a package:

1. Confirm the capability is not already provided by Next.js/TypeScript.
2. Check whether an existing project utility can solve it.
3. Confirm maintenance and compatibility.
4. Document the architectural reason when the package affects core behavior.

## 6. Environment Variables

Secrets/configuration must come from environment variables.

Examples:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL` where migrations require it
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `AUTH_SECRET`
- `EMAIL_FROM`
- `EMAIL_TO`
- `SMTP_*` or approved email provider variables
- `NEXT_PUBLIC_SITE_URL`

Never expose server-only secrets through `NEXT_PUBLIC_*`.

## 7. Database Conventions

- UUID primary keys unless a documented reason requires otherwise.
- UTC timestamps.
- `created_at`, `updated_at` on mutable entities.
- Explicit foreign keys.
- Unique constraints for business identifiers.
- Index columns used frequently for filtering/search/joins.
- Soft archive where business history matters.
- Avoid polymorphic foreign keys unless necessary.
- Use database constraints for invariants that must always hold.

## 8. Image Storage

Cloudflare R2 stores image binaries.

PostgreSQL stores:

- Object key
- Public/derived URL reference
- Alt text
- Width/height when known
- Sort order
- Primary-image flag
- Product/variant relationship
- Creation metadata

## 9. Internationalization

Use `next-intl` for:

- UI translations
- Locale routing
- Locale switching
- RTL direction
- Localized metadata

Catalogue/content translations are stored in database translation tables.

## 10. Non-Functional Targets

Initial targets:

- Responsive from ~320px upward.
- Accessible keyboard interaction.
- No unnecessary client-side rendering.
- Optimized images.
- Fast initial page loads.
- SEO indexable public content.
- Secure server-side authorization.
