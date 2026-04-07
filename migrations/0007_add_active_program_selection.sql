-- Migration: Add active_program_selection to users for cross-device active program sync
-- Created: 2026-04-07
-- Stores the wrapper id from /api/my-programs (e.g. 'assigned-17', 'created-42', or a bare purchase int as text).
-- No foreign key — the wrapper id is synthetic and not a real row reference. Client-side fallback
-- gracefully handles stale values by falling back to the first item in the programs list.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'active_program_selection'
    ) THEN
        ALTER TABLE users ADD COLUMN active_program_selection TEXT;
        RAISE NOTICE 'Added active_program_selection column to users table';
    ELSE
        RAISE NOTICE 'active_program_selection column already exists in users table';
    END IF;
END $$;
