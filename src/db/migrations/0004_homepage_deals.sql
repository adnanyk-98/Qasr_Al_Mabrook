CREATE TABLE IF NOT EXISTS homepage_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_deals_discount_percent_check CHECK (discount_percent BETWEEN 1 AND 100),
  CONSTRAINT homepage_deals_sort_order_check CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS homepage_deals_product_unique ON homepage_deals(product_id);

INSERT INTO homepage_deals (product_id, discount_percent, is_active, sort_order)
SELECT id, 20, true, 0 FROM products WHERE slug = 'fancy-suit' AND status = 'PUBLISHED'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO homepage_deals (product_id, discount_percent, is_active, sort_order)
SELECT id, 15, true, 1 FROM products WHERE slug = 'adivasi-oil' AND status = 'PUBLISHED'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO homepage_deals (product_id, discount_percent, is_active, sort_order)
SELECT id, 25, true, 2 FROM products WHERE slug = '5m-measuring-tape-green' AND status = 'PUBLISHED'
ON CONFLICT (product_id) DO NOTHING;
