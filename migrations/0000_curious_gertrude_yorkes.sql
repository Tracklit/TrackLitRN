-- Current sql file was generated after introspecting the database
-- Migration uncommented and ready for execution
CREATE TABLE "coach_notes" (
        "id" serial PRIMARY KEY NOT NULL,
        "coach_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "meet_id" integer,
        "result_id" integer,
        "note" text NOT NULL,
        "is_private" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coaches" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "status" text DEFAULT 'pending',
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "group_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meets" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "coach_id" integer,
        "group_id" integer,
        "name" text NOT NULL,
        "date" timestamp NOT NULL,
        "location" text NOT NULL,
        "coordinates" json,
        "events" text[],
        "warmup_time" integer DEFAULT 60,
        "arrival_time" integer DEFAULT 90,
        "status" text DEFAULT 'upcoming',
        "is_coach_assigned" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "website_url" text
);
--> statement-breakpoint
CREATE TABLE "practice_programs" (
        "id" serial PRIMARY KEY NOT NULL,
        "coach_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "intensity" integer NOT NULL,
        "volume" integer NOT NULL,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp,
        "is_public" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "athlete_groups" (
        "id" serial PRIMARY KEY NOT NULL,
        "coach_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "results" (
        "id" serial PRIMARY KEY NOT NULL,
        "meet_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "coach_id" integer,
        "event" text NOT NULL,
        "performance" real NOT NULL,
        "wind" real,
        "place" integer,
        "notes" text,
        "date" timestamp NOT NULL,
        "entered_by_coach" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
        "id" serial PRIMARY KEY NOT NULL,
        "meet_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "coach_id" integer,
        "title" text NOT NULL,
        "description" text,
        "category" text NOT NULL,
        "date" timestamp NOT NULL,
        "is_completed" boolean DEFAULT false,
        "is_coach_assigned" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" text NOT NULL,
        "password" text NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "events" text[],
        "is_premium" boolean DEFAULT false,
        "role" text DEFAULT 'athlete',
        "bio" text,
        "created_at" timestamp DEFAULT now(),
        "spikes" integer DEFAULT 0,
        "default_club_id" integer,
        "subscription_tier" text DEFAULT 'free',
        "is_coach" boolean DEFAULT false,
        "profile_image_url" text,
        "sprinthia_prompts" integer DEFAULT 1,
        "is_blocked" boolean DEFAULT false,
        "is_private" boolean DEFAULT false,
        CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer,
        "name" text NOT NULL,
        "description" text,
        "date" timestamp NOT NULL,
        "duration" integer NOT NULL,
        "intensity" integer NOT NULL,
        "volume" integer NOT NULL,
        "coach_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_exercises" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "duration" integer,
        "sets" integer,
        "reps" integer,
        "distance" integer,
        "intensity" integer NOT NULL,
        "order_index" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_completions" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "completed_at" timestamp DEFAULT now() NOT NULL,
        "satisfaction_rating" integer,
        "feeling_rating" integer,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_media" (
        "id" serial PRIMARY KEY NOT NULL,
        "completion_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "media_type" text NOT NULL,
        "media_url" text NOT NULL,
        "caption" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_questions" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "coach_id" integer NOT NULL,
        "question" text NOT NULL,
        "answer" text,
        "is_answered" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clubs" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "logo_url" text,
        "owner_id" integer NOT NULL,
        "is_private" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "invite_code" text,
        "banner_url" text,
        "is_premium" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "club_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" text DEFAULT 'member' NOT NULL,
        "joined_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "groups" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "club_id" integer,
        "created_by" integer NOT NULL,
        "is_private" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_group_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "group_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" text DEFAULT 'member' NOT NULL,
        "joined_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "status" text DEFAULT 'accepted',
        "lastSeenAt" timestamp DEFAULT now(),
        "last_read_message_id" integer,
        "is_muted" boolean DEFAULT false,
        "is_online" boolean DEFAULT false,
        "last_seen_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "group_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "message" text NOT NULL,
        "has_media" boolean DEFAULT false,
        "media_url" text,
        "media_type" text,
        "sent_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "athlete_group_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "group_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "club_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "achievement_id" integer NOT NULL,
        "progress" integer DEFAULT 0 NOT NULL,
        "is_completed" boolean DEFAULT false,
        "completion_date" timestamp,
        "times_earned" integer DEFAULT 0,
        "last_earned_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "category" text NOT NULL,
        "icon_url" text,
        "spike_reward" integer DEFAULT 10 NOT NULL,
        "is_one_time" boolean DEFAULT true NOT NULL,
        "requirement_value" integer DEFAULT 1 NOT NULL,
        "requirement_type" text NOT NULL,
        "is_hidden" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "login_streaks" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "current_streak" integer DEFAULT 0,
        "longest_streak" integer DEFAULT 0,
        "last_login_date" date,
        "streak_updated_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "login_streaks_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "spike_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "amount" integer NOT NULL,
        "balance" integer NOT NULL,
        "source" text NOT NULL,
        "source_id" integer,
        "description" text NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
        "id" serial PRIMARY KEY NOT NULL,
        "referrer_id" integer NOT NULL,
        "referred_id" integer NOT NULL,
        "referral_code" text NOT NULL,
        "status" text DEFAULT 'pending',
        "spikes_awarded" boolean DEFAULT false,
        "completed_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_purchases" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "price" integer NOT NULL,
        "is_free" boolean DEFAULT false,
        "purchased_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "program_progress" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "program_id" integer NOT NULL,
        "session_id" integer NOT NULL,
        "completed_at" timestamp NOT NULL,
        "rating" integer,
        "notes" text,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "workout_session_preview" (
        "id" serial PRIMARY KEY NOT NULL,
        "workout_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "focus_area" text,
        "intensity" text,
        "duration" integer,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "program_assignments" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer NOT NULL,
        "assigner_id" integer NOT NULL,
        "assignee_id" integer NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "assigned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "completed_at" timestamp,
        "notes" text
);
--> statement-breakpoint
CREATE TABLE "athlete_profiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "sprint_60m_100m" boolean DEFAULT false,
        "sprint_200m" boolean DEFAULT false,
        "sprint_400m" boolean DEFAULT false,
        "hurdles_100m_110m" boolean DEFAULT false,
        "hurdles_400m" boolean DEFAULT false,
        "other_event" boolean DEFAULT false,
        "other_event_name" text,
        "sprint_60m_100m_goal" real,
        "sprint_200m_goal" real,
        "sprint_400m_goal" real,
        "hurdles_100m_110m_goal" real,
        "hurdles_400m_goal" real,
        "other_event_goal" real,
        "timing_preference" text DEFAULT 'on_movement',
        "updated_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "athlete_profiles_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "workout_library" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "focus_area" text,
        "intensity" text,
        "duration" integer,
        "is_public" boolean DEFAULT false,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "category" text,
        "content" text,
        "original_user_id" integer,
        "completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "notes" text,
        "type" text DEFAULT 'manual',
        "content" jsonb,
        "is_public" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" varchar(200) NOT NULL,
        "message" text NOT NULL,
        "data" text,
        "action_url" varchar(500),
        "is_read" boolean DEFAULT false,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "related_id" integer,
        "related_type" text
);
--> statement-breakpoint
CREATE TABLE "program_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer NOT NULL,
        "workout_id" integer,
        "title" text NOT NULL,
        "description" text,
        "day_number" integer NOT NULL,
        "order_in_day" integer DEFAULT 1,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "date" text,
        "short_distance_workout" text,
        "medium_distance_workout" text,
        "long_distance_workout" text,
        "pre_activation_1" text,
        "pre_activation_2" text,
        "extra_session" text,
        "is_rest_day" boolean DEFAULT false,
        "is_completed" boolean DEFAULT false,
        "completed_at" timestamp,
        "notes" text,
        "gym_data" text[]
);
--> statement-breakpoint
CREATE TABLE "follows" (
        "id" serial PRIMARY KEY NOT NULL,
        "follower_id" integer NOT NULL,
        "following_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coach_athletes" (
        "id" serial PRIMARY KEY NOT NULL,
        "coach_id" integer NOT NULL,
        "athlete_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coaching_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "from_user_id" integer NOT NULL,
        "to_user_id" integer NOT NULL,
        "request_type" text NOT NULL,
        "status" text DEFAULT 'pending',
        "message" text,
        "created_at" timestamp DEFAULT now(),
        "responded_at" timestamp,
        CONSTRAINT "coaching_requests_request_type_check" CHECK (request_type = ANY (ARRAY['coach_invite'::text, 'athlete_request'::text])),
        CONSTRAINT "coaching_requests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text]))
);
--> statement-breakpoint
CREATE TABLE "sprinthia_conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sprinthia_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "prompt_cost" integer DEFAULT 1,
        CONSTRAINT "sprinthia_messages_role_check" CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]))
);
--> statement-breakpoint
CREATE TABLE "workout_reactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "session_id" integer NOT NULL,
        "reaction_type" text NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_shares" (
        "id" serial PRIMARY KEY NOT NULL,
        "exercise_id" integer NOT NULL,
        "from_user_id" integer NOT NULL,
        "to_user_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_library" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "file_url" text,
        "youtube_url" text,
        "youtube_video_id" text,
        "file_size" integer,
        "file_type" text,
        "duration" integer,
        "tags" text[],
        "is_public" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "type" text,
        "thumbnail_url" text,
        "mime_type" text,
        "updated_at" timestamp DEFAULT now(),
        "video_analysis_id" integer,
        "analysis_data" text
);
--> statement-breakpoint
CREATE TABLE "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "user1_id" integer NOT NULL,
        "user2_id" integer NOT NULL,
        "last_message_id" integer,
        "last_message_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "sender_id" integer NOT NULL,
        "receiver_id" integer NOT NULL,
        "content" text NOT NULL,
        "is_read" boolean DEFAULT false,
        "read_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitions" (
        "id" serial PRIMARY KEY NOT NULL,
        "external_id" integer,
        "name" text NOT NULL,
        "location" text,
        "country" text,
        "city" text,
        "ranking_category" text,
        "disciplines" text[],
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "competition_group" text,
        "competition_subgroup" text,
        "has_results" boolean DEFAULT false,
        "has_startlist" boolean DEFAULT false,
        "has_competition_information" boolean DEFAULT false,
        "website_url" text,
        "live_stream_url" text,
        "results_url" text,
        "additional_info" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "competitions_external_id_key" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "competition_events" (
        "id" serial PRIMARY KEY NOT NULL,
        "competition_id" integer,
        "external_event_id" integer,
        "event_name" text,
        "discipline_name" text,
        "discipline_code" text,
        "category" text,
        "sex" text,
        "combined" boolean DEFAULT false,
        "date" timestamp,
        "day" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_analysis" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "file_url" text NOT NULL,
        "thumbnail_url" text,
        "duration" integer,
        "file_size" integer,
        "mime_type" text NOT NULL,
        "status" text DEFAULT 'uploading',
        "analysis_data" text,
        "is_public" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "file_name" text,
        CONSTRAINT "video_analysis_status_check" CHECK (status = ANY (ARRAY['uploading'::text, 'processing'::text, 'completed'::text, 'failed'::text]))
);
--> statement-breakpoint
CREATE TABLE "athlete_competition_results" (
        "id" serial PRIMARY KEY NOT NULL,
        "competition_id" integer,
        "event_id" integer,
        "athlete_name" text,
        "athlete_id" integer,
        "country" text,
        "place" integer,
        "performance" text,
        "performance_value" integer,
        "wind" text,
        "race_number" integer,
        "race_name" text,
        "date" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_favorite_competitions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "competition_id" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "visibility" text DEFAULT 'private',
        "price" integer DEFAULT 0,
        "cover_image_url" text,
        "category" text DEFAULT 'general',
        "level" text,
        "duration" integer NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "is_uploaded_program" boolean DEFAULT false,
        "program_file_url" text,
        "program_file_type" text,
        "total_sessions" integer DEFAULT 0,
        "imported_from_sheet" boolean DEFAULT false,
        "google_sheet_url" text,
        "google_sheet_id" text,
        "price_type" text DEFAULT 'spikes',
        "stripe_product_id" text,
        "stripe_price_id" text,
        "is_text_based" boolean DEFAULT false,
        "text_content" text
);
--> statement-breakpoint
CREATE TABLE "ai_video_analyses" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "video_name" text NOT NULL,
        "analysis_type" text NOT NULL,
        "prompt" text NOT NULL,
        "response" text NOT NULL,
        "video_timestamp" real,
        "cost_spikes" integer DEFAULT 0 NOT NULL,
        "is_free_tier" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_prompt_usage" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "week_start" date NOT NULL,
        "month_start" date NOT NULL,
        "prompts_used_this_week" integer DEFAULT 0,
        "prompts_used_this_month" integer DEFAULT 0,
        "last_used_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_group_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "group_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "sender_name" text NOT NULL,
        "sender_profile_image" text,
        "text" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "edited_at" timestamp,
        "is_deleted" boolean DEFAULT false NOT NULL,
        "reply_to_id" integer,
        "message_type" text DEFAULT 'text' NOT NULL,
        "media_url" text,
        "is_pinned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_groups" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "avatar_url" text,
        "creator_id" integer NOT NULL,
        "admin_ids" integer[] DEFAULT '{}' NOT NULL,
        "member_ids" integer[] DEFAULT '{}' NOT NULL,
        "is_private" boolean DEFAULT false NOT NULL,
        "invite_code" text,
        "created_at" timestamp DEFAULT now(),
        "last_message_at" timestamp DEFAULT now(),
        "last_message" text,
        "last_message_sender_id" integer,
        "message_count" integer DEFAULT 0 NOT NULL,
        "image" text
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "message_id" integer NOT NULL,
        "message_type" text NOT NULL,
        "user_id" integer NOT NULL,
        "emoji" text DEFAULT '👍' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "message_reactions_message_id_message_type_user_id_emoji_key" UNIQUE("message_id","message_type","user_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "telegram_direct_messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "receiver_id" integer NOT NULL,
        "text" text NOT NULL,
        "reply_to_id" integer,
        "is_read" boolean DEFAULT false,
        "is_deleted" boolean DEFAULT false,
        "edited_at" timestamp,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "read_at" timestamp,
        "link_preview" jsonb,
        "message_type" text DEFAULT 'text',
        "media_url" text
);
--> statement-breakpoint
CREATE TABLE "blocked_users" (
        "id" serial PRIMARY KEY NOT NULL,
        "blocker_id" integer NOT NULL,
        "blocked_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "blocked_users_blocker_id_blocked_id_key" UNIQUE("blocker_id","blocked_id")
);
--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_athlete_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."athlete_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_athlete_id_users_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_group_id_athlete_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."athlete_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_programs" ADD CONSTRAINT "practice_programs_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_groups" ADD CONSTRAINT "athlete_groups_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_club_id_fkey" FOREIGN KEY ("default_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."practice_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_completions" ADD CONSTRAINT "practice_completions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_completions" ADD CONSTRAINT "practice_completions_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_media" ADD CONSTRAINT "practice_media_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "public"."practice_completions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_media" ADD CONSTRAINT "practice_media_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."chat_group_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_members" ADD CONSTRAINT "athlete_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."athlete_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_group_members" ADD CONSTRAINT "athlete_group_members_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_messages" ADD CONSTRAINT "club_messages_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_messages" ADD CONSTRAINT "club_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_streaks" ADD CONSTRAINT "login_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spike_transactions" ADD CONSTRAINT "spike_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_purchases" ADD CONSTRAINT "program_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_progress" ADD CONSTRAINT "program_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_progress" ADD CONSTRAINT "program_progress_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_progress" ADD CONSTRAINT "program_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."program_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session_preview" ADD CONSTRAINT "workout_session_preview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_assigner_id_fkey" FOREIGN KEY ("assigner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_library" ADD CONSTRAINT "workout_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_library" ADD CONSTRAINT "workout_library_original_user_id_fkey" FOREIGN KEY ("original_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_athletes" ADD CONSTRAINT "coach_athletes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_athletes" ADD CONSTRAINT "coach_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_requests" ADD CONSTRAINT "coaching_requests_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_requests" ADD CONSTRAINT "coaching_requests_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprinthia_conversations" ADD CONSTRAINT "sprinthia_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprinthia_messages" ADD CONSTRAINT "sprinthia_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."sprinthia_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_reactions" ADD CONSTRAINT "workout_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_reactions" ADD CONSTRAINT "workout_reactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."program_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_shares" ADD CONSTRAINT "exercise_shares_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_library"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_shares" ADD CONSTRAINT "exercise_shares_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_shares" ADD CONSTRAINT "exercise_shares_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_library" ADD CONSTRAINT "exercise_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_library" ADD CONSTRAINT "exercise_library_video_analysis_id_fkey" FOREIGN KEY ("video_analysis_id") REFERENCES "public"."video_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_analysis" ADD CONSTRAINT "video_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_competition_results" ADD CONSTRAINT "athlete_competition_results_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_competition_results" ADD CONSTRAINT "athlete_competition_results_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."competition_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorite_competitions" ADD CONSTRAINT "user_favorite_competitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorite_competitions" ADD CONSTRAINT "user_favorite_competitions_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_video_analyses" ADD CONSTRAINT "ai_video_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompt_usage" ADD CONSTRAINT "ai_prompt_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_last_message_sender_id_fkey" FOREIGN KEY ("last_message_sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_direct_messages" ADD CONSTRAINT "telegram_direct_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_direct_messages" ADD CONSTRAINT "telegram_direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_direct_messages" ADD CONSTRAINT "telegram_direct_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_direct_messages" ADD CONSTRAINT "telegram_direct_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."telegram_direct_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire" timestamp_ops);