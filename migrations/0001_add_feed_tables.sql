-- Add Feed tables required by /api/feed routes
-- Note: This migration is safe to run multiple times (uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "feed_posts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text,
  "voice_recording_url" text,
  "voice_recording_duration" integer,
  "is_edited" boolean DEFAULT false,
  "edited_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feed_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "feed_posts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feed_likes" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "feed_posts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feed_comment_likes" (
  "id" serial PRIMARY KEY,
  "comment_id" integer NOT NULL REFERENCES "feed_comments"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS "feed_likes_post_user_uniq" ON "feed_likes" ("post_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "feed_comment_likes_comment_user_uniq" ON "feed_comment_likes" ("comment_id", "user_id");

-- Helpful lookup indexes
CREATE INDEX IF NOT EXISTS "feed_posts_created_at_idx" ON "feed_posts" ("created_at");
CREATE INDEX IF NOT EXISTS "feed_comments_post_id_idx" ON "feed_comments" ("post_id");
CREATE INDEX IF NOT EXISTS "feed_likes_post_id_idx" ON "feed_likes" ("post_id");
CREATE INDEX IF NOT EXISTS "feed_comment_likes_comment_id_idx" ON "feed_comment_likes" ("comment_id");


