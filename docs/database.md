# Qasr Al Mabrook - Detailed Database Schema

## 1. Database Principles

Database: PostgreSQL on Supabase.

ORM: Drizzle ORM.

Use normalized relational structures for core catalogue data. JSON/JSONB may be used for genuinely flexible display/configuration data, but should not replace relational modeling where querying, filtering or integrity is required.

## 2. Entity Overview

```text
admin_users
admin_sessions
admin_roles

categories
category_translations
category_closure / hierarchy strategy
brands
brand_translations

attributes
attribute_translations
attribute_values
attribute_value_translations
category_attributes

products
product_translations
product_categories
product_attributes
product_attribute_values

product_images

variant_definitions
variant_combinations
variant_combination_values
variant_images

specification_definitions
specification_translations
product_specifications
variant_specifications

homepage_sections
static_pages
site_settings

quote_requests
quote_request_items
quote_request_notifications
```

## 3. ID Strategy

Use UUID primary keys.

Recommended:

- `id uuid primary key default gen_random_uuid()`
- Foreign keys use matching UUID type.

## 4. Admin Users

### `admin_users`

| Column        | Type        | Rules                  |
| ------------- | ----------- | ---------------------- |
| id            | uuid        | PK                     |
| email         | varchar     | unique, required       |
| password_hash | text        | required               |
| display_name  | varchar     | required               |
| role          | enum        | `SUPER_ADMIN`, `ADMIN` |
| status        | enum        | `ACTIVE`, `DISABLED`   |
| last_login_at | timestamptz | nullable               |
| created_at    | timestamptz | required               |
| updated_at    | timestamptz | required               |

Do not store plaintext passwords.

### `admin_sessions`

Use secure, revocable sessions.

| Column        | Type                 |
| ------------- | -------------------- |
| id            | uuid PK              |
| admin_user_id | uuid FK              |
| token_hash    | text unique          |
| expires_at    | timestamptz          |
| created_at    | timestamptz          |
| revoked_at    | timestamptz nullable |

## 5. Categories

### `categories`

| Column     | Type             | Rules                                      |
| ---------- | ---------------- | ------------------------------------------ |
| id         | uuid PK          |                                            |
| parent_id  | uuid FK nullable | self-reference                             |
| slug       | varchar          | unique among appropriate locale/path scope |
| status     | enum             | DRAFT/PUBLISHED/ARCHIVED                   |
| sort_order | integer          |                                            |
| created_at | timestamptz      |                                            |
| updated_at | timestamptz      |                                            |

Use `parent_id` for category/subcategory hierarchy.

Do not hard-code only two levels. The UI can initially expose Category/Subcategory while the model remains extensible.

### `category_translations`

| Column          | Type             |
| --------------- | ---------------- |
| id              | uuid PK          |
| category_id     | uuid FK          |
| locale          | enum `en/ar`     |
| name            | varchar          |
| description     | text nullable    |
| seo_title       | varchar nullable |
| seo_description | text nullable    |
| created_at      | timestamptz      |
| updated_at      | timestamptz      |

Unique: `(category_id, locale)`.

## 6. Brands

### `brands`

| Column        | Type          |
| ------------- | ------------- |
| id            | uuid PK       |
| slug          | varchar       |
| status        | enum          |
| logo_image_id | uuid nullable |
| created_at    | timestamptz   |
| updated_at    | timestamptz   |

### `brand_translations`

| Column          | Type             |
| --------------- | ---------------- |
| id              | uuid PK          |
| brand_id        | uuid FK          |
| locale          | en/ar            |
| name            | varchar          |
| description     | text nullable    |
| seo_title       | varchar nullable |
| seo_description | text nullable    |

Unique: `(brand_id, locale)`.

## 7. Attributes

### `attributes`

| Column              | Type           |
| ------------------- | -------------- |
| id                  | uuid PK        |
| code                | varchar unique |
| data_type           | enum           |
| is_variant_defining | boolean        |
| is_filterable       | boolean        |
| is_searchable       | boolean        |
| sort_order          | integer        |
| status              | enum           |
| created_at          | timestamptz    |
| updated_at          | timestamptz    |

Initial data types:

- TEXT
- NUMBER
- BOOLEAN
- SELECT
- MULTI_SELECT
- COLOR

### `attribute_translations`

| Column       | Type    |
| ------------ | ------- |
| id           | uuid PK |
| attribute_id | uuid FK |
| locale       | en/ar   |
| name         | varchar |

Unique: `(attribute_id, locale)`.

### `attribute_values`

| Column        | Type             |
| ------------- | ---------------- |
| id            | uuid PK          |
| attribute_id  | uuid FK          |
| code          | varchar          |
| raw_value     | varchar          |
| numeric_value | numeric nullable |
| sort_order    | integer          |
| status        | enum             |

### `attribute_value_translations`

| Column             | Type    |
| ------------------ | ------- |
| id                 | uuid PK |
| attribute_value_id | uuid FK |
| locale             | en/ar   |
| label              | varchar |

Unique: `(attribute_value_id, locale)`.

## 8. Category Attribute Configuration

### `category_attributes`

| Column       | Type    |
| ------------ | ------- |
| category_id  | uuid FK |
| attribute_id | uuid FK |
| is_required  | boolean |
| sort_order   | integer |

Composite PK: `(category_id, attribute_id)`.

This determines which attributes are relevant to a category and therefore drives dynamic filters and product forms.

## 9. Products

### `products`

| Column           | Type                          |
| ---------------- | ----------------------------- |
| id               | uuid PK                       |
| slug             | varchar                       |
| brand_id         | uuid nullable                 |
| status           | enum DRAFT/PUBLISHED/ARCHIVED |
| default_sku      | varchar nullable              |
| primary_image_id | uuid nullable                 |
| published_at     | timestamptz nullable          |
| created_at       | timestamptz                   |
| updated_at       | timestamptz                   |

No price or stock columns in the initial model.

### `product_translations`

| Column            | Type             |
| ----------------- | ---------------- |
| id                | uuid PK          |
| product_id        | uuid FK          |
| locale            | en/ar            |
| name              | varchar          |
| short_description | text nullable    |
| description       | text nullable    |
| seo_title         | varchar nullable |
| seo_description   | text nullable    |
| created_at        | timestamptz      |
| updated_at        | timestamptz      |

Unique: `(product_id, locale)`.

### `product_categories`

| Column      | Type    |
| ----------- | ------- |
| product_id  | uuid FK |
| category_id | uuid FK |
| is_primary  | boolean |

Composite PK: `(product_id, category_id)`.

## 10. Product Attribute Values

### `product_attribute_values`

| Column             | Type             |
| ------------------ | ---------------- |
| id                 | uuid PK          |
| product_id         | uuid FK          |
| attribute_id       | uuid FK          |
| attribute_value_id | uuid nullable    |
| text_value         | text nullable    |
| numeric_value      | numeric nullable |
| boolean_value      | boolean nullable |

Exactly one suitable value representation should be populated according to `attributes.data_type`.

This table supports non-variant product-level attributes and filtering.

## 11. Product Images

### `product_images`

| Column      | Type             |
| ----------- | ---------------- |
| id          | uuid PK          |
| product_id  | uuid FK          |
| object_key  | text             |
| public_url  | text             |
| alt_text_en | text nullable    |
| alt_text_ar | text nullable    |
| width       | integer nullable |
| height      | integer nullable |
| sort_order  | integer          |
| is_primary  | boolean          |
| created_at  | timestamptz      |

Do not store image binaries in PostgreSQL.

## 12. Variant Definitions

A product can select which category attributes define its variants.

### `variant_definitions`

| Column       | Type    |
| ------------ | ------- |
| id           | uuid PK |
| product_id   | uuid FK |
| attribute_id | uuid FK |
| sort_order   | integer |

Unique: `(product_id, attribute_id)`.

Example:

- Size
- Color

## 13. Variant Combinations

### `variant_combinations`

| Column     | Type        |
| ---------- | ----------- |
| id         | uuid PK     |
| product_id | uuid FK     |
| sku        | varchar     |
| status     | enum        |
| created_at | timestamptz |
| updated_at | timestamptz |

SKU should be unique within the business catalogue.

### `variant_combination_values`

| Column                 | Type    |
| ---------------------- | ------- |
| variant_combination_id | uuid FK |
| attribute_id           | uuid FK |
| attribute_value_id     | uuid FK |

Composite PK:
`(variant_combination_id, attribute_id)`.

Application/database validation must prevent duplicate combinations for the same product.

## 14. Variant Images

### `variant_images`

| Column                 | Type             |
| ---------------------- | ---------------- |
| id                     | uuid PK          |
| variant_combination_id | uuid FK          |
| object_key             | text             |
| public_url             | text             |
| alt_text_en            | text nullable    |
| alt_text_ar            | text nullable    |
| width                  | integer nullable |
| height                 | integer nullable |
| sort_order             | integer          |
| is_primary             | boolean          |
| created_at             | timestamptz      |

## 15. Specifications

### `specification_definitions`

| Column     | Type                     |
| ---------- | ------------------------ |
| id         | uuid PK                  |
| code       | varchar unique           |
| data_type  | enum TEXT/NUMBER/BOOLEAN |
| sort_order | integer                  |
| status     | enum                     |

### `specification_translations`

| Column                      | Type    |
| --------------------------- | ------- |
| id                          | uuid PK |
| specification_definition_id | uuid FK |
| locale                      | en/ar   |
| name                        | varchar |

### `product_specifications`

| Column                      | Type             |
| --------------------------- | ---------------- |
| product_id                  | uuid FK          |
| specification_definition_id | uuid FK          |
| value_text                  | text nullable    |
| value_numeric               | numeric nullable |
| value_boolean               | boolean nullable |
| sort_order                  | integer          |

### `variant_specifications`

Same structure, referencing `variant_combination_id`.

## 16. Homepage / CMS

### `homepage_sections`

| Column             | Type         |
| ------------------ | ------------ |
| id                 | uuid PK      |
| section_type       | varchar/enum |
| status             | enum         |
| sort_order         | integer      |
| configuration_json | jsonb        |
| created_at         | timestamptz  |
| updated_at         | timestamptz  |

Use typed validation for each section type. JSONB is appropriate for section-specific configuration, not core catalogue data.

### `static_pages`

| Column     | Type        |
| ---------- | ----------- |
| id         | uuid PK     |
| slug       | varchar     |
| status     | enum        |
| created_at | timestamptz |
| updated_at | timestamptz |

### `static_page_translations`

| Column          | Type             |
| --------------- | ---------------- |
| id              | uuid PK          |
| static_page_id  | uuid FK          |
| locale          | en/ar            |
| title           | varchar          |
| body            | text             |
| seo_title       | varchar nullable |
| seo_description | text nullable    |

## 17. Site Settings

### `site_settings`

| Column     | Type           |
| ---------- | -------------- |
| id         | uuid PK        |
| key        | varchar unique |
| value_json | jsonb          |
| updated_at | timestamptz    |

Only approved keys should be writable by the admin UI.

Potential settings:

- Business phone
- WhatsApp number
- Business email
- Address
- Social links
- SEO defaults
- Enquiry recipients

## 18. Quote Requests

### `quote_requests`

| Column           | Type                 |
| ---------------- | -------------------- |
| id               | uuid PK              |
| reference_number | varchar unique       |
| customer_name    | varchar              |
| customer_email   | varchar              |
| customer_phone   | varchar              |
| company_name     | varchar nullable     |
| city             | varchar nullable     |
| country          | varchar nullable     |
| message          | text nullable        |
| status           | enum                 |
| source           | enum PRODUCT/CONTACT |
| created_at       | timestamptz          |
| updated_at       | timestamptz          |

Initial statuses:

- NEW
- IN_PROGRESS
- RESPONDED
- CLOSED
- SPAM

### `quote_request_items`

| Column                 | Type             |
| ---------------------- | ---------------- |
| id                     | uuid PK          |
| quote_request_id       | uuid FK          |
| product_id             | uuid FK nullable |
| variant_combination_id | uuid FK nullable |
| product_name_snapshot  | varchar          |
| sku_snapshot           | varchar nullable |
| quantity               | integer nullable |
| notes                  | text nullable    |

Store snapshots so historical enquiries remain understandable even if product names change.

## 19. Quote Notifications

### `quote_request_notifications`

| Column              | Type                 |
| ------------------- | -------------------- |
| id                  | uuid PK              |
| quote_request_id    | uuid FK              |
| channel             | EMAIL                |
| status              | PENDING/SENT/FAILED  |
| recipient           | varchar              |
| provider_message_id | varchar nullable     |
| error_message       | text nullable        |
| attempted_at        | timestamptz nullable |
| created_at          | timestamptz          |

## 20. Indexing

Index at minimum:

- Published product status.
- Product slug.
- Category parent/status.
- Category slug.
- Product-category relationship.
- Attribute filter relationships.
- Variant SKU.
- Product SKU.
- Quote reference.
- Quote status/date.
- Translation locale/entity combinations.

Use PostgreSQL full-text/trigram indexes only after confirming the selected search strategy.

## 21. Migration Rules

- All schema changes through versioned Drizzle migrations.
- Never manually modify production schema without recording the migration.
- Destructive migrations require explicit approval.
- Seed data must be deterministic and safe to rerun.
