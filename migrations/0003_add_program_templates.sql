-- Add template support to training_programs table
-- This migration adds fields to support saving programs as reusable templates

-- Add isTemplate column to mark programs as templates
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add templateSourceId to track which template a program was created from
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS template_source_id INTEGER;

-- Add startDate column for programs
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

-- Create an index on isTemplate for faster template queries
CREATE INDEX IF NOT EXISTS idx_training_programs_is_template ON training_programs(is_template) WHERE is_template = TRUE;

-- Create an index on userId and isTemplate for fetching user's templates
CREATE INDEX IF NOT EXISTS idx_training_programs_user_templates ON training_programs(user_id, is_template) WHERE is_template = TRUE;
