# Fix Log

Summary of fixes applied during the recent development cycle (audit 2026-08-22).

### R2 Image Migration
- Migrated product image references to R2 public URLs.
- Ensured database `publicUrl` points to R2 and projection code reads R2 `publicUrl` as authoritative.
- Removed dependence on local `/catalogue/...` image references in projections and UI.
- Verified R2 URLs on homepage and product pages.

### Product Gallery
- Removed duplicate image rendering and filtered invalid/local image references.
- Deduplicated gallery images and sorted by `sortOrder` with `isPrimary` preference.
- Fixed thumbnail click behavior and hover preview behavior; preserved selected state and `object-contain` display.

### Image Normalization
- Implemented image normalization (trimming/resizing) in the ingestion pipeline for imported product images and stored normalized width/height.

### Primary Images
- Ensured exactly one primary image per published product via projection and DB-consistent checks; normalized image ordering.

### Admin Archived Records
- Editing archived products and categories now preserves `ARCHIVED` status unless explicitly changed by an admin action.

### Admin Editing
- Added a conservative inline/basic product edit UX with main-field prefill and product translation/image list panels.
- Replaced internal admin anchors with `next/link` `Link` to satisfy Next.js linting and navigation behavior.

### Phase 7 SEO
- Confirmed metadata, canonical, hreflang, sitemap, robots, structured data, and `noindex` filtering behaviors are present and working as designed.

### Phase 8 Hardening
- Authorization enforced for admin server actions, rate limiting for public submissions, honeypot spam protection, and security headers implemented.

### Phase 9 Groundwork
- Added readiness/checker tooling, guarded migration commands, bootstrap guards, tests, and CI quality gates; deployment and infra tasks remain external.
