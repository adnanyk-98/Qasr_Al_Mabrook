# Deployment & SEO Verification Checklist

## 1. Pre-deployment

### Working-tree status

- Confirm the current working tree before deployment.
- Do not reset, stash, or discard existing uncommitted changes.
- The current repo state includes a mix of pre-existing files and the SEO fix work. The deployment decision should be based on the actual build output, not on the repo state alone.

### Tests

```bash
npm test
```

Verified locally in this environment:
- 64 passed
- 0 failed
- 1 skipped

### Typecheck

```bash
npm run typecheck
```

Verified locally in this environment: passed.

### Build

```bash
npm run build
```

Verified locally in this environment: passed.

### Diff check

```bash
git diff --check
```

Verified locally in this environment: passed.

---

## 2. Required production configuration

The repository’s environment and deployment docs define a standard Node/Next.js production deployment with these required values:

### Required environment variables

From [.env.example](.env.example), [src/config/env.ts](src/config/env.ts), and [docs/deployment.md](docs/deployment.md):

- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `EMAIL_FROM`
- `EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

### Expected production values

- `NEXT_PUBLIC_SITE_URL` should be:
  `https://www.qasralmabrook.com`
- `AUTH_SECRET` must be a strong secret value, not empty.
- `DATABASE_URL` and `DIRECT_DATABASE_URL` must point to the production PostgreSQL instance.
- `R2_PUBLIC_BASE_URL` must resolve to the public media origin (for example `https://media.qasralmabrook.com`).
- SMTP and email values must be the actual production mail configuration.

### Build-time vs runtime

- `NEXT_PUBLIC_SITE_URL` is a build-time client environment variable in this project and is validated in [src/config/env.ts](src/config/env.ts).
- `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`, and the R2/SMTP values are runtime server-side configuration values and must be set in the deployed hosting environment.
- This repo does not contain a custom deployment script that injects them automatically.

---

## 3. Deployment procedure

### Platform discovered from the repository

The repository does not contain an actual deployment provider configuration such as:
- Dockerfile
- docker-compose file
- Vercel config
- Netlify config
- Cloudflare Wrangler config
- provider-specific deployment scripts

The only deployment-related evidence is:
- [docs/deployment.md](docs/deployment.md) states that the deployment provider is not yet finalized and that the app should remain portable across a standard Node/Next.js host.
- [package.json](package.json) defines standard Next.js commands and no direct deploy command.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) runs CI validation but does not deploy.

### Build command

```bash
npm run build
```

### Start command

```bash
npm run start
```

### Exact deployment procedure supported by the repo

The repository supports a standard deployment flow, but the final provider choice is external to the repo. The safe procedure is:

1. Choose the hosting provider and configure it to run a Node/Next.js server.
2. Set the production environment variables listed above.
3. Install dependencies using the lockfile.
4. Run the production build:

```bash
npm ci
npm run build
```

5. Start the app with:

```bash
npm run start
```

6. Ensure the deployment runs with the production environment variables present, especially `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com`.

### Verified vs assumed

Verified from the repository:
- `npm run build` is the build command.
- `npm run start` is the production start command.
- `NEXT_PUBLIC_SITE_URL` is expected to be set to the public host.
- The repo does not include a provider-specific deployment action or pipeline.

Assumptions to treat as provider-specific, not repo-verified:
- provider choice (Vercel, custom Node server, etc.)
- automatic redeploy behavior
- CDN invalidation steps
- domain/DNS change workflow
- rollback automation

---

## 4. Post-deployment smoke test

Run these checks against the live host after deployment:

- `/robots.txt`
- `/sitemap.xml`
- `/en`
- `/en/products`
- `/en/products/fancy-suit`
- `/en/categories/fancy-suit`
- `/en/about-us`
- `/en/contact-us`
- `/en/request-quote?success=demo`

### Verify for each page

- HTTP status
- canonical URL
- hreflang
- robots metadata
- `og:url`
- `og:image`
- Twitter card metadata
- JSON-LD
- sitemap URLs
- no `localhost` URLs
- HTTPS + canonical `www` host

### Required live outcome

The canonical and sitemap host should be:

```text
https://www.qasralmabrook.com
```

and there should be no `http://localhost:3000` anywhere in the public metadata.

---

## 5. Search-engine verification

These items require access outside the repository and cannot be verified from code alone:

- Google Search Console property ownership
- sitemap submission and sitemap status
- URL Inspection
- indexing status
- live robots.txt validation in the search console context
- production serving state after deployment

This repo can validate the source and local build, but not the Google-side index state.

---

## 6. Rollback

The repository documents provider-agnostic rollback requirements in [docs/deployment.md](docs/deployment.md) but does not provide an automatic rollback script.

The safest rollback plan based on repository evidence is:

1. Keep the previous immutable deployment available on the hosting provider.
2. Redeploy the previous successful build or revert traffic to the previous version in the chosen platform.
3. Confirm the app is serving the prior known-good version.
4. Recheck the homepage, sitemap, robots, and canonical URLs.
5. If there were database changes, confirm the database version and migration state before promoting the previous build.
6. Treat schema rollback as separate from application rollback because the repo explicitly warns that database rollback is not always equivalent to web-app rollback.

---

## Deployment summary

- The repo is a standard Next.js Node app, not a static export.
- The hosting provider is not finalized in the repository.
- There is no deploy command in [package.json](package.json).
- There is no Docker or hosting config in the repo root.
- CI runs validation in [./.github/workflows/ci.yml](.github/workflows/ci.yml), but there is no deploy step.
- `NEXT_PUBLIC_SITE_URL` must be set to `https://www.qasralmabrook.com` in production.
- Actual deployment must be performed manually by the operator with the selected provider and the production secrets configured in that environment.
- Until the rebuild is deployed, the live production site remains stale and is not considered fixed.

# Vercel Production Deployment

## Before deployment

Confirm in the Vercel dashboard or Git provider:

- correct Vercel project serving `www.qasralmabrook.com`
- correct Git repository connected to the project
- correct production branch
- correct production domain mapping
- correct Node.js version
- correct framework preset: Next.js
- correct build command
- correct install command

Repository evidence:

- [package.json](package.json) defines `build: next build`, `start: next start`, and `dev: next dev`.
- [package.json](package.json) shows `next` version `16.3.1`.
- The CI workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) uses Node.js 20 and `npm ci`.
- No repository-side Vercel configuration or project linkage was found.
- No production branch is proven from the repo alone.

## Production environment variables

The required production variables, by name only, are:

- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `EMAIL_FROM`
- `EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

Most important:

- `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com`

Important: `NEXT_PUBLIC_*` values are embedded into the client and build output. If they change, a new production deployment is required before the live site reflects the new value.

Do not include secret values in repository files or in the deployment checklist.

## Vercel build settings

These settings are expected for this project, but the exact values must be confirmed in the Vercel dashboard or platform project settings because the repo does not define them:

- Framework: Next.js
- Build command: `next build`
- Install command: `npm ci`
- Output configuration: not explicitly configured in the repo; if this project is hosted on Vercel, default Next.js output behavior applies unless the dashboard config overrides it
- Node.js version: Node 20 (confirmed by CI workflow)
- Production branch: must be confirmed in the Vercel dashboard; no repo-side proof of the exact production branch was found

## Deployment procedure

Safe dashboard-based procedure:

1. Open the Vercel project currently serving `www.qasralmabrook.com`.
2. Verify the connected Git repository.
3. Verify the Production Branch.
4. Verify the Production Environment Variables.
5. Set `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com`.
6. Trigger a production deployment from the verified production branch.
7. Wait for the deployment to complete successfully.
8. Confirm the custom domain still points to the new deployment.
9. Only then run the SEO smoke test.

This is the safest procedure because the repo does not contain a Vercel deployment config or deploy command. The exact UI labels and project linkage must be confirmed in the Vercel dashboard.

## Post-deployment smoke test

PowerShell commands to run after deployment:

```powershell
$urls = @(
  'https://www.qasralmabrook.com/robots.txt',
  'https://www.qasralmabrook.com/sitemap.xml',
  'https://www.qasralmabrook.com/en',
  'https://www.qasralmabrook.com/en/products',
  'https://www.qasralmabrook.com/en/about-us',
  'https://www.qasralmabrook.com/en/contact-us',
  'https://www.qasralmabrook.com/en/request-quote?success=demo'
)

foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -Method Get
    $body = $r.Content
    Write-Host "URL: $u"
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Contains localhost: $($body.Contains('http://localhost:3000'))"
    if ($body -match '<link\s+rel="canonical"\s+href="([^"]+)"') { Write-Host "Canonical: $($Matches[1])" }
    if ($body -match '<meta\s+property="og:url"\s+content="([^"]+)"') { Write-Host "OG URL: $($Matches[1])" }
    if ($body -match '<meta\s+property="og:image"\s+content="([^"]+)"') { Write-Host "OG Image: $($Matches[1])" }
    if ($body -match '<meta\s+name="twitter:card"\s+content="([^"]+)"') { Write-Host "Twitter: $($Matches[1])" }
    Write-Host '---'
  } catch {
    Write-Host "URL: $u"
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host '---'
  }
}
```

For each page, verify:

- HTTP 200 where expected
- no `http://localhost:3000`
- canonical uses `https://www.qasralmabrook.com`
- Open Graph URL uses production origin
- OG image does not point to localhost
- Twitter metadata does not point to localhost
- JSON-LD does not contain localhost
- hreflang URLs use the correct production origin
- query-state pages have the expected noindex behavior

### Sitemap verification

```powershell
$r = Invoke-WebRequest -Uri 'https://www.qasralmabrook.com/sitemap.xml' -UseBasicParsing
$body = $r.Content
Write-Host "Status: $($r.StatusCode)"
Write-Host "Contains localhost: $($body.Contains('http://localhost:3000'))"
Write-Host "Contains http: $($body.Contains('http://'))"
[xml]$xml = $body
$xml.urlset.url | ForEach-Object { $_.loc }
```

Expected checks:

- HTTP 200
- valid XML
- every `<loc>` starts with `https://www.qasralmabrook.com/`
- zero localhost URLs
- zero HTTP URLs
- zero query URLs
- zero `/admin` URLs
- zero `/api` URLs
- no duplicate URLs

### Robots verification

```powershell
$r = Invoke-WebRequest -Uri 'https://www.qasralmabrook.com/robots.txt' -UseBasicParsing
Write-Host "Status: $($r.StatusCode)"
$r.Content
```

Expected:

- HTTP 200
- Sitemap directive points exactly to `https://www.qasralmabrook.com/sitemap.xml`

## Search Console

Separate from repository validation, required after deployment:

- inspect the production homepage
- inspect `/sitemap.xml`
- submit or refresh the sitemap if necessary
- inspect representative product/category URLs
- request indexing only where appropriate
- check for canonical/indexing errors
- check International Targeting / hreflang reports if available

Do not claim Search Console verification has happened.

## Simple production verification script

No dedicated production verification script is present in the repository that is specifically suited to this Vercel post-deploy smoke test, so the PowerShell block above is the safest manual verification path.

## Current Production Hosting

### Hosting provider

Likely provider: Vercel.

### Evidence

- `www.qasralmabrook.com` resolves to a CNAME target of `17c31a41df7a6ee3.vercel-dns-017.com`.
- Vercel-managed DNS names are a clear indicator of a Vercel-hosted deployment.
- The live site responses show the same security headers configured in [next.config.ts](next.config.ts), which strongly matches a Vercel-managed Next.js runtime rather than a custom arbitrary host.
- The domain is also managed under Cloudflare nameservers for the apex, while the `www` hostname is delegated to a Vercel DNS target. This is a common pattern for Vercel + Cloudflare DNS setups.
- No repository config (`vercel.json`, Docker, Netlify, Wrangler, etc.) indicates an alternate production host; the repo itself is deliberately provider-neutral.

### Production branch

- No repository evidence says a specific branch is the deployment branch.
- Git branches present include `main` and `migrate-to-alif`.
- The local branch `migrate-to-alif` tracks `alif/main` and is not obviously the production deployment branch.
- The default GitHub remote `origin/main` exists, but there is no repo-side deployment rule or workflow indicating it is the live branch.

### Deployment mechanism

- No automatic deploy mechanism is configured in the repository.
- The CI workflow in [./.github/workflows/ci.yml](.github/workflows/ci.yml) runs validation only; it does not deploy.
- The public deployment appears to be managed from the hosting dashboard or a separate external Vercel project setup rather than from this repository alone.

### Required environment variables

The production environment must include the full application config documented in [src/config/env.ts](src/config/env.ts), including:

- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `EMAIL_FROM`
- `EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

### What remains unknown

- The exact Vercel project name, team, or project ID.
- Whether the deployment is connected to the `origin` GitHub repo, the `alif` GitHub repo, or a different remote.
- Whether the production site is built via Git push, dashboard deploy, or a separate CI job.
- Whether the stale localhost metadata is caused by a stale Vercel deployment, a missing environment variable override, or an older build still promoted on the platform.

### Exact manual deployment procedure if it can be established

1. Confirm the live Vercel project connected to the public domain.
2. In the Vercel project settings, verify the production environment variables listed above are set for the production environment.
3. Set `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com`.
4. Trigger a redeploy from the dashboard or the Git branch configured for production.
5. After deployment, validate:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/en`
   - `/en/products`
   - `/en/products/fancy-suit`
   - `/en/categories/fancy-suit`
   - `/en/about-us`
   - `/en/contact-us`
   - `/en/request-quote?success=demo`
6. Confirm there are no `http://localhost:3000` values in canonical or sitemap output.

This is the strongest evidence available from the repo and the live DNS/header layer without direct provider access; it points to Vercel as the live host, but the exact project linkage and deployment trigger still require provider-side confirmation.
