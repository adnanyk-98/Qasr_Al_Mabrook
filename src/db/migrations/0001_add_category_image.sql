ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_object_key text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_public_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_width integer;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_height integer;
