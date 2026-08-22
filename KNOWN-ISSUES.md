# Known Issues (audit 2026-08-22)

These are current, valid limitations discovered or confirmed during the recent full website audit.

- Development lint issues exist in helper/audit scripts (`scripts/*`) — CommonJS `require()` usage, `any` types, and a few ESLint rule violations. Status: NOT FIXED (development-only).
- Full keyboard-only accessibility audit has not been performed; a focused a11y pass remains pending.
- Some product image `alt` text values are missing in the catalogue data; content team action required to populate `altTextEn` / `altTextAr`.
- SMTP / end-to-end email delivery was not tested because development SMTP credentials are not configured in `.env.local`.
- Some source images in R2 are high resolution and may benefit from production image optimization (recommendation only).
- Deep admin editing UX (translations/images/variants/specifications prefill and in-place editing) remains incomplete and is pending separate implementation work.
