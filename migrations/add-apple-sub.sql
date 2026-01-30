-- Add Apple Sign In subject identifier to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS apple_sub TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_apple_sub_unique'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_apple_sub_unique UNIQUE (apple_sub);
  END IF;
END $$;
