# Changelog

## Phase 9
### Added
- Catalogue import confirmation and production-safe ingestion flow (R2 upload + DB transaction). (See `src/server/catalogue-import.ts`, `scripts/import-catalogue.ts`)
- Image normalization and conservative trimming using `sharp`. (`src/lib/image-normalize.ts`)
- Production readiness checks and guarded migration/bootstrap patterns. (`scripts/check-production-readiness.ts`, `docs/deployment.md`)

### Changed
- Product image handling: normalized image uploads to R2 and `publicUrl` canonicalization.
- CLI import tooling prefers `DIRECT_DATABASE_URL` and requires `IMPORT_CONFIRMATION` to modify remote DBs.

### Fixed
- Product-card framing and cropping issues by normalizing source images and adjusting public image components.

### Infrastructure
- R2-ready ingestion pipeline using the S3-compatible client and environment-driven configuration.

### Documentation
- Added import safety guidance and migration/application runbook entries to `docs/deployment.md`.

## Phase 8
### Added
- Security hardening (rate limiting, spam/honeypot, upload validation).
- Accessibility and responsive audits.

### Fixed
- Upload security checks and server-side session enforcement for admin actions.

## Phase 7
### Added
- SEO metadata framework: canonicals, hreflang, sitemap, robots, structured data for products.

### Fixed
- Consistent metadata generation across product and category pages.

## Phase 6 and earlier
- Foundation, database schema, admin features, public catalogue, and enquiry flows implemented during earlier phases. See `docs/project-state.md` and `specs/qasr-al-mabrook/tasks.md` for detailed task lists.

**Notes**
- Dates: Not recorded in many entries because repository history does not provide explicit dated release notes for all changes.
- This changelog is a high-level summary and does not duplicate every commit. Use `git log` for a full timeline.

**Documentation Rules**

- Do not duplicate every commit in this changelog.
- Use this document for project-level, meaningful changes only.
