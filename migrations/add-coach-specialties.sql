-- Add specialties field to users table for coach filtering
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialties TEXT[];

-- Add index for specialty filtering
CREATE INDEX IF NOT EXISTS idx_users_specialties ON users USING GIN(specialties);

-- Update existing coaches with default specialties (empty array)
UPDATE users SET specialties = '{}' WHERE specialties IS NULL AND is_coach = true;
