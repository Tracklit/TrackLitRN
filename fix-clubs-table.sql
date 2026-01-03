-- Create clubs table if it doesn't exist
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "ownerId" INTEGER NOT NULL,
    "isPrivate" BOOLEAN DEFAULT false,
    "inviteCode" VARCHAR(50) UNIQUE,
    logo_url TEXT,
    logo_thumb_url TEXT,
    logo_medium_url TEXT,
    logo_large_url TEXT,
    banner_url TEXT,
    banner_thumb_url TEXT,
    banner_medium_url TEXT,
    banner_large_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_premium BOOLEAN DEFAULT false
);

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clubs_ownerId_users_id_fk'
    ) THEN
        ALTER TABLE clubs ADD CONSTRAINT clubs_ownerId_users_id_fk 
        FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on ownerId
CREATE INDEX IF NOT EXISTS clubs_owner_id_idx ON clubs("ownerId");
