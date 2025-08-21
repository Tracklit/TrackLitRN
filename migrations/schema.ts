import { pgTable, foreignKey, serial, integer, text, boolean, timestamp, json, real, index, varchar, type AnyPgColumn, unique, date, jsonb, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const coachNotes = pgTable("coach_notes", {
	id: serial().primaryKey().notNull(),
	coachId: integer("coach_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	meetId: integer("meet_id"),
	resultId: integer("result_id"),
	note: text().notNull(),
	isPrivate: boolean("is_private").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "coach_notes_coach_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "coach_notes_athlete_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.meetId],
			foreignColumns: [meets.id],
			name: "coach_notes_meet_id_meets_id_fk"
		}),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [results.id],
			name: "coach_notes_result_id_results_id_fk"
		}),
]);

export const coaches = pgTable("coaches", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	status: text().default('pending'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "coaches_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "coaches_athlete_id_users_id_fk"
		}),
]);

export const groupMembers = pgTable("group_members", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [athleteGroups.id],
			name: "group_members_group_id_athlete_groups_id_fk"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "group_members_athlete_id_users_id_fk"
		}),
]);

export const meets = pgTable("meets", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	coachId: integer("coach_id"),
	groupId: integer("group_id"),
	name: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	location: text().notNull(),
	coordinates: json(),
	events: text().array(),
	warmupTime: integer("warmup_time").default(60),
	arrivalTime: integer("arrival_time").default(90),
	status: text().default('upcoming'),
	isCoachAssigned: boolean("is_coach_assigned").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	websiteUrl: text("website_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meets_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "meets_coach_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [athleteGroups.id],
			name: "meets_group_id_athlete_groups_id_fk"
		}),
]);

export const practicePrograms = pgTable("practice_programs", {
	id: serial().primaryKey().notNull(),
	coachId: integer("coach_id").notNull(),
	name: text().notNull(),
	description: text(),
	intensity: integer().notNull(),
	volume: integer().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "practice_programs_coach_id_fkey"
		}),
]);

export const athleteGroups = pgTable("athlete_groups", {
	id: serial().primaryKey().notNull(),
	coachId: integer("coach_id").notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "athlete_groups_coach_id_users_id_fk"
		}),
]);

export const results = pgTable("results", {
	id: serial().primaryKey().notNull(),
	meetId: integer("meet_id").notNull(),
	userId: integer("user_id").notNull(),
	coachId: integer("coach_id"),
	event: text().notNull(),
	performance: real().notNull(),
	wind: real(),
	place: integer(),
	notes: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	enteredByCoach: boolean("entered_by_coach").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.meetId],
			foreignColumns: [meets.id],
			name: "results_meet_id_meets_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "results_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "results_coach_id_users_id_fk"
		}),
]);

export const reminders = pgTable("reminders", {
	id: serial().primaryKey().notNull(),
	meetId: integer("meet_id").notNull(),
	userId: integer("user_id").notNull(),
	coachId: integer("coach_id"),
	title: text().notNull(),
	description: text(),
	category: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	isCompleted: boolean("is_completed").default(false),
	isCoachAssigned: boolean("is_coach_assigned").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.meetId],
			foreignColumns: [meets.id],
			name: "reminders_meet_id_meets_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reminders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "reminders_coach_id_users_id_fk"
		}),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	events: text().array(),
	isPremium: boolean("is_premium").default(false),
	role: text().default('athlete'),
	bio: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	spikes: integer().default(0),
	defaultClubId: integer("default_club_id"),
	subscriptionTier: text("subscription_tier").default('free'),
	isCoach: boolean("is_coach").default(false),
	profileImageUrl: text("profile_image_url"),
	sprinthiaPrompts: integer("sprinthia_prompts").default(1),
	isBlocked: boolean("is_blocked").default(false),
	isPrivate: boolean("is_private").default(false),
}, (table) => [
	foreignKey({
			columns: [table.defaultClubId],
			foreignColumns: [clubs.id],
			name: "users_default_club_id_fkey"
		}),
	unique("users_username_unique").on(table.username),
]);

export const practiceSessions = pgTable("practice_sessions", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id"),
	name: text().notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	duration: integer().notNull(),
	intensity: integer().notNull(),
	volume: integer().notNull(),
	coachId: integer("coach_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [practicePrograms.id],
			name: "practice_sessions_program_id_fkey"
		}),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "practice_sessions_coach_id_fkey"
		}),
]);

export const practiceExercises = pgTable("practice_exercises", {
	id: serial().primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	name: text().notNull(),
	description: text(),
	duration: integer(),
	sets: integer(),
	reps: integer(),
	distance: integer(),
	intensity: integer().notNull(),
	orderIndex: integer("order_index").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.id],
			name: "practice_exercises_session_id_fkey"
		}),
]);

export const practiceCompletions = pgTable("practice_completions", {
	id: serial().primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow().notNull(),
	satisfactionRating: integer("satisfaction_rating"),
	feelingRating: integer("feeling_rating"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.id],
			name: "practice_completions_session_id_fkey"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "practice_completions_athlete_id_fkey"
		}),
]);

export const practiceMedia = pgTable("practice_media", {
	id: serial().primaryKey().notNull(),
	completionId: integer("completion_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	mediaType: text("media_type").notNull(),
	mediaUrl: text("media_url").notNull(),
	caption: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.completionId],
			foreignColumns: [practiceCompletions.id],
			name: "practice_media_completion_id_fkey"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "practice_media_athlete_id_fkey"
		}),
]);

export const practiceQuestions = pgTable("practice_questions", {
	id: serial().primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	coachId: integer("coach_id").notNull(),
	question: text().notNull(),
	answer: text(),
	isAnswered: boolean("is_answered").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [practiceSessions.id],
			name: "practice_questions_session_id_fkey"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "practice_questions_athlete_id_fkey"
		}),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "practice_questions_coach_id_fkey"
		}),
]);

export const clubs = pgTable("clubs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	logoUrl: text("logo_url"),
	ownerId: integer("owner_id").notNull(),
	isPrivate: boolean("is_private").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	inviteCode: text("invite_code"),
	bannerUrl: text("banner_url"),
	isPremium: boolean("is_premium").default(false),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "clubs_owner_id_fkey"
		}),
]);

export const clubMembers = pgTable("club_members", {
	id: serial().primaryKey().notNull(),
	clubId: integer("club_id").notNull(),
	userId: integer("user_id").notNull(),
	role: text().default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "club_members_club_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "club_members_user_id_fkey"
		}),
]);

export const groups = pgTable("groups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	clubId: integer("club_id"),
	createdBy: integer("created_by").notNull(),
	isPrivate: boolean("is_private").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "groups_club_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "groups_created_by_fkey"
		}),
]);

export const chatGroupMembers = pgTable("chat_group_members", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	role: text().default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	status: text().default('accepted'),
	lastSeenAt: timestamp({ mode: 'string' }).defaultNow(),
	lastReadMessageId: integer("last_read_message_id"),
	isMuted: boolean("is_muted").default(false),
	isOnline: boolean("is_online").default(false),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_group_members_user_id_fkey"
		}),
	foreignKey({
			columns: [table.lastReadMessageId],
			foreignColumns: [chatGroupMessages.id],
			name: "chat_group_members_last_read_message_id_fkey"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [chatGroups.id],
			name: "chat_group_members_group_id_fkey"
		}).onDelete("cascade"),
]);

export const groupMessages = pgTable("group_messages", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	senderId: integer("sender_id").notNull(),
	message: text().notNull(),
	hasMedia: boolean("has_media").default(false),
	mediaUrl: text("media_url"),
	mediaType: text("media_type"),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_messages_group_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "group_messages_sender_id_fkey"
		}),
]);

export const athleteGroupMembers = pgTable("athlete_group_members", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [athleteGroups.id],
			name: "athlete_group_members_group_id_fkey"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "athlete_group_members_athlete_id_fkey"
		}),
]);

export const clubMessages = pgTable("club_messages", {
	id: serial().primaryKey().notNull(),
	clubId: integer("club_id").notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "club_messages_club_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "club_messages_user_id_fkey"
		}),
]);

export const userAchievements = pgTable("user_achievements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	achievementId: integer("achievement_id").notNull(),
	progress: integer().default(0).notNull(),
	isCompleted: boolean("is_completed").default(false),
	completionDate: timestamp("completion_date", { mode: 'string' }),
	timesEarned: integer("times_earned").default(0),
	lastEarnedAt: timestamp("last_earned_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_achievements_user_id_fkey"
		}),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_fkey"
		}),
]);

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	iconUrl: text("icon_url"),
	spikeReward: integer("spike_reward").default(10).notNull(),
	isOneTime: boolean("is_one_time").default(true).notNull(),
	requirementValue: integer("requirement_value").default(1).notNull(),
	requirementType: text("requirement_type").notNull(),
	isHidden: boolean("is_hidden").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const loginStreaks = pgTable("login_streaks", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	currentStreak: integer("current_streak").default(0),
	longestStreak: integer("longest_streak").default(0),
	lastLoginDate: date("last_login_date"),
	streakUpdatedAt: timestamp("streak_updated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "login_streaks_user_id_fkey"
		}),
	unique("login_streaks_user_id_key").on(table.userId),
]);

export const spikeTransactions = pgTable("spike_transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	amount: integer().notNull(),
	balance: integer().notNull(),
	source: text().notNull(),
	sourceId: integer("source_id"),
	description: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "spike_transactions_user_id_fkey"
		}),
]);

export const referrals = pgTable("referrals", {
	id: serial().primaryKey().notNull(),
	referrerId: integer("referrer_id").notNull(),
	referredId: integer("referred_id").notNull(),
	referralCode: text("referral_code").notNull(),
	status: text().default('pending'),
	spikesAwarded: boolean("spikes_awarded").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.referrerId],
			foreignColumns: [users.id],
			name: "referrals_referrer_id_fkey"
		}),
	foreignKey({
			columns: [table.referredId],
			foreignColumns: [users.id],
			name: "referrals_referred_id_fkey"
		}),
]);

export const programPurchases = pgTable("program_purchases", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	userId: integer("user_id").notNull(),
	price: integer().notNull(),
	isFree: boolean("is_free").default(false),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [trainingPrograms.id],
			name: "program_purchases_program_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "program_purchases_user_id_fkey"
		}),
]);

export const programProgress = pgTable("program_progress", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	programId: integer("program_id").notNull(),
	sessionId: integer("session_id").notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).notNull(),
	rating: integer(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "program_progress_user_id_fkey"
		}),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [trainingPrograms.id],
			name: "program_progress_program_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [programSessions.id],
			name: "program_progress_session_id_fkey"
		}),
]);

export const workoutSessionPreview = pgTable("workout_session_preview", {
	id: serial().primaryKey().notNull(),
	workoutId: integer("workout_id").notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	focusArea: text("focus_area"),
	intensity: text(),
	duration: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workout_session_preview_user_id_fkey"
		}),
]);

export const programAssignments = pgTable("program_assignments", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	assignerId: integer("assigner_id").notNull(),
	assigneeId: integer("assignee_id").notNull(),
	status: text().default('pending').notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [trainingPrograms.id],
			name: "program_assignments_program_id_fkey"
		}),
	foreignKey({
			columns: [table.assignerId],
			foreignColumns: [users.id],
			name: "program_assignments_assigner_id_fkey"
		}),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "program_assignments_assignee_id_fkey"
		}),
]);

export const athleteProfiles = pgTable("athlete_profiles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	sprint60M100M: boolean("sprint_60m_100m").default(false),
	sprint200M: boolean("sprint_200m").default(false),
	sprint400M: boolean("sprint_400m").default(false),
	hurdles100M110M: boolean("hurdles_100m_110m").default(false),
	hurdles400M: boolean("hurdles_400m").default(false),
	otherEvent: boolean("other_event").default(false),
	otherEventName: text("other_event_name"),
	sprint60M100MGoal: real("sprint_60m_100m_goal"),
	sprint200MGoal: real("sprint_200m_goal"),
	sprint400MGoal: real("sprint_400m_goal"),
	hurdles100M110MGoal: real("hurdles_100m_110m_goal"),
	hurdles400MGoal: real("hurdles_400m_goal"),
	otherEventGoal: real("other_event_goal"),
	timingPreference: text("timing_preference").default('on_movement'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "athlete_profiles_user_id_fkey"
		}),
	unique("athlete_profiles_user_id_key").on(table.userId),
]);

export const workoutLibrary = pgTable("workout_library", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	focusArea: text("focus_area"),
	intensity: text(),
	duration: integer(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	category: text(),
	content: text(),
	originalUserId: integer("original_user_id"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workout_library_user_id_fkey"
		}),
	foreignKey({
			columns: [table.originalUserId],
			foreignColumns: [users.id],
			name: "workout_library_original_user_id_fkey"
		}),
]);

export const journalEntries = pgTable("journal_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	notes: text(),
	type: text().default('manual'),
	content: jsonb(),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "journal_entries_user_id_fkey"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	data: text(),
	actionUrl: varchar("action_url", { length: 500 }),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	relatedId: integer("related_id"),
	relatedType: text("related_type"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
]);

export const programSessions = pgTable("program_sessions", {
	id: serial().primaryKey().notNull(),
	programId: integer("program_id").notNull(),
	workoutId: integer("workout_id"),
	title: text().notNull(),
	description: text(),
	dayNumber: integer("day_number").notNull(),
	orderInDay: integer("order_in_day").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	date: text(),
	shortDistanceWorkout: text("short_distance_workout"),
	mediumDistanceWorkout: text("medium_distance_workout"),
	longDistanceWorkout: text("long_distance_workout"),
	preActivation1: text("pre_activation_1"),
	preActivation2: text("pre_activation_2"),
	extraSession: text("extra_session"),
	isRestDay: boolean("is_rest_day").default(false),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	notes: text(),
	gymData: text("gym_data").array(),
}, (table) => [
	foreignKey({
			columns: [table.programId],
			foreignColumns: [trainingPrograms.id],
			name: "program_sessions_program_id_fkey"
		}),
]);

export const follows = pgTable("follows", {
	id: serial().primaryKey().notNull(),
	followerId: integer("follower_id").notNull(),
	followingId: integer("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "follows_follower_id_fkey"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "follows_following_id_fkey"
		}),
]);

export const coachAthletes = pgTable("coach_athletes", {
	id: serial().primaryKey().notNull(),
	coachId: integer("coach_id").notNull(),
	athleteId: integer("athlete_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [users.id],
			name: "coach_athletes_coach_id_fkey"
		}),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [users.id],
			name: "coach_athletes_athlete_id_fkey"
		}),
]);

export const coachingRequests = pgTable("coaching_requests", {
	id: serial().primaryKey().notNull(),
	fromUserId: integer("from_user_id").notNull(),
	toUserId: integer("to_user_id").notNull(),
	requestType: text("request_type").notNull(),
	status: text().default('pending'),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "coaching_requests_from_user_id_fkey"
		}),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "coaching_requests_to_user_id_fkey"
		}),
	check("coaching_requests_request_type_check", sql`request_type = ANY (ARRAY['coach_invite'::text, 'athlete_request'::text])`),
	check("coaching_requests_status_check", sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])`),
]);

export const sprinthiaConversations = pgTable("sprinthia_conversations", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sprinthia_conversations_user_id_fkey"
		}).onDelete("cascade"),
]);

export const sprinthiaMessages = pgTable("sprinthia_messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	promptCost: integer("prompt_cost").default(1),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [sprinthiaConversations.id],
			name: "sprinthia_messages_conversation_id_fkey"
		}).onDelete("cascade"),
	check("sprinthia_messages_role_check", sql`role = ANY (ARRAY['user'::text, 'assistant'::text])`),
]);

export const workoutReactions = pgTable("workout_reactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	sessionId: integer("session_id").notNull(),
	reactionType: text("reaction_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workout_reactions_user_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [programSessions.id],
			name: "workout_reactions_session_id_fkey"
		}),
]);

export const exerciseShares = pgTable("exercise_shares", {
	id: serial().primaryKey().notNull(),
	exerciseId: integer("exercise_id").notNull(),
	fromUserId: integer("from_user_id").notNull(),
	toUserId: integer("to_user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exerciseLibrary.id],
			name: "exercise_shares_exercise_id_fkey"
		}),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "exercise_shares_from_user_id_fkey"
		}),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "exercise_shares_to_user_id_fkey"
		}),
]);

export const exerciseLibrary = pgTable("exercise_library", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	description: text(),
	fileUrl: text("file_url"),
	youtubeUrl: text("youtube_url"),
	youtubeVideoId: text("youtube_video_id"),
	fileSize: integer("file_size"),
	fileType: text("file_type"),
	duration: integer(),
	tags: text().array(),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	type: text(),
	thumbnailUrl: text("thumbnail_url"),
	mimeType: text("mime_type"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	videoAnalysisId: integer("video_analysis_id"),
	analysisData: text("analysis_data"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "exercise_library_user_id_fkey"
		}),
	foreignKey({
			columns: [table.videoAnalysisId],
			foreignColumns: [videoAnalysis.id],
			name: "exercise_library_video_analysis_id_fkey"
		}),
]);

export const conversations = pgTable("conversations", {
	id: serial().primaryKey().notNull(),
	user1Id: integer("user1_id").notNull(),
	user2Id: integer("user2_id").notNull(),
	lastMessageId: integer("last_message_id"),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.user1Id],
			foreignColumns: [users.id],
			name: "conversations_user1_id_fkey"
		}),
	foreignKey({
			columns: [table.user2Id],
			foreignColumns: [users.id],
			name: "conversations_user2_id_fkey"
		}),
]);

export const directMessages = pgTable("direct_messages", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "direct_messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "direct_messages_receiver_id_fkey"
		}),
]);

export const competitions = pgTable("competitions", {
	id: serial().primaryKey().notNull(),
	externalId: integer("external_id"),
	name: text().notNull(),
	location: text(),
	country: text(),
	city: text(),
	rankingCategory: text("ranking_category"),
	disciplines: text().array(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	competitionGroup: text("competition_group"),
	competitionSubgroup: text("competition_subgroup"),
	hasResults: boolean("has_results").default(false),
	hasStartlist: boolean("has_startlist").default(false),
	hasCompetitionInformation: boolean("has_competition_information").default(false),
	websiteUrl: text("website_url"),
	liveStreamUrl: text("live_stream_url"),
	resultsUrl: text("results_url"),
	additionalInfo: text("additional_info"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("competitions_external_id_key").on(table.externalId),
]);

export const competitionEvents = pgTable("competition_events", {
	id: serial().primaryKey().notNull(),
	competitionId: integer("competition_id"),
	externalEventId: integer("external_event_id"),
	eventName: text("event_name"),
	disciplineName: text("discipline_name"),
	disciplineCode: text("discipline_code"),
	category: text(),
	sex: text(),
	combined: boolean().default(false),
	date: timestamp({ mode: 'string' }),
	day: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.competitionId],
			foreignColumns: [competitions.id],
			name: "competition_events_competition_id_fkey"
		}).onDelete("cascade"),
]);

export const videoAnalysis = pgTable("video_analysis", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	description: text(),
	fileUrl: text("file_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	duration: integer(),
	fileSize: integer("file_size"),
	mimeType: text("mime_type").notNull(),
	status: text().default('uploading'),
	analysisData: text("analysis_data"),
	isPublic: boolean("is_public").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	fileName: text("file_name"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "video_analysis_user_id_fkey"
		}),
	check("video_analysis_status_check", sql`status = ANY (ARRAY['uploading'::text, 'processing'::text, 'completed'::text, 'failed'::text])`),
]);

export const athleteCompetitionResults = pgTable("athlete_competition_results", {
	id: serial().primaryKey().notNull(),
	competitionId: integer("competition_id"),
	eventId: integer("event_id"),
	athleteName: text("athlete_name"),
	athleteId: integer("athlete_id"),
	country: text(),
	place: integer(),
	performance: text(),
	performanceValue: integer("performance_value"),
	wind: text(),
	raceNumber: integer("race_number"),
	raceName: text("race_name"),
	date: timestamp({ mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.competitionId],
			foreignColumns: [competitions.id],
			name: "athlete_competition_results_competition_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [competitionEvents.id],
			name: "athlete_competition_results_event_id_fkey"
		}).onDelete("cascade"),
]);

export const userFavoriteCompetitions = pgTable("user_favorite_competitions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	competitionId: integer("competition_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_favorite_competitions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.competitionId],
			foreignColumns: [competitions.id],
			name: "user_favorite_competitions_competition_id_fkey"
		}).onDelete("cascade"),
]);

export const trainingPrograms = pgTable("training_programs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	visibility: text().default('private'),
	price: integer().default(0),
	coverImageUrl: text("cover_image_url"),
	category: text().default('general'),
	level: text(),
	duration: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isUploadedProgram: boolean("is_uploaded_program").default(false),
	programFileUrl: text("program_file_url"),
	programFileType: text("program_file_type"),
	totalSessions: integer("total_sessions").default(0),
	importedFromSheet: boolean("imported_from_sheet").default(false),
	googleSheetUrl: text("google_sheet_url"),
	googleSheetId: text("google_sheet_id"),
	priceType: text("price_type").default('spikes'),
	stripeProductId: text("stripe_product_id"),
	stripePriceId: text("stripe_price_id"),
	isTextBased: boolean("is_text_based").default(false),
	textContent: text("text_content"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "training_programs_user_id_fkey"
		}),
]);

export const aiVideoAnalyses = pgTable("ai_video_analyses", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	videoName: text("video_name").notNull(),
	analysisType: text("analysis_type").notNull(),
	prompt: text().notNull(),
	response: text().notNull(),
	videoTimestamp: real("video_timestamp"),
	costSpikes: integer("cost_spikes").default(0).notNull(),
	isFreeTier: boolean("is_free_tier").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_video_analyses_user_id_fkey"
		}),
]);

export const aiPromptUsage = pgTable("ai_prompt_usage", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	weekStart: date("week_start").notNull(),
	monthStart: date("month_start").notNull(),
	promptsUsedThisWeek: integer("prompts_used_this_week").default(0),
	promptsUsedThisMonth: integer("prompts_used_this_month").default(0),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_prompt_usage_user_id_fkey"
		}),
]);

export const chatGroupMessages = pgTable("chat_group_messages", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	senderId: integer("sender_id").notNull(),
	senderName: text("sender_name").notNull(),
	senderProfileImage: text("sender_profile_image"),
	text: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	replyToId: integer("reply_to_id"),
	messageType: text("message_type").default('text').notNull(),
	mediaUrl: text("media_url"),
	isPinned: boolean("is_pinned").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [chatGroups.id],
			name: "chat_group_messages_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "chat_group_messages_sender_id_fkey"
		}),
]);

export const chatGroups = pgTable("chat_groups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	avatarUrl: text("avatar_url"),
	creatorId: integer("creator_id").notNull(),
	adminIds: integer("admin_ids").array().default([]).notNull(),
	memberIds: integer("member_ids").array().default([]).notNull(),
	isPrivate: boolean("is_private").default(false).notNull(),
	inviteCode: text("invite_code"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow(),
	lastMessage: text("last_message"),
	lastMessageSenderId: integer("last_message_sender_id"),
	messageCount: integer("message_count").default(0).notNull(),
	image: text(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "chat_groups_creator_id_fkey"
		}),
	foreignKey({
			columns: [table.lastMessageSenderId],
			foreignColumns: [users.id],
			name: "chat_groups_last_message_sender_id_fkey"
		}),
]);

export const messageReactions = pgTable("message_reactions", {
	id: serial().primaryKey().notNull(),
	messageId: integer("message_id").notNull(),
	messageType: text("message_type").notNull(),
	userId: integer("user_id").notNull(),
	emoji: text().default('👍').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_reactions_user_id_fkey"
		}).onDelete("cascade"),
	unique("message_reactions_message_id_message_type_user_id_emoji_key").on(table.messageId, table.messageType, table.userId, table.emoji),
]);

export const telegramDirectMessages = pgTable("telegram_direct_messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	text: text().notNull(),
	replyToId: integer("reply_to_id"),
	isRead: boolean("is_read").default(false),
	isDeleted: boolean("is_deleted").default(false),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	readAt: timestamp("read_at", { mode: 'string' }),
	linkPreview: jsonb("link_preview"),
	messageType: text("message_type").default('text'),
	mediaUrl: text("media_url"),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "telegram_direct_messages_conversation_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "telegram_direct_messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "telegram_direct_messages_receiver_id_fkey"
		}),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "telegram_direct_messages_reply_to_id_fkey"
		}),
]);

export const blockedUsers = pgTable("blocked_users", {
	id: serial().primaryKey().notNull(),
	blockerId: integer("blocker_id").notNull(),
	blockedId: integer("blocked_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.blockerId],
			foreignColumns: [users.id],
			name: "blocked_users_blocker_id_fkey"
		}),
	foreignKey({
			columns: [table.blockedId],
			foreignColumns: [users.id],
			name: "blocked_users_blocked_id_fkey"
		}),
	unique("blocked_users_blocker_id_blocked_id_key").on(table.blockerId, table.blockedId),
]);
