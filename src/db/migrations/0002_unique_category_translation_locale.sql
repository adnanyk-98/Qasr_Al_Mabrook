CREATE UNIQUE INDEX IF NOT EXISTS category_translations_category_locale_unique
ON category_translations (category_id, locale);