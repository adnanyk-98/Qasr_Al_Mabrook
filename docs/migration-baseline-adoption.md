# Migration Baseline Adoption

## Current state

Staging contains the effective schema produced by migrations `0000` through `0003`, but the Drizzle migration history table is absent. The repository journal now contains a deliberate canonical lineage for `0000` through `0004`, while SQL files `0000` through `0004` remain unchanged. Running `drizzle-kit migrate` against staging before baseline adoption would still attempt to replay the unconditional baseline DDL in `0000`.

## Phase 1: read-only qualification

Run the verifier against the explicitly selected staging environment:

```powershell
$env:MIGRATION_ALLOW_DATABASE_URL_FALLBACK="true"; npm run db:migration:verify-baseline
```

The verifier must report `PASS` for:

- every table and enum expected by `0000`
- category image columns from `0001`
- the category translation unique index from `0002`
- brand columns from `0003`
- absence of `homepage_deals`
- absence of an existing Drizzle migration-history table

It uses SSL-required read-only catalog queries. It never creates tables, writes migration rows, changes data, or alters schema.

## Phase 2: baseline review

### Drizzle history format

Drizzle ORM `0.45.2` / Drizzle Kit `0.31.10` stores PostgreSQL migration history in the `drizzle` schema and `__drizzle_migrations` table:

```sql
id serial primary key,
hash text not null,
created_at bigint
```

For each journal entry, Drizzle reads the SQL file named by `tag`, computes `sha256(exact_sql_file_text)` for `hash`, and uses the journal entry's `when` value for `created_at`. The migration runner compares the latest `created_at` with each journal entry's `when` value before executing SQL.

The repository now carries a canonical journal lineage for `0000` through `0004`. The `0000` value is historical; the values for `0001` through `0004` are deliberately assigned canonical sequence values for this repository and are not claimed to be the original historical `when` values.

A successful verifier run qualifies the database for baseline adoption; it does not adopt the database. Before any mutation:

1. Capture a schema-only backup of staging through the approved database operations process.
2. Run Drizzle introspection in a temporary workspace with `drizzle-kit pull` and compare the result with the repository schema and the verified effects of `0000` through `0003`.
3. Review all differences with the database owner. Any difference is a stop condition.
4. Validate the proposed adoption procedure on a disposable PostgreSQL database.
5. Review the exact Drizzle migration-history format for the installed Drizzle Kit version.
6. Approve a repository-owned, guarded baseline-adoption command that records the verified existing baseline without replaying `0000` through `0003`.

Drizzle Kit `0.31.10` does not expose a native `baseline`, `adopt`, or `--fake` migration command. The repository must not solve this by blindly creating `__drizzle_migrations`, inserting guessed rows, deleting migration files, or rewriting `_journal.json`.

The repository-owned `db:migration:adopt-baseline` command uses the canonical manifest in `scripts/migration-baseline-manifest.ts`. It is intentionally limited to the explicitly confirmed staging stage, requires the read-only verifier to pass, checks that both `homepage_deals` and migration history are absent, and writes only the Drizzle bookkeeping records. It never executes `0000` through `0003`.

If a one-time DBA operation is unavoidable, it must be a reviewed and logged operation that:

- runs only after the verifier and schema-only comparison pass
- runs only against the explicitly authorized staging target
- records the exact migration files and checksums being treated as already applied
- creates no application tables and replays no baseline DDL
- is tested on a disposable database first
- is followed by a read-only check proving the history represents effective state `0003`

Run the adoption command only after disposable-database validation and separate approval:

```powershell
$env:DEPLOYMENT_STAGE="staging"; $env:MIGRATION_CONFIRMATION="ADOPT_BASELINE_0003"; $env:MIGRATION_ALLOW_DATABASE_URL_FALLBACK="true"; npm run db:migration:adopt-baseline
```

For a read-only rehearsal, add `BASELINE_ADOPTION_DRY_RUN=true`. The command prints the target metadata, canonical identities, and planned bookkeeping before any write. A successful run reports each adopted migration and that `0004` is next unapplied.

## Phase 3: apply future migrations

After baseline adoption is completed and verified, `0004_homepage_deals.sql` must be the next unapplied migration. Apply it only through the guarded deployment command:

```powershell
$env:DEPLOYMENT_STAGE="staging"; $env:MIGRATION_CONFIRMATION="APPLY_MIGRATIONS"; $env:MIGRATION_ALLOW_DATABASE_URL_FALLBACK="true"; npm run db:migration:apply
```

Then verify the `homepage_deals` table, product foreign key, uniqueness constraint, range checks, and the three intended initial deal rows. Do not apply the command until the baseline operation has been separately authorized.

## Safety rules

- Never run the migration command as part of web-server startup.
- Never run direct SQL as a workaround for a failed Drizzle migration.
- Never mark migrations as applied without proving their schema effects exist.
- Never modify product or catalogue tables during baseline adoption.
- Keep `0000` through `0004` as version-controlled migration artifacts.
