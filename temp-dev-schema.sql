--
-- PostgreSQL database dump
--

\restrict 9lWr4dFmIR2RPbNypv4LPyoktyOYgYa05aoBTzFtYXd9aLcIefj1spdLctqeHo8

-- Dumped from database version 15.14
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    icon_url text,
    spike_reward integer DEFAULT 10 NOT NULL,
    is_one_time boolean DEFAULT true NOT NULL,
    requirement_value integer DEFAULT 1 NOT NULL,
    requirement_type text NOT NULL,
    is_hidden boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: ai_prompt_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_prompt_usage (
    id integer NOT NULL,
    user_id integer NOT NULL,
    week_start date NOT NULL,
    month_start date NOT NULL,
    prompts_used_this_week integer DEFAULT 0,
    prompts_used_this_month integer DEFAULT 0,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_prompt_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_prompt_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_prompt_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_prompt_usage_id_seq OWNED BY public.ai_prompt_usage.id;


--
-- Name: ai_video_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_video_analyses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    video_name text NOT NULL,
    analysis_type text NOT NULL,
    prompt text NOT NULL,
    response text NOT NULL,
    video_timestamp real,
    cost_spikes integer DEFAULT 0 NOT NULL,
    is_free_tier boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_video_analyses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_video_analyses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_video_analyses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_video_analyses_id_seq OWNED BY public.ai_video_analyses.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    user_id integer,
    key_hash character varying(64) NOT NULL,
    name character varying(200),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone,
    is_active boolean DEFAULT true
);


--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: athlete_competition_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.athlete_competition_results (
    id integer NOT NULL,
    competition_id integer,
    event_id integer,
    athlete_name text,
    athlete_id integer,
    country text,
    place integer,
    performance text,
    performance_value integer,
    wind text,
    race_number integer,
    race_name text,
    date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: athlete_competition_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.athlete_competition_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: athlete_competition_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.athlete_competition_results_id_seq OWNED BY public.athlete_competition_results.id;


--
-- Name: athlete_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.athlete_group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    athlete_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: athlete_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.athlete_group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: athlete_group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.athlete_group_members_id_seq OWNED BY public.athlete_group_members.id;


--
-- Name: athlete_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.athlete_groups (
    id integer NOT NULL,
    coach_id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: athlete_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.athlete_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: athlete_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.athlete_groups_id_seq OWNED BY public.athlete_groups.id;


--
-- Name: athlete_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.athlete_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    sprint_60m_100m boolean DEFAULT false,
    sprint_200m boolean DEFAULT false,
    sprint_400m boolean DEFAULT false,
    hurdles_100m_110m boolean DEFAULT false,
    hurdles_400m boolean DEFAULT false,
    other_event boolean DEFAULT false,
    other_event_name text,
    sprint_60m_100m_goal real,
    sprint_200m_goal real,
    sprint_400m_goal real,
    hurdles_100m_110m_goal real,
    hurdles_400m_goal real,
    other_event_goal real,
    timing_preference text DEFAULT 'on_movement'::text,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: athlete_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.athlete_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: athlete_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.athlete_profiles_id_seq OWNED BY public.athlete_profiles.id;


--
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_users (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: blocked_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blocked_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blocked_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blocked_users_id_seq OWNED BY public.blocked_users.id;


--
-- Name: challenge_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_participants (
    participant_id integer NOT NULL,
    challenge_id integer,
    user_id character varying(255) NOT NULL,
    current_progress double precision DEFAULT 0.0,
    completed boolean DEFAULT false,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


--
-- Name: challenge_participants_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.challenge_participants_participant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: challenge_participants_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.challenge_participants_participant_id_seq OWNED BY public.challenge_participants.participant_id;


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    challenge_id integer NOT NULL,
    challenge_name character varying(255) NOT NULL,
    description text,
    challenge_type character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    goal_value double precision NOT NULL,
    goal_unit character varying(50),
    xp_reward integer DEFAULT 300,
    badge_reward character varying(255),
    is_public boolean DEFAULT true,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: challenges_challenge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.challenges_challenge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: challenges_challenge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.challenges_challenge_id_seq OWNED BY public.challenges.challenge_id;


--
-- Name: chat_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'accepted'::text,
    "lastSeenAt" timestamp without time zone DEFAULT now(),
    last_read_message_id integer,
    is_muted boolean DEFAULT false,
    is_online boolean DEFAULT false,
    last_seen_at timestamp without time zone DEFAULT now()
);


--
-- Name: chat_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_group_members_id_seq OWNED BY public.chat_group_members.id;


--
-- Name: chat_group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_group_messages (
    id integer NOT NULL,
    group_id integer NOT NULL,
    sender_id integer NOT NULL,
    sender_name text NOT NULL,
    sender_profile_image text,
    text text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    edited_at timestamp without time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    reply_to_id integer,
    message_type text DEFAULT 'text'::text NOT NULL,
    media_url text,
    is_pinned boolean DEFAULT false NOT NULL
);


--
-- Name: chat_group_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_group_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_group_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_group_messages_id_seq OWNED BY public.chat_group_messages.id;


--
-- Name: chat_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    avatar_url text,
    creator_id integer NOT NULL,
    admin_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    member_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    invite_code text,
    created_at timestamp without time zone DEFAULT now(),
    last_message_at timestamp without time zone DEFAULT now(),
    last_message text,
    last_message_sender_id integer,
    message_count integer DEFAULT 0 NOT NULL,
    image text
);


--
-- Name: chat_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_groups_id_seq OWNED BY public.chat_groups.id;


--
-- Name: club_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_members (
    id integer NOT NULL,
    club_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: club_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.club_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: club_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.club_members_id_seq OWNED BY public.club_members.id;


--
-- Name: club_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_messages (
    id integer NOT NULL,
    club_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: club_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.club_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: club_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.club_messages_id_seq OWNED BY public.club_messages.id;


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    owner_id integer NOT NULL,
    is_private boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    invite_code text,
    banner_url text,
    is_premium boolean DEFAULT false,
    logo_thumb_url text,
    logo_medium_url text,
    logo_large_url text,
    banner_thumb_url text,
    banner_medium_url text,
    banner_large_url text
);


--
-- Name: clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clubs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clubs_id_seq OWNED BY public.clubs.id;


--
-- Name: coach_athletes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_athletes (
    id integer NOT NULL,
    coach_email character varying(255) NOT NULL,
    athlete_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: coach_athletes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coach_athletes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coach_athletes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coach_athletes_id_seq OWNED BY public.coach_athletes.id;


--
-- Name: coach_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_notes (
    id integer NOT NULL,
    coach_id integer NOT NULL,
    athlete_id integer NOT NULL,
    meet_id integer,
    result_id integer,
    note text NOT NULL,
    is_private boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: coach_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coach_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coach_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coach_notes_id_seq OWNED BY public.coach_notes.id;


--
-- Name: coaches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaches (
    id integer NOT NULL,
    user_id integer NOT NULL,
    athlete_id integer NOT NULL,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: coaches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coaches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coaches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coaches_id_seq OWNED BY public.coaches.id;


--
-- Name: coaching_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaching_requests (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    request_type text NOT NULL,
    status text DEFAULT 'pending'::text,
    message text,
    created_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone,
    CONSTRAINT coaching_requests_request_type_check CHECK ((request_type = ANY (ARRAY['coach_invite'::text, 'athlete_request'::text]))),
    CONSTRAINT coaching_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: coaching_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coaching_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coaching_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coaching_requests_id_seq OWNED BY public.coaching_requests.id;


--
-- Name: competition_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competition_events (
    id integer NOT NULL,
    competition_id integer,
    external_event_id integer,
    event_name text,
    discipline_name text,
    discipline_code text,
    category text,
    sex text,
    combined boolean DEFAULT false,
    date timestamp without time zone,
    day integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: competition_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competition_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competition_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competition_events_id_seq OWNED BY public.competition_events.id;


--
-- Name: competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitions (
    id integer NOT NULL,
    external_id integer,
    name text NOT NULL,
    location text,
    country text,
    city text,
    ranking_category text,
    disciplines text[],
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    competition_group text,
    competition_subgroup text,
    has_results boolean DEFAULT false,
    has_startlist boolean DEFAULT false,
    has_competition_information boolean DEFAULT false,
    website_url text,
    live_stream_url text,
    results_url text,
    additional_info text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: competitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competitions_id_seq OWNED BY public.competitions.id;


--
-- Name: consulting_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consulting_listings (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    description text,
    slot_length_min integer NOT NULL,
    price_per_slot_cents integer NOT NULL,
    max_participants integer DEFAULT 1,
    delivery_format text NOT NULL,
    requirements text,
    what_you_get text,
    session_duration_minutes integer NOT NULL,
    category text NOT NULL,
    availability text DEFAULT 'available'::text,
    buffer_min integer DEFAULT 15,
    group_max integer DEFAULT 1,
    reschedule_policy text DEFAULT 'moderate'::text,
    meeting_link_template text
);


--
-- Name: consulting_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consulting_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consulting_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consulting_listings_id_seq OWNED BY public.consulting_listings.id;


--
-- Name: consulting_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consulting_slots (
    id integer NOT NULL,
    consulting_listing_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    available boolean DEFAULT true,
    max_seats integer DEFAULT 1,
    booked_seats integer DEFAULT 0,
    meeting_link text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: consulting_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consulting_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consulting_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consulting_slots_id_seq OWNED BY public.consulting_slots.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    last_message_id integer,
    last_message_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: data_access_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_access_logs (
    log_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    accessed_by character varying(255) NOT NULL,
    purpose text,
    data_categories jsonb,
    access_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: data_access_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_access_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_access_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_access_logs_log_id_seq OWNED BY public.data_access_logs.log_id;


--
-- Name: deletion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deletion_requests (
    request_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    verification_code character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


--
-- Name: deletion_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deletion_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deletion_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deletion_requests_request_id_seq OWNED BY public.deletion_requests.request_id;


--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direct_messages (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: direct_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.direct_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: direct_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.direct_messages_id_seq OWNED BY public.direct_messages.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    equipment_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    equipment_type character varying(100) NOT NULL,
    brand character varying(100),
    model character varying(100),
    purchase_date date,
    initial_mileage double precision DEFAULT 0.0,
    current_mileage double precision DEFAULT 0.0,
    max_mileage double precision,
    status character varying(50) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: equipment_equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_equipment_id_seq OWNED BY public.equipment.equipment_id;


--
-- Name: equipment_maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_maintenance (
    maintenance_id integer NOT NULL,
    equipment_id integer,
    maintenance_type character varying(100) NOT NULL,
    maintenance_date date NOT NULL,
    cost numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: equipment_maintenance_maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_maintenance_maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_maintenance_maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_maintenance_maintenance_id_seq OWNED BY public.equipment_maintenance.maintenance_id;


--
-- Name: equipment_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_usage (
    usage_id integer NOT NULL,
    equipment_id integer,
    user_id character varying(255) NOT NULL,
    miles_added double precision NOT NULL,
    usage_date date NOT NULL,
    session_type character varying(100),
    notes text,
    logged_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: equipment_usage_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_usage_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_usage_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_usage_usage_id_seq OWNED BY public.equipment_usage.usage_id;


--
-- Name: exercise_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_library (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    file_url text,
    youtube_url text,
    youtube_video_id text,
    file_size integer,
    file_type text,
    duration integer,
    tags text[],
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    type text,
    thumbnail_url text,
    mime_type text,
    updated_at timestamp without time zone DEFAULT now(),
    video_analysis_id integer,
    analysis_data text
);


--
-- Name: exercise_library_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercise_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercise_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercise_library_id_seq OWNED BY public.exercise_library.id;


--
-- Name: exercise_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_shares (
    id integer NOT NULL,
    exercise_id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: exercise_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercise_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercise_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercise_shares_id_seq OWNED BY public.exercise_shares.id;


--
-- Name: feed_comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feed_comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feed_comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feed_comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feed_comment_likes_id_seq OWNED BY public.feed_comment_likes.id;


--
-- Name: feed_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feed_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feed_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feed_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feed_comments_id_seq OWNED BY public.feed_comments.id;


--
-- Name: feed_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feed_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feed_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feed_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feed_likes_id_seq OWNED BY public.feed_likes.id;


--
-- Name: feed_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content text,
    voice_recording_url text,
    voice_recording_duration integer,
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feed_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feed_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feed_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feed_posts_id_seq OWNED BY public.feed_posts.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    user_id integer NOT NULL,
    friend_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    athlete_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_messages (
    id integer NOT NULL,
    group_id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    has_media boolean DEFAULT false,
    media_url text,
    media_type text,
    sent_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: group_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_messages_id_seq OWNED BY public.group_messages.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    club_id integer,
    created_by integer NOT NULL,
    is_private boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    notes text,
    type text DEFAULT 'manual'::text,
    content jsonb,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_entries_id_seq OWNED BY public.journal_entries.id;


--
-- Name: knowledge_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_library (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    summary text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    url character varying(1000),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: knowledge_library_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_library_id_seq OWNED BY public.knowledge_library.id;


--
-- Name: login_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_login_date date,
    streak_updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: login_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_streaks_id_seq OWNED BY public.login_streaks.id;


--
-- Name: marketplace_cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_cart_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    listing_id integer NOT NULL,
    type text NOT NULL,
    quantity integer DEFAULT 1,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: marketplace_cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_cart_items_id_seq OWNED BY public.marketplace_cart_items.id;


--
-- Name: marketplace_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_listings (
    id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    subtitle text,
    coach_id integer NOT NULL,
    hero_url text,
    price_cents integer NOT NULL,
    currency text DEFAULT 'USD'::text,
    visibility text DEFAULT 'draft'::text,
    tags text[] DEFAULT '{}'::text[],
    badges text[] DEFAULT '{}'::text[],
    rating jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: marketplace_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_listings_id_seq OWNED BY public.marketplace_listings.id;


--
-- Name: marketplace_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    listing_id integer NOT NULL,
    seller_id integer NOT NULL,
    type text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price_cents integer NOT NULL,
    total_price_cents integer NOT NULL,
    metadata jsonb,
    status text DEFAULT 'pending'::text,
    fulfilled_at timestamp without time zone
);


--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_order_items_id_seq OWNED BY public.marketplace_order_items.id;


--
-- Name: marketplace_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_orders (
    id integer NOT NULL,
    buyer_id integer NOT NULL,
    subtotal_cents integer NOT NULL,
    platform_fee_cents integer NOT NULL,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    currency text DEFAULT 'USD'::text,
    status text DEFAULT 'pending'::text,
    stripe_payment_intent_id text,
    buyer_subscription_tier text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_orders_id_seq OWNED BY public.marketplace_orders.id;


--
-- Name: marketplace_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_reviews (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    order_id integer,
    rating integer NOT NULL,
    title text,
    content text,
    tags text[] DEFAULT '{}'::text[],
    is_verified_purchase boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: marketplace_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_reviews_id_seq OWNED BY public.marketplace_reviews.id;


--
-- Name: meets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    coach_id integer,
    group_id integer,
    name text NOT NULL,
    date timestamp without time zone NOT NULL,
    location text NOT NULL,
    coordinates json,
    events text[],
    warmup_time integer DEFAULT 60,
    arrival_time integer DEFAULT 90,
    status text DEFAULT 'upcoming'::text,
    is_coach_assigned boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    website_url text
);


--
-- Name: meets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meets_id_seq OWNED BY public.meets.id;


--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_reactions (
    id integer NOT NULL,
    message_id integer NOT NULL,
    message_type text NOT NULL,
    user_id integer NOT NULL,
    emoji text DEFAULT '👍'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: message_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_reactions_id_seq OWNED BY public.message_reactions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    data text,
    action_url character varying(500),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    related_id integer,
    related_type text
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: practice_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_completions (
    id integer NOT NULL,
    session_id integer NOT NULL,
    athlete_id integer NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL,
    satisfaction_rating integer,
    feeling_rating integer,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_completions_id_seq OWNED BY public.practice_completions.id;


--
-- Name: practice_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_exercises (
    id integer NOT NULL,
    session_id integer NOT NULL,
    name text NOT NULL,
    description text,
    duration integer,
    sets integer,
    reps integer,
    distance integer,
    intensity integer NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_exercises_id_seq OWNED BY public.practice_exercises.id;


--
-- Name: practice_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_media (
    id integer NOT NULL,
    completion_id integer NOT NULL,
    athlete_id integer NOT NULL,
    media_type text NOT NULL,
    media_url text NOT NULL,
    caption text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_media_id_seq OWNED BY public.practice_media.id;


--
-- Name: practice_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_programs (
    id integer NOT NULL,
    coach_id integer NOT NULL,
    name text NOT NULL,
    description text,
    intensity integer NOT NULL,
    volume integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_programs_id_seq OWNED BY public.practice_programs.id;


--
-- Name: practice_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_questions (
    id integer NOT NULL,
    session_id integer NOT NULL,
    athlete_id integer NOT NULL,
    coach_id integer NOT NULL,
    question text NOT NULL,
    answer text,
    is_answered boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_questions_id_seq OWNED BY public.practice_questions.id;


--
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_sessions (
    id integer NOT NULL,
    program_id integer,
    name text NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    duration integer NOT NULL,
    intensity integer NOT NULL,
    volume integer NOT NULL,
    coach_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: practice_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: practice_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_sessions_id_seq OWNED BY public.practice_sessions.id;


--
-- Name: program_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_assignments (
    id integer NOT NULL,
    program_id integer NOT NULL,
    assigner_id integer NOT NULL,
    assignee_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    notes text
);


--
-- Name: program_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.program_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: program_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.program_assignments_id_seq OWNED BY public.program_assignments.id;


--
-- Name: program_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_listings (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    program_id integer NOT NULL,
    duration_weeks integer NOT NULL,
    level text NOT NULL,
    category text,
    compare_at_price_cents integer
);


--
-- Name: program_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.program_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: program_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.program_listings_id_seq OWNED BY public.program_listings.id;


--
-- Name: program_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    program_id integer NOT NULL,
    session_id integer NOT NULL,
    completed_at timestamp without time zone NOT NULL,
    rating integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: program_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.program_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: program_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.program_progress_id_seq OWNED BY public.program_progress.id;


--
-- Name: program_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_purchases (
    id integer NOT NULL,
    program_id integer NOT NULL,
    user_id integer NOT NULL,
    price integer NOT NULL,
    is_free boolean DEFAULT false,
    purchased_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: program_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.program_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: program_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.program_purchases_id_seq OWNED BY public.program_purchases.id;


--
-- Name: program_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_sessions (
    id integer NOT NULL,
    program_id integer NOT NULL,
    workout_id integer,
    title text NOT NULL,
    description text,
    day_number integer NOT NULL,
    order_in_day integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date text,
    short_distance_workout text,
    medium_distance_workout text,
    long_distance_workout text,
    pre_activation_1 text,
    pre_activation_2 text,
    extra_session text,
    is_rest_day boolean DEFAULT false,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    notes text,
    gym_data text[]
);


--
-- Name: program_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.program_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: program_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.program_sessions_id_seq OWNED BY public.program_sessions.id;


--
-- Name: query_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_usage (
    id integer NOT NULL,
    user_id integer,
    endpoint character varying(100) NOT NULL,
    query_timestamp timestamp without time zone DEFAULT now(),
    tokens_consumed integer DEFAULT 0,
    subscription_tier character varying(20),
    request_cost numeric(10,6) DEFAULT 0.0
);


--
-- Name: query_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.query_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: query_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.query_usage_id_seq OWNED BY public.query_usage.id;


--
-- Name: race_checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.race_checklists (
    checklist_id integer NOT NULL,
    race_id integer,
    checklist_items jsonb NOT NULL,
    completed_items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: race_checklists_checklist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.race_checklists_checklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: race_checklists_checklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.race_checklists_checklist_id_seq OWNED BY public.race_checklists.checklist_id;


--
-- Name: race_prep_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.race_prep_plans (
    plan_id integer NOT NULL,
    race_id integer,
    week_number integer NOT NULL,
    plan_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: race_prep_plans_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.race_prep_plans_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: race_prep_plans_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.race_prep_plans_plan_id_seq OWNED BY public.race_prep_plans.plan_id;


--
-- Name: race_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.race_results (
    result_id integer NOT NULL,
    race_id integer,
    user_id character varying(255) NOT NULL,
    finish_time double precision NOT NULL,
    placement integer,
    splits jsonb,
    weather_conditions jsonb,
    notes text,
    recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: race_results_result_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.race_results_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: race_results_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.race_results_result_id_seq OWNED BY public.race_results.result_id;


--
-- Name: races; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.races (
    race_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    race_name character varying(255) NOT NULL,
    race_date date NOT NULL,
    race_distance character varying(50) NOT NULL,
    race_location character varying(255),
    goal_time double precision,
    status character varying(50) DEFAULT 'upcoming'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: races_race_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.races_race_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: races_race_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.races_race_id_seq OWNED BY public.races.race_id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_id integer NOT NULL,
    referred_id integer NOT NULL,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text,
    spikes_awarded boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id integer NOT NULL,
    meet_id integer NOT NULL,
    user_id integer NOT NULL,
    coach_id integer,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    date timestamp without time zone NOT NULL,
    is_completed boolean DEFAULT false,
    is_coach_assigned boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reminders_id_seq OWNED BY public.reminders.id;


--
-- Name: results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.results (
    id integer NOT NULL,
    meet_id integer NOT NULL,
    user_id integer NOT NULL,
    coach_id integer,
    event text NOT NULL,
    performance real NOT NULL,
    wind real,
    place integer,
    notes text,
    date timestamp without time zone NOT NULL,
    entered_by_coach boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.results_id_seq OWNED BY public.results.id;


--
-- Name: schema_migrations_sql; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations_sql (
    id integer NOT NULL,
    name text NOT NULL,
    applied_at timestamp without time zone DEFAULT now()
);


--
-- Name: schema_migrations_sql_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_sql_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_sql_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_migrations_sql_id_seq OWNED BY public.schema_migrations_sql.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: spike_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spike_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount integer NOT NULL,
    balance integer NOT NULL,
    source text NOT NULL,
    source_id integer,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: spike_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spike_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spike_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spike_transactions_id_seq OWNED BY public.spike_transactions.id;


--
-- Name: sprinthia_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sprinthia_conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sprinthia_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sprinthia_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sprinthia_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sprinthia_conversations_id_seq OWNED BY public.sprinthia_conversations.id;


--
-- Name: sprinthia_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sprinthia_messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    prompt_cost integer DEFAULT 1,
    CONSTRAINT sprinthia_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: sprinthia_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sprinthia_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sprinthia_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sprinthia_messages_id_seq OWNED BY public.sprinthia_messages.id;


--
-- Name: subscription_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_programs (
    id integer NOT NULL,
    subscription_id integer NOT NULL,
    program_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscription_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_programs_id_seq OWNED BY public.subscription_programs.id;


--
-- Name: telegram_direct_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_direct_messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    text text NOT NULL,
    reply_to_id integer,
    is_read boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    edited_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone,
    link_preview jsonb,
    message_type text DEFAULT 'text'::text,
    media_url text
);


--
-- Name: telegram_direct_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.telegram_direct_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: telegram_direct_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.telegram_direct_messages_id_seq OWNED BY public.telegram_direct_messages.id;


--
-- Name: training_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_programs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    visibility text DEFAULT 'private'::text,
    price integer DEFAULT 0,
    cover_image_url text,
    category text DEFAULT 'general'::text,
    level text,
    duration integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_uploaded_program boolean DEFAULT false,
    program_file_url text,
    program_file_type text,
    total_sessions integer DEFAULT 0,
    imported_from_sheet boolean DEFAULT false,
    google_sheet_url text,
    google_sheet_id text,
    price_type text DEFAULT 'spikes'::text,
    stripe_product_id text,
    stripe_price_id text,
    is_text_based boolean DEFAULT false,
    text_content text,
    is_template boolean DEFAULT false,
    template_source_id integer,
    start_date timestamp without time zone
);


--
-- Name: training_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_programs_id_seq OWNED BY public.training_programs.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false,
    completion_date timestamp without time zone,
    times_earned integer DEFAULT 0,
    last_earned_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_favorite_competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorite_competitions (
    id integer NOT NULL,
    user_id integer,
    competition_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_favorite_competitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_favorite_competitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_favorite_competitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_favorite_competitions_id_seq OWNED BY public.user_favorite_competitions.id;


--
-- Name: user_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_levels (
    user_id character varying(255) NOT NULL,
    total_xp integer DEFAULT 0,
    current_level integer DEFAULT 1,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_subscription_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscription_purchases (
    id integer NOT NULL,
    subscription_id integer NOT NULL,
    subscriber_id integer NOT NULL,
    coach_id integer NOT NULL,
    status text DEFAULT 'active'::text,
    stripe_subscription_id text,
    stripe_customer_id text,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    cancel_at_period_end boolean DEFAULT false,
    platform_fee_percentage integer DEFAULT 22 NOT NULL,
    total_amount integer NOT NULL,
    platform_fee_amount integer NOT NULL,
    coach_amount integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_subscription_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_subscription_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_subscription_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_subscription_purchases_id_seq OWNED BY public.user_subscription_purchases.id;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id integer NOT NULL,
    coach_id integer NOT NULL,
    title text DEFAULT 'Coaching Subscription'::text NOT NULL,
    description text DEFAULT 'Get personalized coaching and training programs'::text NOT NULL,
    price_amount integer DEFAULT 0 NOT NULL,
    price_currency text DEFAULT 'USD'::text NOT NULL,
    price_interval text DEFAULT 'month'::text NOT NULL,
    is_active boolean DEFAULT true,
    stripe_product_id text,
    stripe_price_id text,
    included_programs text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_subscriptions_id_seq OWNED BY public.user_subscriptions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    events text[],
    is_premium boolean DEFAULT false,
    role text DEFAULT 'athlete'::text,
    bio text,
    created_at timestamp without time zone DEFAULT now(),
    spikes integer DEFAULT 0,
    default_club_id integer,
    subscription_tier text DEFAULT 'free'::text,
    is_coach boolean DEFAULT false,
    profile_image_url text,
    sprinthia_prompts integer DEFAULT 1,
    is_blocked boolean DEFAULT false,
    is_private boolean DEFAULT false,
    sprinthia_programs_created integer DEFAULT 0,
    sprinthia_regenerations_used integer DEFAULT 0,
    country text,
    date_of_birth timestamp without time zone,
    specialties text[],
    age integer,
    gender character varying(50),
    training_goal text,
    injury_status character varying(255) DEFAULT 'none'::character varying,
    sleep_hours numeric(3,1) DEFAULT 7.0,
    sleep_quality character varying(50) DEFAULT 'good'::character varying,
    training_days_per_week integer DEFAULT 3,
    mood character varying(50) DEFAULT 'neutral'::character varying,
    streak_count integer DEFAULT 0,
    badges text[],
    coach_mode character varying(50) DEFAULT 'supportive'::character varying,
    apple_id text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: video_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_analysis (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    file_url text NOT NULL,
    thumbnail_url text,
    duration integer,
    file_size integer,
    mime_type text NOT NULL,
    status text DEFAULT 'uploading'::text,
    analysis_data text,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    file_name text,
    CONSTRAINT video_analysis_status_check CHECK ((status = ANY (ARRAY['uploading'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: video_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_analysis_id_seq OWNED BY public.video_analysis.id;


--
-- Name: virtual_race_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.virtual_race_participants (
    participant_id integer NOT NULL,
    virtual_race_id integer,
    user_id character varying(255) NOT NULL,
    registered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completion_time double precision,
    completed_at timestamp without time zone,
    placement integer,
    proof_data jsonb
);


--
-- Name: virtual_race_participants_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.virtual_race_participants_participant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: virtual_race_participants_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.virtual_race_participants_participant_id_seq OWNED BY public.virtual_race_participants.participant_id;


--
-- Name: virtual_races; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.virtual_races (
    virtual_race_id integer NOT NULL,
    race_name character varying(255) NOT NULL,
    description text,
    distance character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    entry_xp_cost integer DEFAULT 0,
    completion_xp_reward integer DEFAULT 500,
    prize_pool jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: virtual_races_virtual_race_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.virtual_races_virtual_race_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: virtual_races_virtual_race_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.virtual_races_virtual_race_id_seq OWNED BY public.virtual_races.virtual_race_id;


--
-- Name: warmup_routines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warmup_routines (
    routine_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    routine_name character varying(255) NOT NULL,
    exercises jsonb NOT NULL,
    duration_minutes integer,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: warmup_routines_routine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warmup_routines_routine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warmup_routines_routine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warmup_routines_routine_id_seq OWNED BY public.warmup_routines.routine_id;


--
-- Name: workout_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_library (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    focus_area text,
    intensity text,
    duration integer,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category text,
    content text,
    original_user_id integer,
    completed_at timestamp without time zone
);


--
-- Name: workout_library_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workout_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workout_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workout_library_id_seq OWNED BY public.workout_library.id;


--
-- Name: workout_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_reactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_id integer NOT NULL,
    reaction_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: workout_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workout_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workout_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workout_reactions_id_seq OWNED BY public.workout_reactions.id;


--
-- Name: workout_session_preview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_session_preview (
    id integer NOT NULL,
    workout_id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    focus_area text,
    intensity text,
    duration integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: workout_session_preview_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workout_session_preview_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workout_session_preview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workout_session_preview_id_seq OWNED BY public.workout_session_preview.id;


--
-- Name: xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_transactions (
    transaction_id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    xp_amount integer NOT NULL,
    action_type character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: xp_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.xp_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: xp_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.xp_transactions_transaction_id_seq OWNED BY public.xp_transactions.transaction_id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: ai_prompt_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_usage ALTER COLUMN id SET DEFAULT nextval('public.ai_prompt_usage_id_seq'::regclass);


--
-- Name: ai_video_analyses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_video_analyses ALTER COLUMN id SET DEFAULT nextval('public.ai_video_analyses_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: athlete_competition_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_competition_results ALTER COLUMN id SET DEFAULT nextval('public.athlete_competition_results_id_seq'::regclass);


--
-- Name: athlete_group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_group_members ALTER COLUMN id SET DEFAULT nextval('public.athlete_group_members_id_seq'::regclass);


--
-- Name: athlete_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_groups ALTER COLUMN id SET DEFAULT nextval('public.athlete_groups_id_seq'::regclass);


--
-- Name: athlete_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_profiles ALTER COLUMN id SET DEFAULT nextval('public.athlete_profiles_id_seq'::regclass);


--
-- Name: blocked_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users ALTER COLUMN id SET DEFAULT nextval('public.blocked_users_id_seq'::regclass);


--
-- Name: challenge_participants participant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants ALTER COLUMN participant_id SET DEFAULT nextval('public.challenge_participants_participant_id_seq'::regclass);


--
-- Name: challenges challenge_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges ALTER COLUMN challenge_id SET DEFAULT nextval('public.challenges_challenge_id_seq'::regclass);


--
-- Name: chat_group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members ALTER COLUMN id SET DEFAULT nextval('public.chat_group_members_id_seq'::regclass);


--
-- Name: chat_group_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_group_messages_id_seq'::regclass);


--
-- Name: chat_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups ALTER COLUMN id SET DEFAULT nextval('public.chat_groups_id_seq'::regclass);


--
-- Name: club_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members ALTER COLUMN id SET DEFAULT nextval('public.club_members_id_seq'::regclass);


--
-- Name: club_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_messages ALTER COLUMN id SET DEFAULT nextval('public.club_messages_id_seq'::regclass);


--
-- Name: clubs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs ALTER COLUMN id SET DEFAULT nextval('public.clubs_id_seq'::regclass);


--
-- Name: coach_athletes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_athletes ALTER COLUMN id SET DEFAULT nextval('public.coach_athletes_id_seq'::regclass);


--
-- Name: coach_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes ALTER COLUMN id SET DEFAULT nextval('public.coach_notes_id_seq'::regclass);


--
-- Name: coaches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches ALTER COLUMN id SET DEFAULT nextval('public.coaches_id_seq'::regclass);


--
-- Name: coaching_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_requests ALTER COLUMN id SET DEFAULT nextval('public.coaching_requests_id_seq'::regclass);


--
-- Name: competition_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_events ALTER COLUMN id SET DEFAULT nextval('public.competition_events_id_seq'::regclass);


--
-- Name: competitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions ALTER COLUMN id SET DEFAULT nextval('public.competitions_id_seq'::regclass);


--
-- Name: consulting_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_listings ALTER COLUMN id SET DEFAULT nextval('public.consulting_listings_id_seq'::regclass);


--
-- Name: consulting_slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_slots ALTER COLUMN id SET DEFAULT nextval('public.consulting_slots_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: data_access_logs log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_access_logs ALTER COLUMN log_id SET DEFAULT nextval('public.data_access_logs_log_id_seq'::regclass);


--
-- Name: deletion_requests request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletion_requests ALTER COLUMN request_id SET DEFAULT nextval('public.deletion_requests_request_id_seq'::regclass);


--
-- Name: direct_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages ALTER COLUMN id SET DEFAULT nextval('public.direct_messages_id_seq'::regclass);


--
-- Name: equipment equipment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment ALTER COLUMN equipment_id SET DEFAULT nextval('public.equipment_equipment_id_seq'::regclass);


--
-- Name: equipment_maintenance maintenance_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance ALTER COLUMN maintenance_id SET DEFAULT nextval('public.equipment_maintenance_maintenance_id_seq'::regclass);


--
-- Name: equipment_usage usage_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_usage ALTER COLUMN usage_id SET DEFAULT nextval('public.equipment_usage_usage_id_seq'::regclass);


--
-- Name: exercise_library id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_library ALTER COLUMN id SET DEFAULT nextval('public.exercise_library_id_seq'::regclass);


--
-- Name: exercise_shares id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_shares ALTER COLUMN id SET DEFAULT nextval('public.exercise_shares_id_seq'::regclass);


--
-- Name: feed_comment_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_likes ALTER COLUMN id SET DEFAULT nextval('public.feed_comment_likes_id_seq'::regclass);


--
-- Name: feed_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments ALTER COLUMN id SET DEFAULT nextval('public.feed_comments_id_seq'::regclass);


--
-- Name: feed_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes ALTER COLUMN id SET DEFAULT nextval('public.feed_likes_id_seq'::regclass);


--
-- Name: feed_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_posts ALTER COLUMN id SET DEFAULT nextval('public.feed_posts_id_seq'::regclass);


--
-- Name: follows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows ALTER COLUMN id SET DEFAULT nextval('public.follows_id_seq'::regclass);


--
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: group_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages ALTER COLUMN id SET DEFAULT nextval('public.group_messages_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: journal_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries ALTER COLUMN id SET DEFAULT nextval('public.journal_entries_id_seq'::regclass);


--
-- Name: knowledge_library id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_library ALTER COLUMN id SET DEFAULT nextval('public.knowledge_library_id_seq'::regclass);


--
-- Name: login_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_streaks ALTER COLUMN id SET DEFAULT nextval('public.login_streaks_id_seq'::regclass);


--
-- Name: marketplace_cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_cart_items ALTER COLUMN id SET DEFAULT nextval('public.marketplace_cart_items_id_seq'::regclass);


--
-- Name: marketplace_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings ALTER COLUMN id SET DEFAULT nextval('public.marketplace_listings_id_seq'::regclass);


--
-- Name: marketplace_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items ALTER COLUMN id SET DEFAULT nextval('public.marketplace_order_items_id_seq'::regclass);


--
-- Name: marketplace_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders ALTER COLUMN id SET DEFAULT nextval('public.marketplace_orders_id_seq'::regclass);


--
-- Name: marketplace_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews ALTER COLUMN id SET DEFAULT nextval('public.marketplace_reviews_id_seq'::regclass);


--
-- Name: meets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meets ALTER COLUMN id SET DEFAULT nextval('public.meets_id_seq'::regclass);


--
-- Name: message_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions ALTER COLUMN id SET DEFAULT nextval('public.message_reactions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: practice_completions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_completions ALTER COLUMN id SET DEFAULT nextval('public.practice_completions_id_seq'::regclass);


--
-- Name: practice_exercises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_exercises ALTER COLUMN id SET DEFAULT nextval('public.practice_exercises_id_seq'::regclass);


--
-- Name: practice_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_media ALTER COLUMN id SET DEFAULT nextval('public.practice_media_id_seq'::regclass);


--
-- Name: practice_programs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_programs ALTER COLUMN id SET DEFAULT nextval('public.practice_programs_id_seq'::regclass);


--
-- Name: practice_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_questions ALTER COLUMN id SET DEFAULT nextval('public.practice_questions_id_seq'::regclass);


--
-- Name: practice_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN id SET DEFAULT nextval('public.practice_sessions_id_seq'::regclass);


--
-- Name: program_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments ALTER COLUMN id SET DEFAULT nextval('public.program_assignments_id_seq'::regclass);


--
-- Name: program_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_listings ALTER COLUMN id SET DEFAULT nextval('public.program_listings_id_seq'::regclass);


--
-- Name: program_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_progress ALTER COLUMN id SET DEFAULT nextval('public.program_progress_id_seq'::regclass);


--
-- Name: program_purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_purchases ALTER COLUMN id SET DEFAULT nextval('public.program_purchases_id_seq'::regclass);


--
-- Name: program_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sessions ALTER COLUMN id SET DEFAULT nextval('public.program_sessions_id_seq'::regclass);


--
-- Name: query_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_usage ALTER COLUMN id SET DEFAULT nextval('public.query_usage_id_seq'::regclass);


--
-- Name: race_checklists checklist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_checklists ALTER COLUMN checklist_id SET DEFAULT nextval('public.race_checklists_checklist_id_seq'::regclass);


--
-- Name: race_prep_plans plan_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_prep_plans ALTER COLUMN plan_id SET DEFAULT nextval('public.race_prep_plans_plan_id_seq'::regclass);


--
-- Name: race_results result_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_results ALTER COLUMN result_id SET DEFAULT nextval('public.race_results_result_id_seq'::regclass);


--
-- Name: races race_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races ALTER COLUMN race_id SET DEFAULT nextval('public.races_race_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Name: reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders ALTER COLUMN id SET DEFAULT nextval('public.reminders_id_seq'::regclass);


--
-- Name: results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results ALTER COLUMN id SET DEFAULT nextval('public.results_id_seq'::regclass);


--
-- Name: schema_migrations_sql id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations_sql ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_sql_id_seq'::regclass);


--
-- Name: spike_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spike_transactions ALTER COLUMN id SET DEFAULT nextval('public.spike_transactions_id_seq'::regclass);


--
-- Name: sprinthia_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_conversations ALTER COLUMN id SET DEFAULT nextval('public.sprinthia_conversations_id_seq'::regclass);


--
-- Name: sprinthia_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_messages ALTER COLUMN id SET DEFAULT nextval('public.sprinthia_messages_id_seq'::regclass);


--
-- Name: subscription_programs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_programs ALTER COLUMN id SET DEFAULT nextval('public.subscription_programs_id_seq'::regclass);


--
-- Name: telegram_direct_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages ALTER COLUMN id SET DEFAULT nextval('public.telegram_direct_messages_id_seq'::regclass);


--
-- Name: training_programs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_programs ALTER COLUMN id SET DEFAULT nextval('public.training_programs_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_favorite_competitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_competitions ALTER COLUMN id SET DEFAULT nextval('public.user_favorite_competitions_id_seq'::regclass);


--
-- Name: user_subscription_purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscription_purchases ALTER COLUMN id SET DEFAULT nextval('public.user_subscription_purchases_id_seq'::regclass);


--
-- Name: user_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.user_subscriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: video_analysis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis ALTER COLUMN id SET DEFAULT nextval('public.video_analysis_id_seq'::regclass);


--
-- Name: virtual_race_participants participant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_race_participants ALTER COLUMN participant_id SET DEFAULT nextval('public.virtual_race_participants_participant_id_seq'::regclass);


--
-- Name: virtual_races virtual_race_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_races ALTER COLUMN virtual_race_id SET DEFAULT nextval('public.virtual_races_virtual_race_id_seq'::regclass);


--
-- Name: warmup_routines routine_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warmup_routines ALTER COLUMN routine_id SET DEFAULT nextval('public.warmup_routines_routine_id_seq'::regclass);


--
-- Name: workout_library id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_library ALTER COLUMN id SET DEFAULT nextval('public.workout_library_id_seq'::regclass);


--
-- Name: workout_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_reactions ALTER COLUMN id SET DEFAULT nextval('public.workout_reactions_id_seq'::regclass);


--
-- Name: workout_session_preview id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_session_preview ALTER COLUMN id SET DEFAULT nextval('public.workout_session_preview_id_seq'::regclass);


--
-- Name: xp_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.xp_transactions_transaction_id_seq'::regclass);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_usage ai_prompt_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_usage
    ADD CONSTRAINT ai_prompt_usage_pkey PRIMARY KEY (id);


--
-- Name: ai_video_analyses ai_video_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_video_analyses
    ADD CONSTRAINT ai_video_analyses_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: athlete_competition_results athlete_competition_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_competition_results
    ADD CONSTRAINT athlete_competition_results_pkey PRIMARY KEY (id);


--
-- Name: athlete_group_members athlete_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_group_members
    ADD CONSTRAINT athlete_group_members_pkey PRIMARY KEY (id);


--
-- Name: athlete_groups athlete_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_groups
    ADD CONSTRAINT athlete_groups_pkey PRIMARY KEY (id);


--
-- Name: athlete_profiles athlete_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_profiles
    ADD CONSTRAINT athlete_profiles_pkey PRIMARY KEY (id);


--
-- Name: athlete_profiles athlete_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_profiles
    ADD CONSTRAINT athlete_profiles_user_id_key UNIQUE (user_id);


--
-- Name: blocked_users blocked_users_blocker_id_blocked_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id);


--
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);


--
-- Name: challenge_participants challenge_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_pkey PRIMARY KEY (participant_id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (challenge_id);


--
-- Name: chat_group_members chat_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_pkey PRIMARY KEY (id);


--
-- Name: chat_group_messages chat_group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_messages
    ADD CONSTRAINT chat_group_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_groups chat_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_pkey PRIMARY KEY (id);


--
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- Name: club_messages club_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_messages
    ADD CONSTRAINT club_messages_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: coach_athletes coach_athletes_coach_email_athlete_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_athletes
    ADD CONSTRAINT coach_athletes_coach_email_athlete_id_key UNIQUE (coach_email, athlete_id);


--
-- Name: coach_athletes coach_athletes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_athletes
    ADD CONSTRAINT coach_athletes_pkey PRIMARY KEY (id);


--
-- Name: coach_notes coach_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes
    ADD CONSTRAINT coach_notes_pkey PRIMARY KEY (id);


--
-- Name: coaches coaches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_pkey PRIMARY KEY (id);


--
-- Name: coaching_requests coaching_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_requests
    ADD CONSTRAINT coaching_requests_pkey PRIMARY KEY (id);


--
-- Name: competition_events competition_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_events
    ADD CONSTRAINT competition_events_pkey PRIMARY KEY (id);


--
-- Name: competitions competitions_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_external_id_key UNIQUE (external_id);


--
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- Name: consulting_listings consulting_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_listings
    ADD CONSTRAINT consulting_listings_pkey PRIMARY KEY (id);


--
-- Name: consulting_slots consulting_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_slots
    ADD CONSTRAINT consulting_slots_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: data_access_logs data_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_access_logs
    ADD CONSTRAINT data_access_logs_pkey PRIMARY KEY (log_id);


--
-- Name: deletion_requests deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletion_requests
    ADD CONSTRAINT deletion_requests_pkey PRIMARY KEY (request_id);


--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: equipment_maintenance equipment_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_pkey PRIMARY KEY (maintenance_id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (equipment_id);


--
-- Name: equipment_usage equipment_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_usage
    ADD CONSTRAINT equipment_usage_pkey PRIMARY KEY (usage_id);


--
-- Name: exercise_library exercise_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_library
    ADD CONSTRAINT exercise_library_pkey PRIMARY KEY (id);


--
-- Name: exercise_shares exercise_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_shares
    ADD CONSTRAINT exercise_shares_pkey PRIMARY KEY (id);


--
-- Name: feed_comment_likes feed_comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_likes
    ADD CONSTRAINT feed_comment_likes_pkey PRIMARY KEY (id);


--
-- Name: feed_comments feed_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_pkey PRIMARY KEY (id);


--
-- Name: feed_likes feed_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_pkey PRIMARY KEY (id);


--
-- Name: feed_posts feed_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_posts
    ADD CONSTRAINT feed_posts_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_friend_id_key UNIQUE (user_id, friend_id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: knowledge_library knowledge_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_library
    ADD CONSTRAINT knowledge_library_pkey PRIMARY KEY (id);


--
-- Name: login_streaks login_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_streaks
    ADD CONSTRAINT login_streaks_pkey PRIMARY KEY (id);


--
-- Name: login_streaks login_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_streaks
    ADD CONSTRAINT login_streaks_user_id_key UNIQUE (user_id);


--
-- Name: marketplace_cart_items marketplace_cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_cart_items
    ADD CONSTRAINT marketplace_cart_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_listings marketplace_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);


--
-- Name: marketplace_order_items marketplace_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_orders marketplace_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);


--
-- Name: marketplace_reviews marketplace_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_pkey PRIMARY KEY (id);


--
-- Name: meets meets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meets
    ADD CONSTRAINT meets_pkey PRIMARY KEY (id);


--
-- Name: message_reactions message_reactions_message_id_message_type_user_id_emoji_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_message_id_message_type_user_id_emoji_key UNIQUE (message_id, message_type, user_id, emoji);


--
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: practice_completions practice_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_completions
    ADD CONSTRAINT practice_completions_pkey PRIMARY KEY (id);


--
-- Name: practice_exercises practice_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_exercises
    ADD CONSTRAINT practice_exercises_pkey PRIMARY KEY (id);


--
-- Name: practice_media practice_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_media
    ADD CONSTRAINT practice_media_pkey PRIMARY KEY (id);


--
-- Name: practice_programs practice_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_programs
    ADD CONSTRAINT practice_programs_pkey PRIMARY KEY (id);


--
-- Name: practice_questions practice_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_questions
    ADD CONSTRAINT practice_questions_pkey PRIMARY KEY (id);


--
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (id);


--
-- Name: program_assignments program_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_pkey PRIMARY KEY (id);


--
-- Name: program_listings program_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_listings
    ADD CONSTRAINT program_listings_pkey PRIMARY KEY (id);


--
-- Name: program_progress program_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_progress
    ADD CONSTRAINT program_progress_pkey PRIMARY KEY (id);


--
-- Name: program_purchases program_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_purchases
    ADD CONSTRAINT program_purchases_pkey PRIMARY KEY (id);


--
-- Name: program_sessions program_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sessions
    ADD CONSTRAINT program_sessions_pkey PRIMARY KEY (id);


--
-- Name: query_usage query_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_usage
    ADD CONSTRAINT query_usage_pkey PRIMARY KEY (id);


--
-- Name: race_checklists race_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_checklists
    ADD CONSTRAINT race_checklists_pkey PRIMARY KEY (checklist_id);


--
-- Name: race_prep_plans race_prep_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_prep_plans
    ADD CONSTRAINT race_prep_plans_pkey PRIMARY KEY (plan_id);


--
-- Name: race_results race_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_results
    ADD CONSTRAINT race_results_pkey PRIMARY KEY (result_id);


--
-- Name: races races_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT races_pkey PRIMARY KEY (race_id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations_sql schema_migrations_sql_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations_sql
    ADD CONSTRAINT schema_migrations_sql_name_key UNIQUE (name);


--
-- Name: schema_migrations_sql schema_migrations_sql_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations_sql
    ADD CONSTRAINT schema_migrations_sql_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: spike_transactions spike_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spike_transactions
    ADD CONSTRAINT spike_transactions_pkey PRIMARY KEY (id);


--
-- Name: sprinthia_conversations sprinthia_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_conversations
    ADD CONSTRAINT sprinthia_conversations_pkey PRIMARY KEY (id);


--
-- Name: sprinthia_messages sprinthia_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_messages
    ADD CONSTRAINT sprinthia_messages_pkey PRIMARY KEY (id);


--
-- Name: subscription_programs subscription_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_programs
    ADD CONSTRAINT subscription_programs_pkey PRIMARY KEY (id);


--
-- Name: telegram_direct_messages telegram_direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages
    ADD CONSTRAINT telegram_direct_messages_pkey PRIMARY KEY (id);


--
-- Name: training_programs training_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_programs
    ADD CONSTRAINT training_programs_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_competitions user_favorite_competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_competitions
    ADD CONSTRAINT user_favorite_competitions_pkey PRIMARY KEY (id);


--
-- Name: user_levels user_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_levels
    ADD CONSTRAINT user_levels_pkey PRIMARY KEY (user_id);


--
-- Name: user_subscription_purchases user_subscription_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscription_purchases
    ADD CONSTRAINT user_subscription_purchases_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_apple_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_apple_id_key UNIQUE (apple_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: video_analysis video_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis
    ADD CONSTRAINT video_analysis_pkey PRIMARY KEY (id);


--
-- Name: virtual_race_participants virtual_race_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_race_participants
    ADD CONSTRAINT virtual_race_participants_pkey PRIMARY KEY (participant_id);


--
-- Name: virtual_races virtual_races_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_races
    ADD CONSTRAINT virtual_races_pkey PRIMARY KEY (virtual_race_id);


--
-- Name: warmup_routines warmup_routines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warmup_routines
    ADD CONSTRAINT warmup_routines_pkey PRIMARY KEY (routine_id);


--
-- Name: workout_library workout_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_library
    ADD CONSTRAINT workout_library_pkey PRIMARY KEY (id);


--
-- Name: workout_reactions workout_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_reactions
    ADD CONSTRAINT workout_reactions_pkey PRIMARY KEY (id);


--
-- Name: workout_session_preview workout_session_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_session_preview
    ADD CONSTRAINT workout_session_preview_pkey PRIMARY KEY (id);


--
-- Name: xp_transactions xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: consulting_listings_listing_id_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX consulting_listings_listing_id_uniq ON public.consulting_listings USING btree (listing_id);


--
-- Name: consulting_slots_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consulting_slots_listing_id_idx ON public.consulting_slots USING btree (consulting_listing_id);


--
-- Name: consulting_slots_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consulting_slots_start_time_idx ON public.consulting_slots USING btree (start_time);


--
-- Name: feed_comment_likes_comment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feed_comment_likes_comment_id_idx ON public.feed_comment_likes USING btree (comment_id);


--
-- Name: feed_comment_likes_comment_user_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX feed_comment_likes_comment_user_uniq ON public.feed_comment_likes USING btree (comment_id, user_id);


--
-- Name: feed_comments_post_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feed_comments_post_id_idx ON public.feed_comments USING btree (post_id);


--
-- Name: feed_likes_post_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feed_likes_post_id_idx ON public.feed_likes USING btree (post_id);


--
-- Name: feed_likes_post_user_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX feed_likes_post_user_uniq ON public.feed_likes USING btree (post_id, user_id);


--
-- Name: feed_posts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feed_posts_created_at_idx ON public.feed_posts USING btree (created_at);


--
-- Name: idx_api_keys_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_hash ON public.api_keys USING btree (key_hash) WHERE (is_active = true);


--
-- Name: idx_coach_athletes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_athletes_email ON public.coach_athletes USING btree (coach_email);


--
-- Name: idx_friendships_friend_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_friend_id ON public.friendships USING btree (friend_id);


--
-- Name: idx_friendships_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_status ON public.friendships USING btree (status);


--
-- Name: idx_friendships_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_user_id ON public.friendships USING btree (user_id);


--
-- Name: idx_knowledge_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_title ON public.knowledge_library USING gin (to_tsvector('english'::regconfig, (title)::text));


--
-- Name: idx_query_usage_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_query_usage_user_date ON public.query_usage USING btree (user_id, query_timestamp DESC);


--
-- Name: idx_training_programs_is_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_programs_is_template ON public.training_programs USING btree (is_template) WHERE (is_template = true);


--
-- Name: idx_training_programs_user_templates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_programs_user_templates ON public.training_programs USING btree (user_id, is_template) WHERE (is_template = true);


--
-- Name: idx_users_apple_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_apple_id ON public.users USING btree (apple_id) WHERE (apple_id IS NOT NULL);


--
-- Name: idx_users_specialties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_specialties ON public.users USING gin (specialties);


--
-- Name: marketplace_cart_items_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_cart_items_listing_id_idx ON public.marketplace_cart_items USING btree (listing_id);


--
-- Name: marketplace_cart_items_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_cart_items_user_id_idx ON public.marketplace_cart_items USING btree (user_id);


--
-- Name: marketplace_listings_coach_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_coach_id_idx ON public.marketplace_listings USING btree (coach_id);


--
-- Name: marketplace_listings_type_visibility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_type_visibility_idx ON public.marketplace_listings USING btree (type, visibility);


--
-- Name: marketplace_order_items_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_order_items_listing_id_idx ON public.marketplace_order_items USING btree (listing_id);


--
-- Name: marketplace_order_items_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_order_items_order_id_idx ON public.marketplace_order_items USING btree (order_id);


--
-- Name: marketplace_order_items_seller_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_order_items_seller_id_idx ON public.marketplace_order_items USING btree (seller_id);


--
-- Name: marketplace_orders_buyer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_orders_buyer_id_idx ON public.marketplace_orders USING btree (buyer_id);


--
-- Name: marketplace_orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_orders_status_idx ON public.marketplace_orders USING btree (status);


--
-- Name: marketplace_reviews_listing_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_reviews_listing_id_idx ON public.marketplace_reviews USING btree (listing_id);


--
-- Name: marketplace_reviews_reviewer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_reviews_reviewer_id_idx ON public.marketplace_reviews USING btree (reviewer_id);


--
-- Name: program_listings_listing_id_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX program_listings_listing_id_uniq ON public.program_listings USING btree (listing_id);


--
-- Name: program_listings_program_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX program_listings_program_id_idx ON public.program_listings USING btree (program_id);


--
-- Name: subscription_programs_program_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_programs_program_id_idx ON public.subscription_programs USING btree (program_id);


--
-- Name: subscription_programs_subscription_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_programs_subscription_id_idx ON public.subscription_programs USING btree (subscription_id);


--
-- Name: subscription_programs_subscription_program_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscription_programs_subscription_program_uniq ON public.subscription_programs USING btree (subscription_id, program_id);


--
-- Name: user_subscription_purchases_coach_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_subscription_purchases_coach_id_idx ON public.user_subscription_purchases USING btree (coach_id);


--
-- Name: user_subscription_purchases_subscriber_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_subscription_purchases_subscriber_id_idx ON public.user_subscription_purchases USING btree (subscriber_id);


--
-- Name: user_subscription_purchases_subscription_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_subscription_purchases_subscription_id_idx ON public.user_subscription_purchases USING btree (subscription_id);


--
-- Name: user_subscriptions_coach_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_subscriptions_coach_id_idx ON public.user_subscriptions USING btree (coach_id);


--
-- Name: ai_prompt_usage ai_prompt_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_usage
    ADD CONSTRAINT ai_prompt_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ai_video_analyses ai_video_analyses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_video_analyses
    ADD CONSTRAINT ai_video_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: athlete_competition_results athlete_competition_results_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_competition_results
    ADD CONSTRAINT athlete_competition_results_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: athlete_competition_results athlete_competition_results_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_competition_results
    ADD CONSTRAINT athlete_competition_results_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.competition_events(id) ON DELETE CASCADE;


--
-- Name: athlete_group_members athlete_group_members_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_group_members
    ADD CONSTRAINT athlete_group_members_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: athlete_group_members athlete_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_group_members
    ADD CONSTRAINT athlete_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.athlete_groups(id);


--
-- Name: athlete_groups athlete_groups_coach_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_groups
    ADD CONSTRAINT athlete_groups_coach_id_users_id_fk FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: athlete_profiles athlete_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.athlete_profiles
    ADD CONSTRAINT athlete_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: blocked_users blocked_users_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id);


--
-- Name: blocked_users blocked_users_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id);


--
-- Name: challenge_participants challenge_participants_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(challenge_id);


--
-- Name: chat_group_members chat_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;


--
-- Name: chat_group_members chat_group_members_last_read_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_last_read_message_id_fkey FOREIGN KEY (last_read_message_id) REFERENCES public.chat_group_messages(id);


--
-- Name: chat_group_members chat_group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_members
    ADD CONSTRAINT chat_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_group_messages chat_group_messages_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_messages
    ADD CONSTRAINT chat_group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;


--
-- Name: chat_group_messages chat_group_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_group_messages
    ADD CONSTRAINT chat_group_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: chat_groups chat_groups_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: chat_groups chat_groups_last_message_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_last_message_sender_id_fkey FOREIGN KEY (last_message_sender_id) REFERENCES public.users(id);


--
-- Name: club_members club_members_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id);


--
-- Name: club_members club_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: club_messages club_messages_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_messages
    ADD CONSTRAINT club_messages_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id);


--
-- Name: club_messages club_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_messages
    ADD CONSTRAINT club_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: clubs clubs_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: coach_athletes coach_athletes_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_athletes
    ADD CONSTRAINT coach_athletes_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athlete_profiles(user_id) ON DELETE CASCADE;


--
-- Name: coach_notes coach_notes_athlete_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes
    ADD CONSTRAINT coach_notes_athlete_id_users_id_fk FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: coach_notes coach_notes_coach_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes
    ADD CONSTRAINT coach_notes_coach_id_users_id_fk FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: coach_notes coach_notes_meet_id_meets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes
    ADD CONSTRAINT coach_notes_meet_id_meets_id_fk FOREIGN KEY (meet_id) REFERENCES public.meets(id);


--
-- Name: coach_notes coach_notes_result_id_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_notes
    ADD CONSTRAINT coach_notes_result_id_results_id_fk FOREIGN KEY (result_id) REFERENCES public.results(id);


--
-- Name: coaches coaches_athlete_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_athlete_id_users_id_fk FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: coaches coaches_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: coaching_requests coaching_requests_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_requests
    ADD CONSTRAINT coaching_requests_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: coaching_requests coaching_requests_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_requests
    ADD CONSTRAINT coaching_requests_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: competition_events competition_events_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_events
    ADD CONSTRAINT competition_events_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: consulting_listings consulting_listings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_listings
    ADD CONSTRAINT consulting_listings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- Name: consulting_slots consulting_slots_consulting_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consulting_slots
    ADD CONSTRAINT consulting_slots_consulting_listing_id_fkey FOREIGN KEY (consulting_listing_id) REFERENCES public.consulting_listings(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id);


--
-- Name: direct_messages direct_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: direct_messages direct_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: equipment_maintenance equipment_maintenance_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(equipment_id);


--
-- Name: equipment_usage equipment_usage_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_usage
    ADD CONSTRAINT equipment_usage_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(equipment_id);


--
-- Name: exercise_library exercise_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_library
    ADD CONSTRAINT exercise_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exercise_library exercise_library_video_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_library
    ADD CONSTRAINT exercise_library_video_analysis_id_fkey FOREIGN KEY (video_analysis_id) REFERENCES public.video_analysis(id);


--
-- Name: exercise_shares exercise_shares_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_shares
    ADD CONSTRAINT exercise_shares_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercise_library(id);


--
-- Name: exercise_shares exercise_shares_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_shares
    ADD CONSTRAINT exercise_shares_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: exercise_shares exercise_shares_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_shares
    ADD CONSTRAINT exercise_shares_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: feed_comment_likes feed_comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_likes
    ADD CONSTRAINT feed_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_comment_likes feed_comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_likes
    ADD CONSTRAINT feed_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feed_comments feed_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feed_likes feed_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id) ON DELETE CASCADE;


--
-- Name: feed_likes feed_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feed_posts feed_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_posts
    ADD CONSTRAINT feed_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id);


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id);


--
-- Name: friendships friendships_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_athlete_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_athlete_id_users_id_fk FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: group_members group_members_group_id_athlete_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_athlete_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.athlete_groups(id);


--
-- Name: group_messages group_messages_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: group_messages group_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: groups groups_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id);


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: login_streaks login_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_streaks
    ADD CONSTRAINT login_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: marketplace_cart_items marketplace_cart_items_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_cart_items
    ADD CONSTRAINT marketplace_cart_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- Name: marketplace_cart_items marketplace_cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_cart_items
    ADD CONSTRAINT marketplace_cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_listings marketplace_listings_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_order_items marketplace_order_items_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT;


--
-- Name: marketplace_order_items marketplace_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: marketplace_order_items marketplace_order_items_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_orders marketplace_orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_reviews marketplace_reviews_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- Name: marketplace_reviews marketplace_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE SET NULL;


--
-- Name: marketplace_reviews marketplace_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: meets meets_coach_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meets
    ADD CONSTRAINT meets_coach_id_users_id_fk FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: meets meets_group_id_athlete_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meets
    ADD CONSTRAINT meets_group_id_athlete_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.athlete_groups(id);


--
-- Name: meets meets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meets
    ADD CONSTRAINT meets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: message_reactions message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: practice_completions practice_completions_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_completions
    ADD CONSTRAINT practice_completions_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: practice_completions practice_completions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_completions
    ADD CONSTRAINT practice_completions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.practice_sessions(id);


--
-- Name: practice_exercises practice_exercises_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_exercises
    ADD CONSTRAINT practice_exercises_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.practice_sessions(id);


--
-- Name: practice_media practice_media_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_media
    ADD CONSTRAINT practice_media_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: practice_media practice_media_completion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_media
    ADD CONSTRAINT practice_media_completion_id_fkey FOREIGN KEY (completion_id) REFERENCES public.practice_completions(id);


--
-- Name: practice_programs practice_programs_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_programs
    ADD CONSTRAINT practice_programs_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: practice_questions practice_questions_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_questions
    ADD CONSTRAINT practice_questions_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.users(id);


--
-- Name: practice_questions practice_questions_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_questions
    ADD CONSTRAINT practice_questions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: practice_questions practice_questions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_questions
    ADD CONSTRAINT practice_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.practice_sessions(id);


--
-- Name: practice_sessions practice_sessions_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: practice_sessions practice_sessions_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.practice_programs(id);


--
-- Name: program_assignments program_assignments_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: program_assignments program_assignments_assigner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_assigner_id_fkey FOREIGN KEY (assigner_id) REFERENCES public.users(id);


--
-- Name: program_assignments program_assignments_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id);


--
-- Name: program_listings program_listings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_listings
    ADD CONSTRAINT program_listings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- Name: program_listings program_listings_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_listings
    ADD CONSTRAINT program_listings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id) ON DELETE CASCADE;


--
-- Name: program_progress program_progress_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_progress
    ADD CONSTRAINT program_progress_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id);


--
-- Name: program_progress program_progress_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_progress
    ADD CONSTRAINT program_progress_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.program_sessions(id);


--
-- Name: program_progress program_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_progress
    ADD CONSTRAINT program_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: program_purchases program_purchases_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_purchases
    ADD CONSTRAINT program_purchases_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id);


--
-- Name: program_purchases program_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_purchases
    ADD CONSTRAINT program_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: program_sessions program_sessions_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_sessions
    ADD CONSTRAINT program_sessions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id);


--
-- Name: query_usage query_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_usage
    ADD CONSTRAINT query_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: race_checklists race_checklists_race_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_checklists
    ADD CONSTRAINT race_checklists_race_id_fkey FOREIGN KEY (race_id) REFERENCES public.races(race_id);


--
-- Name: race_prep_plans race_prep_plans_race_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_prep_plans
    ADD CONSTRAINT race_prep_plans_race_id_fkey FOREIGN KEY (race_id) REFERENCES public.races(race_id);


--
-- Name: race_results race_results_race_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.race_results
    ADD CONSTRAINT race_results_race_id_fkey FOREIGN KEY (race_id) REFERENCES public.races(race_id);


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: reminders reminders_coach_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_coach_id_users_id_fk FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: reminders reminders_meet_id_meets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_meet_id_meets_id_fk FOREIGN KEY (meet_id) REFERENCES public.meets(id);


--
-- Name: reminders reminders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: results results_coach_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_coach_id_users_id_fk FOREIGN KEY (coach_id) REFERENCES public.users(id);


--
-- Name: results results_meet_id_meets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_meet_id_meets_id_fk FOREIGN KEY (meet_id) REFERENCES public.meets(id);


--
-- Name: results results_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: spike_transactions spike_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spike_transactions
    ADD CONSTRAINT spike_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sprinthia_conversations sprinthia_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_conversations
    ADD CONSTRAINT sprinthia_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sprinthia_messages sprinthia_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sprinthia_messages
    ADD CONSTRAINT sprinthia_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.sprinthia_conversations(id) ON DELETE CASCADE;


--
-- Name: subscription_programs subscription_programs_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_programs
    ADD CONSTRAINT subscription_programs_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.training_programs(id) ON DELETE CASCADE;


--
-- Name: subscription_programs subscription_programs_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_programs
    ADD CONSTRAINT subscription_programs_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;


--
-- Name: telegram_direct_messages telegram_direct_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages
    ADD CONSTRAINT telegram_direct_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: telegram_direct_messages telegram_direct_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages
    ADD CONSTRAINT telegram_direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: telegram_direct_messages telegram_direct_messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages
    ADD CONSTRAINT telegram_direct_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.telegram_direct_messages(id);


--
-- Name: telegram_direct_messages telegram_direct_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_direct_messages
    ADD CONSTRAINT telegram_direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: training_programs training_programs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_programs
    ADD CONSTRAINT training_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_favorite_competitions user_favorite_competitions_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_competitions
    ADD CONSTRAINT user_favorite_competitions_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: user_favorite_competitions user_favorite_competitions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_competitions
    ADD CONSTRAINT user_favorite_competitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscription_purchases user_subscription_purchases_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscription_purchases
    ADD CONSTRAINT user_subscription_purchases_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscription_purchases user_subscription_purchases_subscriber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscription_purchases
    ADD CONSTRAINT user_subscription_purchases_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscription_purchases user_subscription_purchases_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscription_purchases
    ADD CONSTRAINT user_subscription_purchases_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_default_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_club_id_fkey FOREIGN KEY (default_club_id) REFERENCES public.clubs(id);


--
-- Name: video_analysis video_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis
    ADD CONSTRAINT video_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: virtual_race_participants virtual_race_participants_virtual_race_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.virtual_race_participants
    ADD CONSTRAINT virtual_race_participants_virtual_race_id_fkey FOREIGN KEY (virtual_race_id) REFERENCES public.virtual_races(virtual_race_id);


--
-- Name: workout_library workout_library_original_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_library
    ADD CONSTRAINT workout_library_original_user_id_fkey FOREIGN KEY (original_user_id) REFERENCES public.users(id);


--
-- Name: workout_library workout_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_library
    ADD CONSTRAINT workout_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workout_reactions workout_reactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_reactions
    ADD CONSTRAINT workout_reactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.program_sessions(id);


--
-- Name: workout_reactions workout_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_reactions
    ADD CONSTRAINT workout_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workout_session_preview workout_session_preview_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_session_preview
    ADD CONSTRAINT workout_session_preview_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9lWr4dFmIR2RPbNypv4LPyoktyOYgYa05aoBTzFtYXd9aLcIefj1spdLctqeHo8

