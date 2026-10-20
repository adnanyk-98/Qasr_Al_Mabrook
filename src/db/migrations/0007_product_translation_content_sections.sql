ALTER TABLE product_translations
  ADD COLUMN applications text,
  ADD COLUMN faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
