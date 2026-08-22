# Regression Checklist

Run these checks after making changes that could affect the application. Organize by area.

### Core Application

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`

### Public Catalogue

- [ ] Homepage loads
- [ ] English locale works
- [ ] Arabic locale works
- [ ] Arabic RTL works
- [ ] Categories load
- [ ] Products load
- [ ] Product detail loads
- [ ] Category detail loads
- [ ] Search works
- [ ] Filters work
- [ ] Request Quote works

### Images

- [ ] Product images load
- [ ] Images use expected storage URLs
- [ ] R2 images resolve
- [ ] Product images are not incorrectly cropped
- [ ] Primary image selection works
- [ ] Gallery ordering works

### Admin

- [ ] Admin login works
- [ ] Unauthorized users cannot access admin
- [ ] Products can be created
- [ ] Products can be edited
- [ ] Categories can be created
- [ ] Categories can be edited
- [ ] Archived products can be edited
- [ ] Archived categories can be edited
- [ ] Archive status is preserved unless explicitly changed
- [ ] Admin authorization remains enforced

### SEO

- [ ] Canonical exists
- [ ] Canonical uses production host
- [ ] English hreflang exists
- [ ] Arabic hreflang exists where applicable
- [ ] Sitemap loads
- [ ] Robots loads
- [ ] Search/filter pages remain noindex
- [ ] Product JSON-LD exists
- [ ] No incorrect `/catalogue/` image URLs remain

### Database

- [ ] No duplicate product records
- [ ] No duplicate category records
- [ ] Product/category relationships are correct
- [ ] Product translations are correct
- [ ] Product images reference correct records
- [ ] Published records appear publicly
- [ ] Archived records do not appear publicly

### Security

- [ ] Admin authorization works
- [ ] Security headers remain present
- [ ] Rate limiting remains active
- [ ] Honeypot remains active
- [ ] Secrets are not exposed
- [ ] R2 credentials remain server-side

### Infrastructure

- [ ] Environment variables validated
- [ ] Database connectivity works
- [ ] R2 connectivity works
- [ ] Email delivery works
- [ ] Error handling works

---

## Release Gate

A change should not be considered complete if a regression check fails unless the failure is documented as an intentional change with an associated `BUG-` or `KI-` entry.

**Documentation Rules**

- Never mark an issue fixed without verification.
- Update regression checklist when new areas are introduced.
- Keep the Release Gate requirement in place for every release.
