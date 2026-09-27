# Deployment & SEO Handoff

## A. VERIFIED LOCALLY

### Local verification evidence

- `npm run typecheck` passed.
- `npm test` passed: 64 passed, 0 failed, 1 skipped.
- `npm run build` passed.
- `git diff --check` passed.
- Local SEO metadata behavior is corrected in the source tree; the app no longer resolves production URLs to `http://localhost:3000` in the checked code paths.

### Exact git status --short --branch

```text
## migrate-to-alif...alif/main
 M .env.example
 M .gitignore
 M next.config.ts
 M package-lock.json
 M package.json
 M src/app/(admin)/admin/attributes/page.tsx
 M src/app/(admin)/admin/brands/page.tsx
 M src/app/(admin)/admin/categories/page.tsx
 M src/app/(admin)/admin/deals/page.tsx
 M src/app/(admin)/admin/enquiries/page.tsx
 M src/app/(admin)/admin/homepage/page.tsx
 M src/app/(admin)/admin/images/page.tsx
 M src/app/(admin)/admin/page.tsx
 M src/app/(admin)/admin/products/page.tsx
 M src/app/(admin)/admin/specifications/page.tsx
 M src/app/(admin)/admin/translations/page.tsx
 M src/app/(admin)/admin/users/users-client.tsx
 M src/app/(admin)/admin/variants/page.tsx
 M src/app/[locale]/about-us/page.tsx
 M src/app/[locale]/categories/[slug]/page.tsx
 M src/app/[locale]/contact-us/page.tsx
 M src/app/[locale]/page.tsx
 M src/app/[locale]/products/[slug]/page.tsx
 M src/app/[locale]/request-quote/page.tsx
 M src/app/sitemap.ts
 M src/components/admin/product-image-field.tsx
 M src/components/public/home-intro-section.tsx
 M src/config/env.ts
 M src/config/site.ts
 M src/lib/production-readiness.ts
 M src/lib/seo.ts
 M src/server/repositories/public-catalog.ts
 M tests/production-readiness.test.ts
 M tests/seo-regression.test.ts
?? DEPLOYMENT-SEO-CHECKLIST.md
?? PRE-CRAWL-SEO-AUDIT.md
?? src/components/admin/admin-back-button.tsx
?? src/lib/image-crop.ts
?? tests/image-crop.test.ts
```

### Git branch and upstream status

- Current branch: `migrate-to-alif`
- Tracking upstream: `alif/main`
- `git branch -avv` output shows:

```text
* migrate-to-alif     9bcd254 [alif/main] Initial commit: Qasr Al Mabrook Next.js website.
  main                26eab53 [origin/main: ahead 1] Update project state and current work
  remotes/alif/HEAD   -> alif/main
  remotes/alif/main   9bcd254 Initial commit: Qasr Al Mabrook Next.js website.
  remotes/origin/HEAD -> origin/main
  remotes/origin/main 84fc344 Move product descriptions into product form
```

This means the local SEO fix work is not in a recorded commit on the current branch. The branch is tracking `alif/main` at the initial commit, and the fixes are present as uncommitted working-tree changes only.

### SEO fix commit status

- Local SEO fix commit: none recorded in the current branch history.
- The fix exists in the working tree, not in a committed history entry.
- No push, merge, or commit was performed.

## B. VERIFIED FROM VERCEL

No provider-side Vercel facts could be verified from this environment.

Reason:

- `vercel --version` returned command-not-found.
- No Vercel CLI access is available locally.
- No authenticated Vercel session or read-only inspection was possible from this environment.
- Therefore, the following Vercel details remain unverified from this environment:
  - project
  - team/account
  - Git repository
  - production branch
  - production deployment
  - production domain
  - deployment commit
  - `NEXT_PUBLIC_SITE_URL` production environment-variable presence

## C. NOT VERIFIED

The following could not be established from the repo or from the current environment:

- exact Vercel project name
- exact Vercel team/account name
- exact connected GitHub repository in the Vercel project
- exact production branch in Vercel
- exact production deployment URL in Vercel
- exact production deployment commit or branch metadata
- whether the currently deployed production build includes the local SEO fix
- whether `NEXT_PUBLIC_SITE_URL` is configured for Production in the Vercel project
- live SEO correctness on the public site, until the live smoke test runs against the actual production deployment

## D. EXACT DEPLOYMENT ACTION

This section is only actionable after the actual Vercel project is identified in the Vercel dashboard.

Since this environment does not have authenticated Vercel access, the required manual action is:

1. Sign in to the Vercel dashboard.
2. Find the project attached to `https://www.qasralmabrook.com`.
3. Open that project and confirm the domain assignment.
4. Open Project Settings -> Domains and verify `www.qasralmabrook.com` is attached to the project.
5. Open Project Settings -> Git and verify the connected repository and production branch.
6. Open Project Settings -> Environment Variables and check Production.
7. Set or confirm:
   - `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com`
8. Ensure the production branch is the one selected for deployment.
9. Trigger a production redeploy from that branch.
10. Wait for deployment success and then run the live smoke test below.

Do not infer the project name, team, or branch from DNS alone.

## E. POST-DEPLOY PRODUCTION SMOKE TEST

The following PowerShell script checks the exact production URLs and fails when the live metadata still contains localhost or non-production values.

```powershell
$ErrorActionPreference = 'Stop'
$base = 'https://www.qasralmabrook.com'
$urls = @(
  "$base/robots.txt",
  "$base/sitemap.xml",
  "$base/en",
  "$base/en/products",
  "$base/en/products/fancy-suit",
  "$base/en/categories/fancy-suit",
  "$base/en/about-us",
  "$base/en/contact-us",
  "$base/en/request-quote?success=demo"
)

$failures = @()

function Assert-NotLocalhost($label, $value) {
  if ($null -ne $value -and $value -match 'http://localhost:3000') {
    throw "$label contains localhost: $value"
  }
}

function Assert-ProdCanonical($label, $value) {
  if ($null -ne $value -and $value -notmatch '^https://www\.qasralmabrook\.com/') {
    throw "$label is not production canonical: $value"
  }
}

function Assert-ProdImage($label, $value) {
  if ($null -ne $value -and ($value -match 'http://localhost:3000' -or $value -match 'localhost' -or $value -notmatch '^https://')) {
    throw "$label is not production-safe: $value"
  }
}

foreach ($u in $urls) {
  Write-Host "Checking $u"
  try {
    $resp = Invoke-WebRequest -Uri $u -UseBasicParsing
    $status = [int]$resp.StatusCode
    Write-Host "HTTP $status"
    if ($status -ne 200) { $failures += "$u returned $status instead of 200" }

    $body = $resp.Content
    if ($body -match 'http://localhost:3000') { $failures += "$u contains localhost metadata" }

    if ($body -match '<link\s+rel="canonical"\s+href="([^"]+)"') {
      $canonical = $Matches[1]
      Assert-NotLocalhost 'Canonical' $canonical
      Assert-ProdCanonical 'Canonical' $canonical
    }

    if ($body -match '<meta\s+property="og:url"\s+content="([^"]+)"') {
      $ogUrl = $Matches[1]
      Assert-NotLocalhost 'og:url' $ogUrl
      Assert-ProdCanonical 'og:url' $ogUrl
    }

    if ($body -match '<meta\s+property="og:image"\s+content="([^"]+)"') {
      $ogImage = $Matches[1]
      Assert-ProdImage 'og:image' $ogImage
    }

    if ($body -match '<meta\s+name="twitter:image"\s+content="([^"]+)"') {
      $twitterImage = $Matches[1]
      Assert-ProdImage 'twitter:image' $twitterImage
    }

    if ($body -match '<meta\s+name="twitter:image:src"\s+content="([^"]+)"') {
      $twitterImageSrc = $Matches[1]
      Assert-ProdImage 'twitter:image:src' $twitterImageSrc
    }

    if ($body -match '<meta\s+name="robots"\s+content="([^"]+)"') {
      $robotsMeta = $Matches[1]
      if ($robotsMeta -match 'noindex' -and $u -match '/request-quote\?success=demo') {
        # acceptable for utility success page
      }
    }

    if ($u -match '/request-quote\?success=demo') {
      if ($body -notmatch 'noindex') { $failures += "$u missing noindex, follow for success-state utility page" }
      if ($body -match 'http://localhost:3000') { $failures += "$u contains localhost URL in success-state page" }
    }

    Write-Host '---'
  }
  catch {
    $failures += "$u request failed: $($_.Exception.Message)"
    Write-Host "Request failed: $($_.Exception.Message)"
    Write-Host '---'
  }
}

# Check a fabricated route should 404
try {
  $notFound = Invoke-WebRequest -Uri "$base/definitely-does-not-exist-xyz-12345" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  if ($notFound.StatusCode -lt 400 -or $notFound.StatusCode -ge 500) {
    $failures += 'Fabricated route did not return a 4xx/5xx status as expected'
  }
}
catch {
  $statusCode = $_.Exception.Response.StatusCode
  if ($statusCode -notin 404, 410) {
    $failures += "Fabricated route returned unexpected status: $statusCode"
  }
}

# Check robots.txt
$robotsResp = Invoke-WebRequest -Uri "$base/robots.txt" -UseBasicParsing
$robotsText = $robotsResp.Content
if ($robotsResp.StatusCode -ne 200) { $failures += 'robots.txt did not return HTTP 200' }
if ($robotsText -notmatch 'Sitemap:\s*https://www\.qasralmabrook\.com/sitemap\.xml') {
  $failures += 'robots.txt Sitemap directive is incorrect'
}

# Check sitemap.xml
$sitemapResp = Invoke-WebRequest -Uri "$base/sitemap.xml" -UseBasicParsing
$sitemapText = $sitemapResp.Content
if ($sitemapResp.StatusCode -ne 200) { $failures += 'sitemap.xml did not return HTTP 200' }
if ($sitemapText -match 'http://localhost:3000') { $failures += 'sitemap.xml contains localhost URLs' }
if ($sitemapText -match 'https?://[^\s<]+\?.+') { $failures += 'sitemap.xml contains query URLs' }
if ($sitemapText -match '/admin') { $failures += 'sitemap.xml contains /admin URLs' }
if ($sitemapText -match '/api') { $failures += 'sitemap.xml contains /api URLs' }

try {
  [xml]$xml = $sitemapText
  $locs = @($xml.urlset.url.loc)
  $uniqueLocs = @($locs | Select-Object -Unique)
  if ($locs.Count -ne $uniqueLocs.Count) { $failures += 'sitemap.xml has duplicate URLs' }
  foreach ($loc in $locs) {
    if ($loc -notmatch '^https://www\.qasralmabrook\.com/') { $failures += "sitemap.xml contains non-production URL: $loc" }
    if ($loc -match 'http://localhost:3000') { $failures += "sitemap.xml contains localhost URL: $loc" }
    if ($loc -match '(/admin|/api|\?)') { $failures += "sitemap.xml contains forbidden URL: $loc" }
  }
} catch {
  $failures += 'sitemap.xml is not valid XML or could not be parsed'
}

if ($failures.Count -gt 0) {
  Write-Host 'SMOKE TEST FAILED' -ForegroundColor Red
  $failures | ForEach-Object { Write-Host $_ -ForegroundColor Red }
  exit 1
}

Write-Host 'SMOKE TEST PASSED' -ForegroundColor Green
```

### Required pass conditions

The smoke test must fail if it finds any of the following:

- `http://localhost:3000`
- non-production canonical URLs
- non-production `og:url`
- non-production `og:image`
- non-production Twitter image URLs
- localhost URLs in sitemap
- query URLs in sitemap
- `/admin` or `/api` URLs in sitemap
- incorrect robots Sitemap directive

It must verify:

- HTTP 200 for valid routes
- expected 404 behavior for a fabricated route
- `noindex, follow` for utility success-state URLs
- canonical URLs use `https://www.qasralmabrook.com`
- sitemap URLs use the same canonical production origin
- sitemap URLs are unique

## Final status

PRODUCTION HOST: Vercel DNS target strongly indicates Vercel, but provider-side confirmation is unavailable from this environment.
VERCEL PROJECT: Unconfirmed; Vercel CLI is not installed and no authenticated provider access is available.
PRODUCTION BRANCH: Unconfirmed; no Vercel project metadata or provider-side branch detail is available from this environment.
GIT REPOSITORY: `migrate-to-alif` tracking `alif/main` at `https://github.com/Alifb3101/qasr_al_mabrook_webiste.git`; no production deploy metadata available from Vercel.
CURRENT PRODUCTION DEPLOYMENT: Unconfirmed; the live site is still serving stale local metadata and the current deployment commit cannot be verified from this environment.
LOCAL SEO FIX COMMIT: None; the SEO fix exists as uncommitted local working-tree changes only.
PRODUCTION ENV VERIFIED: NO; no authenticated Vercel access or provider read-only inspection is available, so `NEXT_PUBLIC_SITE_URL` for Production cannot be verified.
LIVE SEO FIX VERIFIED: NO; the live production smoke test has not run against the real production deployment and the live site still serves stale localhost-based SEO output.
DEPLOYMENT REQUIRED: YES; the verified local build must be deployed to the correct Vercel project and production branch before the live SEO fix can be confirmed.
BLOCKER: Exact Vercel project, team/account, Git connection, production branch, and production `NEXT_PUBLIC_SITE_URL` are not verifiable from this environment, and the live site remains stale.
NEXT ACTION: Open the Vercel dashboard for the project attached to `www.qasralmabrook.com`, confirm the project, Git repo, and production branch, set `NEXT_PUBLIC_SITE_URL=https://www.qasralmabrook.com` under Production, trigger the redeploy, and run the smoke test above.
