-- Add permissions column to admin_users if it doesn't exist
ALTER TABLE "public"."admin_users"
  ADD COLUMN "permissions" text[] NOT NULL DEFAULT '{}'::text[];

-- Set default permissions for existing users based on their role
UPDATE "public"."admin_users"
SET "permissions" = CASE
  WHEN "role" = 'SUPER_ADMIN' THEN ARRAY['users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_access']::text[]
  WHEN "role" = 'ADMIN' THEN '{}'::text[]
  ELSE '{}'::text[]
END;

-- Ensure no NULL permissions
ALTER TABLE "public"."admin_users"
  ALTER COLUMN "permissions" SET NOT NULL;
