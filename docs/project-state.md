# Qasr Al Mabrook - Project State

## Current Status

Phase 0 foundation is complete. Phase 1 design-system work is complete and validated. Phase 2 database implementation is complete and verified against the live Supabase Postgres instance, including schema generation, migration application, and deterministic seed setup.

## Last Completed

- TASK-001 through TASK-005 (Phase 0 repository foundation).
- Next.js 16 App Router + TypeScript + Tailwind CSS initialized.
- Prettier, ESLint, and TypeScript type checking configured.
- Module folder structure established under `src/`.
- Zod-based environment validation added (`src/config/env.ts`) and hardened to handle blank local env values as unset configuration.
- GitHub Actions CI workflow added (format, lint, typecheck, build).
- Supplied brand logo assets copied to `public/brand/`.
- TASK-100 Define design tokens completed with approved brand palette and shared CSS variables.
- TASK-101 Integrate final logo assets completed using the approved Qasr Al Mabrook brand files.
- TASK-102 Integrate final brand imagery completed using the approved background asset.
- TASK-103 through TASK-111 completed: typography, responsive layout primitives, buttons/links, form components, cards, navigation, footer, RTL foundations, and accessibility baseline.
- Phase 2 database foundation validated end-to-end: Supabase PostgreSQL connection configured, Drizzle setup completed, schema tables generated for admin, catalogue, content, settings, and enquiry flows, all foreign keys and constraints applied via migration, and a deterministic seed strategy added in `src/db/seed.ts`.

## Current Phase

Phase 2 - Database (Complete)

## Current Task

None; Phase 2 is complete and validated.

## Next Tasks

Phase 3 - Authentication/Admin has not started.

1. TASK-300 Implement authentication.

## Repository Structure

```text
src/
  app/                 # Next.js App Router routes
  components/
    ui/                # Shared UI primitives
    public/            # Public-site components
    admin/             # Admin console components
  config/              # Site config and env validation
  db/
    schema/            # Drizzle schema (Phase 2)
    migrations/        # Drizzle migrations (Phase 2)
  lib/                 # Shared utilities
  server/
    services/          # Domain/business logic
    repositories/      # Data access layer
  types/               # Shared TypeScript types
public/
  brand/               # Supplied brand assets
```

## Known Open Decisions

- Final deployment/hosting provider.
- Final email delivery provider.
- Final production domain canonical host (`www` vs root).
- Final production design tokens beyond interim brand reference.
- Final search ranking behavior.
- Final Arabic translation workflow/provider.
- Exact quote form fields.
- Supabase PostgreSQL connection credentials for local/staging.

## Deferred

- Analytics
- Pricing
- Stock
- Checkout/payments
- Customer accounts
- Product documents
- Admin Arabic

## Resume Instruction

Read this file and `specs/qasr-al-mabrook/tasks.md`, inspect the code, and continue from TASK-100 (design tokens).
