# Qasr Al Mabrook - UX & UI Design Specification

## 1. Design Goal

Create a premium, trustworthy, catalogue-first experience that makes product discovery and enquiry easy.

The uploaded Qasr Al Mabrook brand reference is the brand-direction source. Final logo, banner and production assets will be supplied separately.

The Mufaddal Fasteners website is a UX/reference source only, not a brand or product-domain source.

## 2. Design Principles

1. Product discovery first.
2. Enquiry actions are always easy to find.
3. Clean visual hierarchy.
4. Premium but practical.
5. Mobile-first.
6. English and Arabic parity.
7. RTL correctness.
8. Accessible interactions.
9. Avoid unnecessary visual complexity.
10. Reuse components consistently.

## 3. Core Layout

### Header

Desktop:

- Logo
- Main navigation
- Search
- Language switcher
- Primary enquiry CTA if appropriate

Mobile:

- Logo
- Menu trigger
- Search access
- Language switcher

### Footer

- Brand
- Navigation
- Contact details
- Social links where configured
- Legal links
- Language option if appropriate

## 4. Homepage

Recommended configurable section types:

1. Hero
2. Featured categories
3. Featured products
4. Business introduction
5. Product collection
6. Why choose us
7. Promotional banner
8. FAQ
9. Enquiry CTA
10. Contact information

The exact homepage composition remains configurable by the admin.

## 5. Catalogue Page

Recommended structure:

- Breadcrumb
- Page title
- Search context
- Filter controls
- Sort control if required
- Product grid
- Pagination/load-more
- Empty state

Desktop filters may use a sidebar.

Mobile filters should use a drawer/bottom sheet pattern.

## 6. Product Card

Should support:

- Image
- Product name
- Brand where useful
- Short identifying information
- Category/context where useful
- Enquiry CTA
- Variant indicator where relevant

Do not show price because pricing is out of scope.

## 7. Product Detail

Recommended order:

1. Breadcrumb
2. Image gallery
3. Product identity
4. Description
5. Variant selector
6. Specifications
7. Enquiry actions
8. Related products

## 8. Enquiry CTA Pattern

Primary action:

- Request Quote

Secondary:

- WhatsApp Enquiry
- Call Sales
- Email Enquiry

The supplied reference image establishes the general four-action arrangement.

CTA buttons should clearly communicate action and should not rely only on icons.

## 9. Request Quote UX

If launched from a product:

- Product name is preselected.
- Variant is preselected if applicable.
- User sees a clear summary of what they are enquiring about.
- Customer information fields are straightforward.
- Validation occurs inline.
- Success state provides a reference number where appropriate.

## 10. Search UX

Search should:

- Be accessible from every major public page.
- Provide clear loading/empty states.
- Support keyboard interaction.
- Avoid excessive client-side requests.
- Preserve query in URL.

Autocomplete can be added if it provides measurable value without making the initial implementation unnecessarily complex.

## 11. Arabic / RTL

The entire public UI must support RTL.

Use CSS logical properties:

- `margin-inline`
- `padding-inline`
- `inset-inline`
- `border-start/end`
- `text-align: start/end`

Do not solve RTL by manually reversing every component.

Icons that communicate direction must be reviewed individually.

## 12. Responsive Breakpoints

Do not design around a single device.

Validate representative widths:

- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920
- 2560

## 13. Accessibility

Target WCAG 2.2 AA principles where practical.

Required:

- Semantic headings
- Labels
- Keyboard access
- Focus visibility
- Meaningful alt text
- Contrast
- Error messages
- Reduced-motion consideration
- Accessible menus/drawers
- Screen-reader-friendly form states

## 14. Admin UX

Admin console should prioritize efficiency over marketing aesthetics.

Use:

- Data tables
- Search
- Filters
- Bulk-friendly workflows where justified
- Clear status badges
- Edit/create forms
- Image upload/reordering
- Validation
- Confirmation for destructive actions

Admin remains English-only initially.

## 15. States

Every significant component must consider:

- Loading
- Empty
- Error
- Success
- Disabled
- Unauthorized
- Draft
- Published
- Archived

## 16. SEO UX Considerations

Avoid rendering critical product/category content only after client-side JavaScript.

Public catalogue content should be available to crawlers through server-rendered/indexable HTML.
