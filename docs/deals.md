# Homepage Deals

Homepage Deals reference existing published products through `products.id`. Deal records store only the product reference, discount percentage, active state, display position, and timestamps.

The homepage supports zero to three active deals. It queries active deals ordered by position and renders at most the first three because the existing Special Offers UI is a three-card layout. Positions are 1 through 3 in the admin UI and must be unique among active deals. A product can have only one deal, and no more than three deals may be active at once.

The initial migration seeds the existing Fancy Suit, Adivasi Oil, and 5M Measuring Tape Green products when those published product records are present. Product names, slugs, images, categories, and descriptions continue to come from the product catalogue and are not duplicated in deal records.

Deal mutations require an authenticated administrator. The admin route is `/admin/deals`; product selection searches existing published products, and discount text is derived from the stored percentage.
