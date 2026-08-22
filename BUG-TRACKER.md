# BUG-TRACKER

Record of genuine issues discovered during the 2026-08-22 full website audit.

### LINT-ADMIN-LINKS
- Severity: Low
- Problem: Internal admin navigation used HTML anchors and violated the Next.js `no-html-link-for-pages` lint rule.
- Fix: Replaced HTML anchors with `next/link` `Link` in `src/app/(admin)/admin/products/page.tsx`.
- Status: FIXED
- Regression: `npm run lint` — the specific Next.js anchor lint errors were resolved.

### LINT-SCRIPTS
- Severity: Low
- Problem: Several development and audit scripts contain lint violations (CommonJS `require()` usage, `any` types, `@ts-ignore` vs `@ts-expect-error`).
- Status: KNOWN / NOT FIXED
- Reason: These are development-only scripts that do not affect runtime production behavior. They remain documented for future cleanup.

### OVERFLOW-HONEYPOT
- Severity: Informational
- Problem: Automated viewport overflow detection reported very large `scrollWidth` on Arabic request/contact pages.
- Root cause: Intentional off-screen honeypot inputs use large negative left offsets (e.g. `-left-[9999px]`) for spam protection; these influence document scroll metrics.
- Status: NOT A BUG (intentional)
- Action: Documented and accepted; do not modify honeypot placement purely to satisfy automated overflow checks.
