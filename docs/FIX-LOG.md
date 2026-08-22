# Fix Log

This file records significant fixes implemented during development. Follow Documentation Rules at the bottom of the file.

## FIX-001 — SEO metadata and hreflang correctness
- Date: Not recorded
- Bug ID: Not recorded
- Phase: Phase 7
- Area: SEO
- Status: VERIFIED

### Problem
Canonical and hreflang metadata were incomplete or inconsistent across locales causing SEO and indexing issues.

### Root Cause
Metadata generation was not consistently applied across all public routes and some fallback logic missed locale-specific variants.

### Fix
Implemented reusable metadata helpers in `src/lib/seo.ts` and updated product/category pages to use the unified metadata API. Ensured `alternates.canonical` and `alternates.languages` are set consistently.

### Files Changed
- src/lib/seo.ts
- src/app/[locale]/... (product & category pages)
- docs/phase9-uat.md (metadata/validation steps)

### Validation
- `npm run typecheck` and `npm run build` passed.
- Manual verification of generated canonical and hreflang tags on product and category pages.

### Regression Notes
Keep metadata generation centralized; avoid duplicating canonical logic in individual pages.

### Related Issues
- KI-003 (data limitations affecting metadata verification)

---

## FIX-002 — Guarded migrations and admin bootstrap
- Date: Not recorded
- Bug ID: Not recorded
- Phase: Phase 9
- Area: Database | Infrastructure
- Status: VERIFIED

### Problem
Automatic execution of destructive migrations and bootstrap steps during server start risked accidental data loss in non-controlled environments.

### Root Cause
Deployment scripts and commands could be invoked without explicit confirmation tokens.

### Fix
Added guarded migration and admin bootstrap confirmations in `docs/deployment.md` and the guarded invocation patterns for migrations/bootstraps. Added environment validation and readiness checks in `scripts/check-production-readiness.ts` and related guards in the codebase.

### Files Changed
- docs/deployment.md
- scripts/check-production-readiness.ts
- src/config/env.ts

### Validation
- Readiness check runs without contacting production services in `local` mode.
- Manual validation that migrations require explicit `MIGRATION_CONFIRMATION` to run.

### Regression Notes
Do not remove confirmation checks; only allow migration application from a guarded CI/CD promotion step.

---

## FIX-003 — Catalogue import: normalization, R2 upload, and idempotent DB writes
- Date: Not recorded
- Bug ID: Not recorded
- Phase: Phase 9 (catalogue import work)
- Area: Catalogue | Images | R2 | Database
- Status: VERIFIED

### Problem
Local catalogue imports previously relied on local `/catalogue/` image URLs, lacked normalization (causing visible whitespace and cropping issues), risked duplicate uploads, and could accidentally write to remote DBs without explicit confirmation.

### Root Cause
Import tooling did not normalize whitespace in source images, had no idempotent upload strategy, and lacked runtime safety checks for remote DB URLs.

### Fix
- Added `src/lib/image-normalize.ts` to analyze and conservatively trim image whitespace using `sharp`.
- Implemented `src/server/catalogue-import.ts` for confirmed imports: normalizes buffers, uploads to Cloudflare R2 via S3-compatible API, uses `HeadObjectCommand` to avoid duplicate uploads, and performs idempotent DB upserts within a transaction.
- Added CLI safety: `scripts/import-catalogue.ts` prefers `DIRECT_DATABASE_URL` and requires `IMPORT_CONFIRMATION=APPLY_CATALOGUE_IMPORT` to write to non-local DBs.
- Added tests: `tests/catalogue-import-safety.test.ts`, `tests/r2-key.test.ts`.

### Files Changed
- src/lib/image-normalize.ts
- src/lib/catalogue-import.ts
- src/server/catalogue-import.ts
- scripts/import-catalogue.ts
- src/config/env.ts (IMPORT_CONFIRMATION)
- package.json (sharp dependency)
- tests/catalogue-import-safety.test.ts
- tests/r2-key.test.ts

### Validation
- Dry-run import reports normalized dimensions and planned R2 keys.
- Confirmed import completed: R2 uploads and DB writes performed in a transaction; idempotency checks validate runs do not duplicate.
- Test suite includes import safety checks.

### Regression Notes
- Ensure `IMPORT_CONFIRMATION` is present when running confirmed imports against remote DBs.
- Normalization is conservative; ambiguous images fall back to original buffer.

---

## FIX-004 — Product-card image framing / cropping fix
- Date: Not recorded
- Bug ID: Not recorded
- Phase: Phase 8 → Phase 9 follow-up
- Area: UI | Images
- Status: VERIFIED

### Problem
Product images containing whitespace were visually cropped or misframed on product cards causing poor UX.

### Root Cause
Source images included whitespace which `object-fit` and the card layout exposed, leading to unintended framing.

### Fix
- Normalized source images on import (see FIX-003) and adjusted public image rendering components to use conservative `object-contain` layout where appropriate: `src/components/public/public-image-slot.tsx` and `src/components/public/product-card.tsx`.

### Files Changed
- src/components/public/public-image-slot.tsx
- src/components/public/product-card.tsx
- src/lib/image-normalize.ts

### Validation
- Manual inspection of product listing and detail pages after import shows correctly framed images.

### Regression Notes
- Keep `object-contain object-center` presentation for product cards and prefer normalized source images.

---

**Documentation Rules**

- Never invent fixes.
- Include `Date` as `Not recorded` when the repository does not provide an exact date.
- Keep historical fixes intact; append new fixes rather than editing past entries except to add verification notes.
- Reference related `BUG-` and `KI-` IDs where relevant.
