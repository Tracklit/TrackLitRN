-- Migration: Add missing columns to notifications table
-- This fixes the rehab program assignment feature which requires these columns

-- Add related_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'related_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_id INTEGER;
        RAISE NOTICE 'Added related_id column to notifications table';
    ELSE
        RAISE NOTICE 'related_id column already exists in notifications table';
    END IF;
END $$;

-- Add related_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'related_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_type TEXT;
        RAISE NOTICE 'Added related_type column to notifications table';
    ELSE
        RAISE NOTICE 'related_type column already exists in notifications table';
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('related_id', 'related_type');
