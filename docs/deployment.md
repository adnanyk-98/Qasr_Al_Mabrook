# Qasr Al Mabrook - Deployment Configuration

## 1. Deployment Status

Deployment provider is **not yet finalized**.

The application should remain portable across a standard Node/Next.js hosting environment.

## 2. Recommended Production Components

```text
qasralmabrook.com
      |
      v
Next.js Hosting
      |
      +---- Supabase PostgreSQL
      |
      +---- Cloudflare R2
      |
      +---- Email Provider
```

## 3. Environment Separation

Maintain:

- Local development
- Staging/preview
- Production

Never use production secrets in local development.

## 4. Required Configuration Categories

### Application

- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`

### Database

- `DATABASE_URL`
- migration/direct connection variable if required

### R2

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

### Email

- `EMAIL_FROM`
- `EMAIL_TO`
- Provider-specific credentials

## 5. Build

Production build must:

1. Install locked dependencies.
2. Run type checks.
3. Run linting.
4. Run tests.
5. Build Next.js.
6. Run approved migrations through a controlled deployment step.

Do not automatically perform destructive database migrations during a web-server boot.

### Repository readiness commands

These commands do not select a provider or contact production services:

```text
npm run readiness:check -- --stage=local
npm run db:migration:check
npm test
npm run typecheck
npm run lint
npm run build
```

The readiness checker accepts `local`, `staging`, or `production`. Staging and production require HTTPS, database, authentication, R2, and SMTP configuration. It validates configuration only; it does not test connectivity or deploy anything.

Migration application is explicitly guarded and must be run as a separate deployment step:

```text
DEPLOYMENT_STAGE=staging MIGRATION_CONFIRMATION=APPLY_MIGRATIONS npm run db:migration:apply
```

The web server must never run this command automatically. The initial administrator bootstrap is also explicit:

```text
DEPLOYMENT_STAGE=staging ADMIN_BOOTSTRAP_CONFIRMATION=BOOTSTRAP_ADMIN npm run db:bootstrap-admin
```

Use injected staging/production environment variables or an explicitly selected dotenv path. Never place credentials in repository files.

## 6. Database Migrations

Use Drizzle migrations.

Recommended deployment order:

1. Deploy backward-compatible schema.
2. Deploy application code.
3. Backfill if required.
4. Remove obsolete fields only after code no longer depends on them.

## 7. R2

Production should use a dedicated production bucket.

Recommended separation:

- `qasr-al-mabrook-dev`
- `qasr-al-mabrook-staging`
- `qasr-al-mabrook-prod`

Exact bucket strategy can be adjusted based on Cloudflare account/operational requirements.

## 8. Domain

Production domain:
`qasralmabrook.com`

Recommended:

- Root domain
- `www` handling decision
- One canonical host
- HTTP → HTTPS
- Correct DNS records

The final canonical host must be selected before launch.

## 9. CI/CD

CI should run:

- TypeScript checks
- Lint
- Unit/integration tests
- Build
- Migration validation where appropriate

Preview deployments should use isolated/non-production data.

The repository CI baseline now runs formatting, lint, typecheck, tests, migration consistency validation, and build. Provider-specific deployment, promotion, preview isolation, approvals, and rollback remain blocked until a hosting provider is selected.

## 10. Backups

Production database must have a tested backup/recovery strategy.

Do not consider provider-level backup availability sufficient until restoration has been tested.

## 11. Monitoring

Analytics is deferred.

Technical monitoring should still cover:

- Application errors
- Failed deployments
- Database connectivity
- Enquiry email failures
- Critical background operations

## 12. Rollback

Every production deployment should have a rollback strategy.

Database rollback is not always equivalent to application rollback; migrations must be designed with this in mind.

## 13. Go-Live Checklist

- [ ] Production environment variables configured
- [ ] Database migration complete
- [ ] Seed/admin bootstrap complete
- [ ] R2 configured
- [ ] Email notifications tested
- [ ] Domain configured
- [ ] HTTPS verified
- [ ] Sitemap verified
- [ ] Robots verified
- [ ] Canonicals verified
- [ ] Hreflang verified
- [ ] Arabic RTL verified
- [ ] Quote submission verified
- [ ] Admin authorization verified
- [ ] Backups verified
- [ ] Error monitoring verified
- [ ] UAT approved
