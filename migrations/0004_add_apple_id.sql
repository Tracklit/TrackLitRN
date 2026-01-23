-- Migration: Add apple_id column for Sign in with Apple
-- Created: 2026-01-23

-- Add apple_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;

-- Create index for faster lookups by apple_id
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;
