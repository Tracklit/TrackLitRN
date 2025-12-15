-- Migration: Add country and dateOfBirth fields to users table
-- Date: 2025-12-14
-- Description: Add optional country (TEXT) and date_of_birth (TIMESTAMP) columns to users table

-- Add country column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'country'
  ) THEN
    ALTER TABLE users ADD COLUMN country TEXT;
    RAISE NOTICE 'Column country added to users table';
  ELSE
    RAISE NOTICE 'Column country already exists in users table';
  END IF;
END $$;

-- Add date_of_birth column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE users ADD COLUMN date_of_birth TIMESTAMP;
    RAISE NOTICE 'Column date_of_birth added to users table';
  ELSE
    RAISE NOTICE 'Column date_of_birth already exists in users table';
  END IF;
END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('country', 'date_of_birth')
ORDER BY column_name;
