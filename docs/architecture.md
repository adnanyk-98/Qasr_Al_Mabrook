# Qasr Al Mabrook - Architecture

## 1. System Overview

```text
Browser
  |
  v
Next.js App Router
  |
  +-------------------- Public Catalogue
  |                     - Home
  |                     - Categories
  |                     - Search
  |                     - Filters
  |                     - Products
  |                     - Enquiries
  |
  +-------------------- Admin Console
                        - Auth
                        - Catalogue
                        - Content
                        - Enquiries
                        - Settings
  |
  v
Domain / Service Layer
  |
  v
Repository / Data Access
  |
  v
Drizzle ORM
  |
  v
Supabase PostgreSQL

Cloudflare R2
  ^
  |
Product / Variant Images
```

## 2. Application Boundaries

### Public application

Responsible for:

- Catalogue discovery
- SEO pages
- Product details
- Enquiry initiation
- Localized presentation

### Admin application

Responsible for:

- Catalogue CRUD
- Content management
- Enquiry management
- Site configuration
- User/role administration

### Domain layer

Contains reusable business rules:

- Product publication
- Variant generation/validation
- Attribute applicability
- Enquiry creation
- Translation completeness
- Slug generation
- Search/filter query construction

### Data layer

Contains:

- Drizzle schema
- Queries
- Repositories
- Transactions
- Database migrations

## 3. Public Routing

```text
/en
/en/products
/en/products/[slug]
/en/categories/[slug]
/en/categories/[category]/[subcategory]
/en/search
/en/about-us
/en/contact-us
/en/request-quote

/ar
/ar/products
/ar/products/[slug]
/ar/categories/[slug]
/ar/categories/[category]/[subcategory]
/ar/search
/ar/about-us
/ar/contact-us
/ar/request-quote
```

Admin routing can be outside public locale routing, for example:

```text
/admin
/admin/products
/admin/categories
/admin/attributes
/admin/enquiries
```

Admin is English-only initially.

## 4. Catalogue Relationships

```text
Category
  |
  +-- Subcategory
        |
        +-- Product
              |
              +-- Product Images
              +-- Product Specifications
              +-- Product Translations
              +-- Variant Combinations
                    |
                    +-- SKU
                    +-- Variant Values
                    +-- Variant Images
                    +-- Variant Specifications
```

## 5. Search

Initial search should use PostgreSQL capabilities.

Do not introduce Elasticsearch/Algolia/Meilisearch unless:

- Catalogue scale requires it,
- PostgreSQL search performance is demonstrated to be insufficient,
- and the migration is approved.

## 6. Caching / Revalidation

Public catalogue pages should be cacheable where safe.

Admin mutations should trigger targeted revalidation for affected:

- Product pages
- Category pages
- Homepage
- Sitemap/metadata

Avoid global cache invalidation for every mutation.

## 7. Error Boundaries

Provide:

- Global error boundary
- Route-level error states
- Not-found pages
- Loading states
- Empty states
- Form validation errors
- Admin operation feedback

## 8. Observability

Analytics is deferred, but technical error monitoring/logging should remain possible.

Do not build a business analytics dashboard in the initial release.
