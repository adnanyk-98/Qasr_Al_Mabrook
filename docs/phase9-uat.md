# Phase 9 Staging UAT Checklist

This checklist is evidence-driven. Do not mark data-dependent checks complete without approved staging data and external-service evidence.

## Environment and deployment

- [ ] Staging uses a separate deployment, database, R2 bucket, email recipient, and secret set.
- [ ] `npm ci` succeeds from the lockfile.
- [ ] Format check, lint, typecheck, tests, migration consistency check, and build pass.
- [ ] Existing migrations are applied through the guarded deployment step.
- [ ] Initial Super Admin bootstrap is run once with explicit confirmation and protected credentials.
- [ ] Application rollback procedure is documented and tested.

## Public routes and localization

- [ ] `/en` renders successfully.
- [ ] `/ar` renders successfully.
- [ ] English is LTR and Arabic is RTL.
- [ ] Locale switching preserves context where localized content exists.
- [ ] Mobile navigation and keyboard access work.

## Catalogue data

- [ ] Approved published English product exists.
- [ ] Approved published Arabic product translation exists or fallback policy is verified.
- [ ] Published category and translations render.
- [ ] Product detail renders.
- [ ] Variants, SKUs, specifications, and variant images render where configured.
- [ ] Product gallery and image delivery work through the approved image/R2 strategy.
- [ ] Search, filters, and pagination return correct results.
- [ ] Draft and archived records remain unavailable publicly.

## Enquiries and administration

- [ ] Request Quote validates valid and invalid input.
- [ ] Contact form validates valid and invalid input.
- [ ] Quote request persists in the staging database.
- [ ] Product and selected variant context is preserved.
- [ ] Email notification succeeds with the staging provider/recipient.
- [ ] Email failure is recorded safely.
- [ ] Unauthenticated admin access redirects to login.
- [ ] Authorized admin access works.
- [ ] Role and mutation authorization are verified server-side.
- [ ] Rate limiting and honeypot behavior are verified.

## SEO and platform hardening

- [ ] Canonical URLs use the final HTTPS staging origin.
- [ ] Hreflang links are correct and reciprocal.
- [ ] Sitemap contains only eligible public records.
- [ ] Robots rules are correct.
- [ ] Product structured data is valid for published products.
- [ ] Security headers are present.
- [ ] Error, loading, empty, and not-found states are safe.

## Operations and recovery

- [ ] Database backup policy is configured.
- [ ] Restore succeeds into an isolated environment.
- [ ] Application error reporting is visible to the operational owner.
- [ ] Database connectivity failures are detectable.
- [ ] Email delivery failures are detectable.
- [ ] Deployment failure and rollback are tested.

## Approval

- UAT owner: ____________________
- Review date: __________________
- Open issues: __________________
- Approval: _____________________
