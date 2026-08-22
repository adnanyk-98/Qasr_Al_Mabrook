# Known Issues

This file documents known limitations and deferred items that are not classified as bugs.

## KI-001 — Deployment provider & production infrastructure not finalised
- Status: KNOWN
- Priority: P0
- Area: Infrastructure
- Introduced: Not recorded
- Related phase: Phase 9
- Planned resolution: Select hosting provider, provision staging and production, and complete provider-specific deployment runbook.

### Description
The repository groundwork for production is prepared, but a production hosting provider and canonical host are not yet selected.

### Why It Exists
Deployment choices were deferred to avoid locking platform-specific configuration while the application implementation matured.

### Impact
- Cannot complete runbook steps that require a live production environment (DNS, HTTPS, backups, monitoring).
- Some readiness checks and migration application flows cannot be validated end-to-end.

### Workaround
Use local or ephemeral staging environments and run the repository readiness checks in `local` mode.

### Resolution Criteria
Provider selected, staging/prod deployed, and `Go-Live` checklist (docs/deployment.md) marked complete.

---

## KI-002 — Production R2 bucket not configured
- Status: KNOWN
- Priority: P0
- Area: Images | R2 | Infrastructure
- Introduced: Not recorded
- Related phase: Phase 9 (TASK-902)
- Planned resolution: Provision dedicated R2 buckets for staging and production and update environment variables.

### Description
The codebase supports Cloudflare R2 for product image storage, but production buckets and credentials are not yet provisioned.

### Why It Exists
R2 provisioning is a deployment-time decision and was left for the hosting selection step.

### Impact
- Imports and image delivery may be run only against development or staging buckets until production credentials are provided.
- Chosen bucket naming and public URL strategy requires finalization to ensure canonical public image URLs.

### Workaround
Use development R2 bucket credentials or local file references for testing; ensure `R2_PUBLIC_BASE_URL` is set for public previews.

### Resolution Criteria
Production bucket and credentials provisioned and validated by the readiness scripts.

---

## KI-003 — Development database content limitations (translations, published records)
- Status: KNOWN
- Priority: P1
- Area: Database | i18n
- Introduced: Not recorded
- Related phase: Phase 6 data verification
- Planned resolution: Seed or backfill production-accurate translations and published catalogue content into staging/prod sample dataset.

### Description
The development database lacks fully populated published translated catalogue records, which limits end-to-end translation and SEO verification.

### Why It Exists
Sample/demo data is intentionally limited in development to avoid shipping production content and credentials.

### Impact
Certain verification steps (translation rendering, hreflang completeness) cannot be fully validated on local/dev environments.

### Workaround
Run manual seeds or import a sanitized sample dataset that includes English and Arabic translations for testing.

### Resolution Criteria
A reproducible seed/backfill process exists and staging contains representative translated content.

---

## KI-004 — Super Admin end-to-end route missing for validation
- Status: KNOWN
- Priority: P2
- Area: Admin | Security
- Introduced: Not recorded
- Related phase: Phase 3 (TASK-302)
- Planned resolution: Add a dedicated Super Admin validation route or provide a documented runtime validation command for bootstrap testing.

### Description
Server-side role enforcement is implemented, but there is no dedicated Super Admin-only route for end-to-end runtime validation without adding synthetic routes.

### Why It Exists
Avoided creating special-case runtime routes for testing that would complicate production surface area.

### Impact
End-to-end Super Admin bootstrapping must rely on logs, deterministic seed behavior, or manual queries rather than a single validation route.

### Workaround
Run the admin bootstrap script and validate user records in the database directly.

### Resolution Criteria
A safe validation path (route or CLI) is provided for Super Admin end-to-end verification.

---

**Documentation Rules**

- Never invent issues.
- Do not label intentional architecture decisions as problems.
- Do not include speculative issues.
- Reference related `BUG-` and `FIX-` IDs where applicable.
- Use `KI-` stable IDs for entries.
