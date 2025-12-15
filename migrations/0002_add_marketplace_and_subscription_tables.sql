-- Add Marketplace + Subscription tables required by /api/marketplace/* and subscription APIs
-- Note: This migration is safe to run multiple times (uses IF NOT EXISTS).

-- =================
-- MARKETPLACE TABLES
-- =================

CREATE TABLE IF NOT EXISTS "marketplace_listings" (
  "id" serial PRIMARY KEY,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "subtitle" text,
  "coach_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "hero_url" text,
  "price_cents" integer NOT NULL,
  "currency" text DEFAULT 'USD',
  "visibility" text DEFAULT 'draft',
  "tags" text[] DEFAULT '{}'::text[],
  "badges" text[] DEFAULT '{}'::text[],
  "rating" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "marketplace_listings_coach_id_idx" ON "marketplace_listings" ("coach_id");
CREATE INDEX IF NOT EXISTS "marketplace_listings_type_visibility_idx" ON "marketplace_listings" ("type", "visibility");

-- Program-specific listing details
CREATE TABLE IF NOT EXISTS "program_listings" (
  "id" serial PRIMARY KEY,
  "listing_id" integer NOT NULL REFERENCES "marketplace_listings"("id") ON DELETE CASCADE,
  "program_id" integer NOT NULL REFERENCES "training_programs"("id") ON DELETE CASCADE,
  "duration_weeks" integer NOT NULL,
  "level" text NOT NULL,
  "category" text,
  "compare_at_price_cents" integer
);

CREATE UNIQUE INDEX IF NOT EXISTS "program_listings_listing_id_uniq" ON "program_listings" ("listing_id");
CREATE INDEX IF NOT EXISTS "program_listings_program_id_idx" ON "program_listings" ("program_id");

-- Consulting-specific listing details
CREATE TABLE IF NOT EXISTS "consulting_listings" (
  "id" serial PRIMARY KEY,
  "listing_id" integer NOT NULL REFERENCES "marketplace_listings"("id") ON DELETE CASCADE,
  "description" text,
  "slot_length_min" integer NOT NULL,
  "price_per_slot_cents" integer NOT NULL,
  "max_participants" integer DEFAULT 1,
  "delivery_format" text NOT NULL,
  "requirements" text,
  "what_you_get" text,
  "session_duration_minutes" integer NOT NULL,
  "category" text NOT NULL,
  "availability" text DEFAULT 'available',
  "buffer_min" integer DEFAULT 15,
  "group_max" integer DEFAULT 1,
  "reschedule_policy" text DEFAULT 'moderate',
  "meeting_link_template" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "consulting_listings_listing_id_uniq" ON "consulting_listings" ("listing_id");

-- Individual consulting time slots
CREATE TABLE IF NOT EXISTS "consulting_slots" (
  "id" serial PRIMARY KEY,
  "consulting_listing_id" integer NOT NULL REFERENCES "consulting_listings"("id") ON DELETE CASCADE,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "available" boolean DEFAULT true,
  "max_seats" integer DEFAULT 1,
  "booked_seats" integer DEFAULT 0,
  "meeting_link" text,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "consulting_slots_listing_id_idx" ON "consulting_slots" ("consulting_listing_id");
CREATE INDEX IF NOT EXISTS "consulting_slots_start_time_idx" ON "consulting_slots" ("start_time");

-- Shopping cart items
CREATE TABLE IF NOT EXISTS "marketplace_cart_items" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" integer NOT NULL REFERENCES "marketplace_listings"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "quantity" integer DEFAULT 1,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "marketplace_cart_items_user_id_idx" ON "marketplace_cart_items" ("user_id");
CREATE INDEX IF NOT EXISTS "marketplace_cart_items_listing_id_idx" ON "marketplace_cart_items" ("listing_id");

-- Orders
CREATE TABLE IF NOT EXISTS "marketplace_orders" (
  "id" serial PRIMARY KEY,
  "buyer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subtotal_cents" integer NOT NULL,
  "platform_fee_cents" integer NOT NULL,
  "tax_cents" integer DEFAULT 0,
  "total_cents" integer NOT NULL,
  "currency" text DEFAULT 'USD',
  "status" text DEFAULT 'pending',
  "stripe_payment_intent_id" text,
  "buyer_subscription_tier" text,
  "created_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "marketplace_orders_buyer_id_idx" ON "marketplace_orders" ("buyer_id");
CREATE INDEX IF NOT EXISTS "marketplace_orders_status_idx" ON "marketplace_orders" ("status");

-- Order items
CREATE TABLE IF NOT EXISTS "marketplace_order_items" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "marketplace_orders"("id") ON DELETE CASCADE,
  "listing_id" integer NOT NULL REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT,
  "seller_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "quantity" integer DEFAULT 1,
  "unit_price_cents" integer NOT NULL,
  "total_price_cents" integer NOT NULL,
  "metadata" jsonb,
  "status" text DEFAULT 'pending',
  "fulfilled_at" timestamp
);

CREATE INDEX IF NOT EXISTS "marketplace_order_items_order_id_idx" ON "marketplace_order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "marketplace_order_items_listing_id_idx" ON "marketplace_order_items" ("listing_id");
CREATE INDEX IF NOT EXISTS "marketplace_order_items_seller_id_idx" ON "marketplace_order_items" ("seller_id");

-- Reviews
CREATE TABLE IF NOT EXISTS "marketplace_reviews" (
  "id" serial PRIMARY KEY,
  "listing_id" integer NOT NULL REFERENCES "marketplace_listings"("id") ON DELETE CASCADE,
  "reviewer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" integer REFERENCES "marketplace_orders"("id") ON DELETE SET NULL,
  "rating" integer NOT NULL,
  "title" text,
  "content" text,
  "tags" text[] DEFAULT '{}'::text[],
  "is_verified_purchase" boolean DEFAULT false,
  "helpful_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "marketplace_reviews_listing_id_idx" ON "marketplace_reviews" ("listing_id");
CREATE INDEX IF NOT EXISTS "marketplace_reviews_reviewer_id_idx" ON "marketplace_reviews" ("reviewer_id");

-- =================
-- USER SUBSCRIPTIONS
-- =================

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
  "id" serial PRIMARY KEY,
  "coach_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL DEFAULT 'Coaching Subscription',
  "description" text NOT NULL DEFAULT 'Get personalized coaching and training programs',
  "price_amount" integer NOT NULL DEFAULT 0,
  "price_currency" text NOT NULL DEFAULT 'USD',
  "price_interval" text NOT NULL DEFAULT 'month',
  "is_active" boolean DEFAULT true,
  "stripe_product_id" text,
  "stripe_price_id" text,
  "included_programs" text[] DEFAULT '{}'::text[],
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_subscriptions_coach_id_idx" ON "user_subscriptions" ("coach_id");

CREATE TABLE IF NOT EXISTS "user_subscription_purchases" (
  "id" serial PRIMARY KEY,
  "subscription_id" integer NOT NULL REFERENCES "user_subscriptions"("id") ON DELETE CASCADE,
  "subscriber_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "coach_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text DEFAULT 'active',
  "stripe_subscription_id" text,
  "stripe_customer_id" text,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "platform_fee_percentage" integer NOT NULL DEFAULT 22,
  "total_amount" integer NOT NULL,
  "platform_fee_amount" integer NOT NULL,
  "coach_amount" integer NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_subscription_purchases_subscription_id_idx" ON "user_subscription_purchases" ("subscription_id");
CREATE INDEX IF NOT EXISTS "user_subscription_purchases_subscriber_id_idx" ON "user_subscription_purchases" ("subscriber_id");
CREATE INDEX IF NOT EXISTS "user_subscription_purchases_coach_id_idx" ON "user_subscription_purchases" ("coach_id");

CREATE TABLE IF NOT EXISTS "subscription_programs" (
  "id" serial PRIMARY KEY,
  "subscription_id" integer NOT NULL REFERENCES "user_subscriptions"("id") ON DELETE CASCADE,
  "program_id" integer NOT NULL REFERENCES "training_programs"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_programs_subscription_program_uniq" ON "subscription_programs" ("subscription_id", "program_id");
CREATE INDEX IF NOT EXISTS "subscription_programs_subscription_id_idx" ON "subscription_programs" ("subscription_id");
CREATE INDEX IF NOT EXISTS "subscription_programs_program_id_idx" ON "subscription_programs" ("program_id");
