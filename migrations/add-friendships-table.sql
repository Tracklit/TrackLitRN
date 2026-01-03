-- Migration: Add friendships table
-- Date: 2025-12-19

CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Migrate existing friend data from notifications to friendships table
-- This creates bidirectional friendships based on accepted friend notifications
INSERT INTO friendships (user_id, friend_id, status, created_at)
SELECT DISTINCT 
  LEAST(n.user_id, n.related_id) as user_id,
  GREATEST(n.user_id, n.related_id) as friend_id,
  'accepted' as status,
  n.created_at
FROM notifications n
WHERE n.type = 'friend_accepted'
  AND n.related_id IS NOT NULL
  AND n.user_id != n.related_id
ON CONFLICT (user_id, friend_id) DO NOTHING;
