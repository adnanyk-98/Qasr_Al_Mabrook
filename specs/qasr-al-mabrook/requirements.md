# Qasr Al Mabrook - Requirements

## Requirement ID Convention

- `PUB` = Public website
- `ADM` = Admin
- `CAT` = Catalogue
- `SRCH` = Search
- `ENQ` = Enquiry
- `I18N` = Internationalization
- `SEO` = SEO
- `SEC` = Security
- `UX` = UX/accessibility
- `OPS` = Operations

## 1. Public Website

### PUB-001 - Home

The system shall provide a public homepage.

### PUB-002 - Product Catalogue

The system shall provide a browsable product catalogue.

### PUB-003 - Category Navigation

Users shall be able to browse products by category and subcategory.

### PUB-004 - Product Detail

Each published product shall have a dedicated detail page.

### PUB-005 - Product Variants

Where variants exist, users shall be able to select the applicable variant combination.

### PUB-006 - Variant Information

The selected variant shall display its relevant SKU, images and specifications where configured.

## 2. Search

### SRCH-001

Users shall be able to search the product catalogue.

### SRCH-002

Search shall consider configured searchable product fields.

### SRCH-003

Search results shall support pagination or an equivalent scalable result strategy.

### SRCH-004

Search state shall be represented in the URL where practical.

## 3. Filters

### SRCH-010

The system shall support dynamic filters.

### SRCH-011

Filters shall be derived from category/attribute configuration rather than hard-coded.

### SRCH-012

Filter combinations shall update results without requiring a full manual page workflow.

### SRCH-013

Filter URLs shall have explicit SEO/indexing rules.

## 4. Catalogue Administration

### CAT-001

Admins shall create/edit/archive categories.

### CAT-002

Admins shall create/edit/archive subcategories.

### CAT-003

Admins shall create/edit/archive brands.

### CAT-004

Admins shall create configurable attributes.

### CAT-005

Admins shall configure attribute values.

### CAT-006

Admins shall mark attributes as variant-defining.

### CAT-007

Admins shall mark attributes as filterable.

### CAT-008

Admins shall mark attributes as searchable.

### CAT-009

Admins shall create/edit/archive products.

### CAT-010

Admins shall assign products to categories.

### CAT-011

Admins shall assign brands to products.

### CAT-012

Admins shall manage product images.

### CAT-013

Admins shall create variant definitions.

### CAT-014

Admins shall create valid variant combinations.

### CAT-015

Each variant combination may have its own SKU.

### CAT-016

Each variant combination may have its own images.

### CAT-017

Each variant combination may have its own specifications.

### CAT-018

Admins shall manage product specifications.

### CAT-019

Admins shall publish/unpublish products.

## 5. Enquiries

### ENQ-001

Product pages shall provide Request Quote.

### ENQ-002

Request Quote shall prepopulate the selected product.

### ENQ-003

If a variant is selected, the enquiry shall capture the selected variant.

### ENQ-004

Submitted quote requests shall be stored in PostgreSQL.

### ENQ-005

Submitted quote requests shall appear in the admin console.

### ENQ-006

The business shall receive an email notification for new quote requests.

### ENQ-007

Product pages shall provide WhatsApp enquiry.

### ENQ-008

Product pages shall provide Call Sales.

### ENQ-009

Product pages shall provide Email Enquiry.

### ENQ-010

Email Enquiry shall open a pre-addressed/prepopulated email compose experience where supported.

### ENQ-011

Contact Us shall support a general enquiry form.

## 6. Admin

### ADM-001

Admin console shall require authentication.

### ADM-002

System shall support Super Admin and Admin roles.

### ADM-003

Authorization shall be enforced server-side.

### ADM-004

Super Admin shall manage administrators.

### ADM-005

Admins shall manage catalogue content according to role permissions.

### ADM-006

Admins shall manage quote requests.

### ADM-007

Admin UI shall be English-only initially.

## 7. Homepage/CMS

### ADM-020

Homepage shall be configurable by admins.

### ADM-021

Homepage sections shall be reorderable.

### ADM-022

Homepage sections shall support enable/disable.

### ADM-023

Homepage content shall support localized content where applicable.

## 8. Internationalization

### I18N-001

Public site shall support English.

### I18N-002

Public site shall support Arabic.

### I18N-003

Public URLs shall use `/en/...` and `/ar/...`.

### I18N-004

Arabic shall use RTL layout.

### I18N-005

Locale switching shall preserve the relevant page/context where a translation exists.

### I18N-006

Catalogue content shall support English and Arabic stored translations.

### I18N-007

Missing Arabic content shall have an explicit publication/fallback policy and must not silently create misleading SEO pages.

## 9. Responsive / Accessibility

### UX-001

Public website shall work on mobile, tablet and desktop.

### UX-002

No core feature shall depend on hover.

### UX-003

Interactive elements shall be keyboard accessible.

### UX-004

Forms shall have accessible labels and validation feedback.

### UX-005

Images shall support meaningful alt text.

### UX-006

Arabic RTL shall be tested independently.

## 10. SEO

### SEO-001

Public indexable pages shall have appropriate metadata.

### SEO-002

The site shall provide a dynamic XML sitemap.

### SEO-003

The site shall provide robots.txt.

### SEO-004

Canonical URLs shall be generated correctly.

### SEO-005

Localized pages shall expose correct language alternates/hreflang.

### SEO-006

Product pages shall support Product structured data where valid.

### SEO-007

Breadcrumbs shall support BreadcrumbList structured data where appropriate.

### SEO-008

Draft/unpublished/admin pages shall not be indexable.

### SEO-009

Search/filter URL indexing shall be explicitly controlled.

## 11. Security

### SEC-001

Passwords shall never be stored plaintext.

### SEC-002

Server-side authorization shall protect admin operations.

### SEC-003

All public form input shall be validated server-side.

### SEC-004

Uploads shall validate type, size and content expectations.

### SEC-005

Public enquiry endpoints shall have abuse/spam protection.

### SEC-006

Secrets shall never be committed to source control.

## 12. Deferred

### OPS-001

Analytics is deferred.

### OPS-002

Pricing is deferred.

### OPS-003

Stock management is deferred.

### OPS-004

Payments and checkout are deferred.
