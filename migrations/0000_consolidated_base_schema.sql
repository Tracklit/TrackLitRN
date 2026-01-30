-- CONSOLIDATED TRACKLIT DATABASE SCHEMA
-- This file contains the complete schema with ALL updates applied
-- Use this for fresh deployments instead of running migrations sequentially

-- Users table with all current fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    apple_sub TEXT UNIQUE,
    bio TEXT,
    profile_image_url TEXT,
    is_coach BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    spikes INTEGER DEFAULT 0,
    default_club_id INTEGER,
    country TEXT,
    date_of_birth TIMESTAMP,
    specialties TEXT[],
    is_blocked BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Coaches table (coach-athlete relationships)
CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(coach_id, athlete_id)
);

-- Coach notes
CREATE TABLE IF NOT EXISTS coach_notes (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coaching requests
CREATE TABLE IF NOT EXISTS coaching_requests (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    country TEXT,
    city TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Club members
CREATE TABLE IF NOT EXISTS club_members (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Programs
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category TEXT,
    difficulty_level TEXT,
    duration_weeks INTEGER,
    price DECIMAL(10, 2),
    is_published BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Program workouts
CREATE TABLE IF NOT EXISTS program_workouts (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    workout_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User programs (purchased/assigned)
CREATE TABLE IF NOT EXISTS user_programs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    is_purchased BOOLEAN DEFAULT false,
    UNIQUE(user_id, program_id)
);

-- Progress tracking
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id INTEGER REFERENCES program_workouts(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    performance_data JSONB
);

-- Chat groups
CREATE TABLE IF NOT EXISTS chat_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_direct BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file', 'program')),
    media_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feed posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace/Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'star', 'pro')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- World Athletics results
CREATE TABLE IF NOT EXISTS world_athletics_results (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER,
    competition_name TEXT,
    competition_date DATE,
    event TEXT,
    result TEXT,
    country TEXT,
    place INTEGER,
    indoor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_coach ON users(is_coach);
CREATE INDEX IF NOT EXISTS idx_users_specialties ON users USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_coaches_coach_id ON coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaches_athlete_id ON coaches(athlete_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Comments
COMMENT ON TABLE friendships IS 'Manages friend connections between users';
COMMENT ON TABLE coaches IS 'Manages coach-athlete relationships';
COMMENT ON COLUMN users.specialties IS 'Array of track and field coaching specialties';
COMMENT ON COLUMN users.country IS 'User country for profile';
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth for profile';
