# Qasr Al Mabrook - Engineering Patterns

## 1. General Rule

Prefer boring, explicit and maintainable code over clever abstractions.

## 2. Server First

Default to Server Components and server-side data access.

Use Client Components only when browser interactivity requires them.

## 3. Layering

Recommended:

```text
UI
 ↓
Server Action / Route Handler
 ↓
Service
 ↓
Repository
 ↓
Drizzle
 ↓
PostgreSQL
```

Not every trivial read needs every layer, but business rules must not be scattered across UI components.

## 4. Validation

Validate at the boundary.

A value must be validated:

- At public API/form boundaries.
- At admin form boundaries.
- At important service boundaries.

Database constraints remain the final integrity layer.

## 5. Reusable Components

Before creating a new component:

1. Search existing components.
2. Extend existing component if appropriate.
3. Avoid duplicate variants with nearly identical behavior.

## 6. Forms

Forms should have:

- Schema validation
- Server-side validation
- Clear errors
- Pending state
- Success state
- Accessible labels

## 7. Errors

Use typed/domain errors where useful.

Do not expose internal database errors to users.

## 8. Data Fetching

Avoid:

- Fetching the same data repeatedly in nested components.
- Unnecessary client-side waterfalls.
- N+1 queries.

Prefer explicit joins/queries and appropriate caching.

## 9. Mutations

Mutations should:

1. Authenticate.
2. Authorize.
3. Validate.
4. Execute transactionally where needed.
5. Revalidate affected content.
6. Return a safe result.

## 10. Slugs

Slugs should be:

- Human readable
- Stable
- Unique within the required scope

Changing a published slug should require redirect handling.

## 11. Localization

Do not embed English strings directly into reusable public UI components.

Do not use translated UI strings as database identifiers.

## 12. RTL

Use logical CSS properties.

Avoid hard-coded left/right positioning.

## 13. Images

All product images should have:

- Storage reference
- Dimensions where available
- Alt text
- Ordering
- Primary-image state

## 14. Database

Never use database schema as a substitute for application domain documentation.

All migrations must be committed.

## 15. Tests

Prioritize tests around:

- Variant combination validation
- Authorization
- Quote submission
- Translation routing
- Search/filter correctness
- Publication rules
- Slug uniqueness
