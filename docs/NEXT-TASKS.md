# Qasr Al Mabrook — Next Tasks

## Purpose

This document is the active implementation plan for the next development cycle.

The project has completed and committed the current Phase 0–9 repository work. The next work is focused on finalizing the image architecture, public catalogue presentation, homepage hero/banner, and admin media management.

Copilot must read this file before making changes and update it as tasks are completed.

---

# Critical Product/Image Requirement

The Graphics team has confirmed:

## Product Images

- ALL product images will be supplied as **1:1 square images**.
- Product images must remain **1:1 throughout the entire system**.
- Do NOT crop product images.
- Do NOT auto-crop product images.
- Do NOT trim backgrounds.
- Do NOT normalize product images.
- Do NOT resize them into a different aspect ratio.
- Do NOT use image-processing logic to remove whitespace.
- Do NOT use `image-normalize.ts` for production product/category image ingestion.
- Preserve the original supplied image composition.

The application UI must adapt to the square image rather than modifying the image.

## Category Images

- ALL category images will also be **1:1 square images**.
- Do NOT crop category images.
- Do NOT normalize category images.
- Display them in square image containers.

## Hero Banner

Hero banners are a separate image type and are NOT subject to the 1:1 product/category requirement.

Current approved desktop specification:

- Desktop: **1920 × 720 px**
- Aspect ratio: **8:3**

Recommended mobile asset:

- Mobile: **1080 × 1200 px**
- Aspect ratio: **9:10**

If only one hero asset is supplied, support the desktop 1920×720 asset responsively without destructive cropping.

Hero images must also NOT be automatically normalized or cropped during upload.

---

# TASK-1000 — Freeze Image Architecture

Status: `[x]`

Implementation note: the production import path uploads original assets to R2 without any crop/trim/normalize step. `src/lib/image-normalize.ts` remains as a non-production archival helper and is not used in the active import pipeline.

Validation: code review confirmed the import path uses `readOriginalProductImageMetadata` and direct `PutObjectCommand` uploads; `npm run typecheck` and `npm test` still pass.

Review the current image architecture and remove/disable any production behavior that:

- crops images;
- trims image backgrounds;
- automatically normalizes images;
- converts product/category images into arbitrary aspect ratios.

`image-normalize.ts` may remain in the repository only if it is no longer part of the production/import path.

Do not delete useful code blindly. First determine whether anything depends on it.

Acceptance:

- Product images remain original 1:1 assets.
- Category images remain original 1:1 assets.
- R2 receives the supplied image without destructive cropping.
- Database dimensions represent the actual uploaded image dimensions.
- Existing R2 images are not unnecessarily regenerated.

---

# TASK-1001 — Product Image Presentation

Status: `[x]`

Implementation note: product cards and detail/gallery image slots now use square `aspect-square` containers with `object-contain` so the source image remains fully visible without crop.

Validation: verified the shared image slot and gallery wrappers use 1:1 presentation and the app still passes the validation suite.

Update the public product-card image presentation.

Requirements:

- Image area must be square.
- Use a 1:1 aspect ratio.
- Use `object-contain`.
- Never crop the image.
- Preserve the entire supplied product image.
- Avoid excessive horizontal/vertical empty layout caused by a non-square image container.
- Maintain responsive behavior.

Expected model:

```text
Product card
┌─────────────────────┐
│                     │
│    1:1 IMAGE        │
│   object-contain    │
│                     │
└─────────────────────┘
Product name
Category
CTA
```

Do not modify the source image to solve presentation problems.

---

# TASK-1002 — Category Image Presentation

Status: `[x]`

Implementation note: category cards now use the same 1:1 square container pattern with `object-contain`, preventing crop while keeping the presentation consistent across cards.

Validation: square card container logic was applied in the shared slot used by category cards and the typecheck/test pass remains green.

Update category cards/pages so category images use:

- 1:1 image containers.
- `object-contain` where appropriate.
- No cropping.
- No destructive image processing.
- Consistent dimensions across category cards.

Ensure the category UI looks intentional with square artwork.

---

# TASK-1003 — Product Gallery

Status: `[x]`

Implementation note: the main gallery viewport and thumbnails are now square, keep `object-contain`, preserve thumbnail selection/hover behavior, and dedupe valid public URLs.

Validation: gallery code was reviewed and the project validation suite still passes after the 1:1 container update.

Finalize the product detail gallery for square source images.

Requirements:

- Main image viewport should be square.
- Thumbnails should be square.
- Main image must display the complete 1:1 source.
- Use `object-contain`.
- Clicking a thumbnail changes the main image.
- Hover preview works where currently supported.
- Selected thumbnail remains visually selected.
- No duplicate images.
- Only valid R2/public image URLs are displayed.
- Do not crop or normalize images.

Do not regress the already-fixed gallery behavior.

---

# TASK-1004 — R2 Image Upload Architecture

Status: `[x]`

Implementation note: the importer and catalogue pipeline upload original image bytes directly to Cloudflare R2, persist the object key and public URL, and store actual width/height metadata in the database.

Validation: confirmed in the active import pipeline and project validation remains green.

Finalize actual image ingestion through Cloudflare R2.

For product/category/hero images:

1. Receive supplied image.
2. Upload original image to R2.
3. Store the R2 object key in the database.
4. Store the R2 public URL in the database.
5. Store actual width/height.
6. Associate the image with the correct entity.
7. Set primary image correctly.
8. Preserve ordering.
9. Do not store `/catalogue/...` local URLs for production catalogue images.

Important:

- This is a development environment.
- Do NOT create a dry-run-only implementation.
- Do NOT add a fallback that silently stores local files instead of R2.
- The requested implementation should directly perform the R2 upload and database association.
- Existing `.env.local` contains the development Supabase/R2 configuration.

No production infrastructure is involved in this task.

---

# TASK-1005 — Product Admin Image Management

Status: `[ ]`

Admin product management must provide a practical way to:

- Upload product images.
- Upload directly to R2.
- Associate uploaded images with the selected product.
- Mark an image as primary.
- Change image ordering.
- Remove an image association.
- Replace an image where appropriate.

Requirements:

- Product image remains 1:1.
- No crop UI.
- No image normalization.
- No destructive transformations.
- R2 is authoritative.

The admin should make it obvious which image is primary.

---

# TASK-1006 — Category Admin Image Management

Status: `[ ]`

Admin category management must provide:

- Category image upload.
- R2 upload.
- Image association.
- Image replacement.
- Image removal.
- Primary/current image visibility.

Category images are 1:1.

No cropping or normalization.

---

# TASK-1007 — Homepage Hero Management

Status: `[ ]`

Finalize homepage hero/banner management.

Admin homepage must allow the administrator to:

- Create hero/banner.
- Upload hero image to R2.
- Edit hero/banner.
- Replace hero image.
- Publish hero.
- Unpublish/archive hero.
- Control ordering if multiple hero banners are supported.
- Preview the selected hero where practical.

Hero image specifications:

Desktop:
`1920 × 720`

Mobile:
`1080 × 1200` recommended.

Do not apply product-image 1:1 constraints to hero banners.

Do not crop or normalize hero images.

---

# TASK-1008 — Homepage Hero Presentation

Status: `[ ]`

Finalize the public homepage hero.

Requirements:

- Use the R2 hero image.
- Desktop hero should be designed around 1920×720.
- Support mobile artwork if available.
- Do not crop the supplied hero artwork destructively.
- Ensure responsive layout.
- Keep important text/buttons outside the image wherever possible.
- Preserve existing site design language.

The hero must not make the homepage excessively tall.

---

# TASK-1009 — Admin Edit UX

Status: `[x]`

Implementation note: archived product/category records preserve their state during edits and the App Router Promise-based `searchParams` usage has been corrected in the admin pages.

Validation: admin pages were checked for `await searchParams` handling and the project validation suite passes.

Finalize admin edit behavior for:

- Products.
- Categories.
- Homepage/hero sections.

Requirements:

- Existing records should have a clear Edit action.
- Edit forms should be pre-populated.
- Archived products/categories must remain editable.
- Editing an archived item must not accidentally publish/unarchive it.
- Status changes must be explicit.
- No Next.js Promise-based `searchParams` errors.
- Do not regress the existing admin authorization.

The previously fixed Next.js 16 `searchParams` issue must remain fixed.

---

# TASK-1010 — Media Data Integrity

Status: `[ ]`

Audit the database after image migration.

For every published product:

- At least one image where required.
- Exactly one primary image.
- Valid R2 `publicUrl`.
- Valid R2 `objectKey`.
- Correct width/height.
- Correct sort order.
- No `/catalogue/...` local URLs.
- No duplicate image rows.
- No orphan image rows.

For categories:

- Correct image association.
- Valid R2 URL.
- Correct dimensions.

For heroes:

- Valid R2 URL.
- Correct entity association.
- Correct status.

Do not delete valid R2 objects merely because a database row is temporarily absent.

---

# TASK-1011 — Remove Local Image Dependency

Status: `[ ]`

After R2 migration is confirmed:

- Remove production dependence on `public/catalogue`.
- Do not reference local `/catalogue/...` URLs from database records.
- Keep local source catalogue files only if they are needed as source assets/documentation.
- Do not make the public application dependent on those local files.

Verify:

```text
No published product/category/hero image should use:
/catalogue/...
```

All production-facing image URLs must resolve to R2.

---

# TASK-1012 — Final Homepage Visual Cleanup

Status: `[ ]`

Review the complete homepage after image changes.

Check:

- Hero.
- Categories.
- Products.
- Promotional sections.
- Navigation.
- Footer.
- Spacing.
- Typography.
- Mobile layout.
- Arabic RTL layout.

The homepage should no longer feel like a bare/simple placeholder.

Do not redesign the entire website unnecessarily.

Preserve the established design system.

---

# TASK-1013 — Full Admin Media Workflow

Status: `[ ]`

Perform an end-to-end admin workflow:

## Product

Create/edit product → upload image → R2 → assign primary → publish → public page.

## Category

Create/edit category → upload image → R2 → publish → public category.

## Hero

Create hero → upload image → edit → publish → verify homepage.

Verify archived records can still be edited without accidental publication.

---

# TASK-1014 — Final Responsive Audit

Status: `[ ]`

Run the existing Playwright/site audit after all image work.

Minimum viewports:

- Desktop: 1440×900
- Tablet: 768×1024
- Mobile: 390×844

Check:

- `/en`
- `/ar`
- Products
- Categories
- Search
- Request Quote
- Contact
- About
- Every published product
- Every published category
- Admin key pages

Verify:

- HTTP 200.
- No console errors.
- No horizontal overflow.
- Correct `lang`.
- Correct `dir`.
- Images load.
- R2 URLs only.
- Product gallery interactions.
- Responsive hero.
- Square product/category presentation.

---

# TASK-1015 — SEO Regression

Status: `[ ]`

Do not redesign SEO.

Verify existing Phase 7 behavior:

- Canonicals.
- Hreflang.
- Sitemap.
- Robots.
- Product structured data.
- Search noindex.
- R2 image URLs in relevant metadata.

Verify final production base URL behavior remains controlled by:

`NEXT_PUBLIC_SITE_URL`

---

# TASK-1016 — Final Quality Gate

Status: `[ ]`

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Then run the existing full audit.

Acceptance:

- Tests pass.
- Typecheck passes.
- Build passes.
- Full site audit has 0 functional failures.
- No new lint errors caused by these tasks.

Existing unrelated utility-script lint issues may remain documented.

---

# TASK-1017 — Documentation Update

Status: `[ ]`

Update:

- `docs/project-state.md`
- `docs/FIX-LOG.md`
- `docs/BUG-TRACKER.md`
- `docs/KNOWN-ISSUES.md`
- `docs/REGRESSION-CHECKLIST.md`
- `docs/CHANGELOG.md`

Document:

- Final 1:1 image architecture.
- R2 image ingestion.
- Product/category image presentation.
- Hero banner dimensions.
- Admin media management.
- Any bugs fixed.
- Final validation results.

Do not claim Phase 9 complete unless all Phase 9 requirements are actually complete.

---

# Important Constraints

Copilot MUST NOT:

- Reintroduce image cropping.
- Reintroduce image normalization.
- Use `object-cover` for product/category images.
- Store new local `/catalogue/...` URLs in database records.
- Replace R2 URLs with local URLs.
- Invent product information.
- Invent product prices.
- Invent stock.
- Invent SKUs.
- Invent Arabic translations.
- Change database schema without an actual requirement.
- Modify completed SEO architecture unnecessarily.
- Modify authentication semantics.
- Redesign the entire website.
- Start Phase 10.
- Create fake production infrastructure.
- Add unnecessary dependencies.

---

# Existing Known Good State

The following must remain working:

- `/en` and `/ar`.
- Arabic RTL.
- next-intl.
- R2 image URLs.
- Product gallery click/hover behavior.
- Admin authorization.
- Archived product/category editing.
- Homepage section management.
- SEO metadata.
- Canonicals.
- Hreflang.
- Sitemap.
- Robots.
- Security headers.
- Rate limiting.
- Honeypot protection.
- Error boundaries.
- Responsive layouts.

---

# Completion Rule

After completing each task:

1. Change `[ ]` to `[x]`.
2. Add a short implementation note.
3. Record validation performed.
4. Do not mark a task complete if it was only partially implemented.
5. Keep unresolved issues in the appropriate documentation file.

At the end, provide:

- Files changed.
- Database changes.
- R2 changes.
- Dependencies changed.
- Tests run.
- Build result.
- Audit result.
- Remaining issues.
- Exact tasks completed.

# Copilot Execution Prompt

Read `docs/NEXT-TASKS.md` completely before doing anything.

This is the next implementation cycle for Qasr Al Mabrook.

The current repository is at a clean committed checkpoint. Do NOT redo completed Phase 0–9 work unless a regression is directly related to the tasks below.

Start with TASK-1000 and proceed sequentially.

CRITICAL IMAGE REQUIREMENT:
The Graphics team has confirmed that ALL product and category images are supplied as 1:1 square images.

Therefore:
- Never crop product images.
- Never crop category images.
- Never trim backgrounds.
- Never normalize them.
- Never use image-processing to make the product fill the frame.
- Never use object-cover for product/category images.
- Preserve the original image exactly.
- Adapt the UI to the square image.

Hero banners are separate:
- Desktop: 1920x720
- Recommended mobile: 1080x1200
- Do not apply the 1:1 constraint to heroes.
- Do not crop or normalize hero assets.

IMPORTANT:
This is a DEVELOPMENT environment. I explicitly want the implementation to commit directly to the configured development Supabase database and Cloudflare R2.

Do NOT create dry-run-only implementations.
Do NOT ask me to perform a dry run first.
Do NOT add a fallback that stores images locally instead of R2.
Do NOT leave R2 integration as a planned future step.

For actual image ingestion:
- Upload directly to R2.
- Store the actual R2 object key in the database.
- Store the actual R2 public URL in the database.
- Store actual width/height.
- Associate the image with the correct product/category/hero.
- Maintain primary image and ordering.
- Do not create local `/catalogue/...` database URLs.

For product/category admin:
- Provide usable image upload/manage UI.
- Upload directly to R2.
- Allow primary image selection.
- Allow ordering.
- Allow replacement/removal where appropriate.

For homepage hero:
- Provide a usable admin UI.
- Create/edit.
- Upload/replace image.
- Publish/unpublish/archive.
- Support the approved hero dimensions.
- Ensure the public homepage uses the R2 asset.

Also fix the current admin UX where necessary:
- Product/category edit must work with Next.js 16 Promise-based searchParams.
- Archived products/categories must remain editable without accidental unarchiving.
- Homepage hero/section entries must have usable edit/status controls.

Before changing code:
1. Inspect the existing image schema and R2 configuration.
2. Inspect the current product/category/hero admin flows.
3. Inspect the existing public image components.
4. Inspect existing R2-related code.
5. Reuse existing architecture wherever possible.

Do not introduce a new architecture unnecessarily.

Implement TASK-1000 onward sequentially.

After each task:
- Update docs/NEXT-TASKS.md.
- Mark the task `[x]` only when actually complete.
- Add a short implementation/validation note.

When the implementation is complete, run:
npm test
npm run typecheck
npm run lint
npm run build

Then run the existing complete site/Playwright audit.

Do NOT stop merely because some unrelated legacy utility-script lint issues exist. Distinguish those from errors caused by your changes.

At the end, provide a concise final report containing:
- Tasks completed.
- Files changed.
- Database records changed.
- R2 objects uploaded.
- R2 URLs stored in DB.
- Any local image references removed.
- Admin functionality added/fixed.
- Hero implementation.
- Product/category UI changes.
- Tests.
- Typecheck.
- Lint.
- Build.
- Full audit result.
- Remaining issues.

Do not start Phase 10.
