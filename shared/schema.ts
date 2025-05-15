import { pgTable, text, serial, integer, boolean, timestamp, json, real, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isPremium: boolean("is_premium").default(false),
  role: text("role").default("athlete"), // athlete, coach, or both
  bio: text("bio"),
  spikes: integer("spikes").default(0), // In-app currency/tokens
  defaultClubId: integer("default_club_id"), // Will be connected through relations
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  meetsAsAthlete: many(meets),
  meetsAsCoach: many(meets, { relationName: "coach_meets" }),
  athleteGroups: many(athleteGroups),
  athleteGroupMemberships: many(athleteGroupMembers, { relationName: "athlete_memberships" }),
  chatGroupMemberships: many(chatGroupMembers, { relationName: "user_groups" }),
  coachRelations: many(coaches, { relationName: "coach_side" }),
  athleteRelations: many(coaches, { relationName: "athlete_side" }),
  coachNotesAuthored: many(coachNotes, { relationName: "notes_authored" }),
  coachNotesReceived: many(coachNotes, { relationName: "notes_received" }),
  defaultClub: one(clubs, { 
    fields: [users.defaultClubId],
    references: [clubs.id],
    relationName: "user_default_club"
  }),
  workouts: many(workoutLibrary),
  workoutPreviews: many(workoutSessionPreview),
  createdPrograms: many(trainingPrograms, { relationName: "program_creator" }),
  purchasedPrograms: many(programPurchases, { relationName: "program_purchaser" }),
  programProgress: many(programProgress, { relationName: "program_progress" }),
}));

export const meets = pgTable("meets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // The athlete
  coachId: integer("coach_id").references(() => users.id), // The coach who created it, if applicable
  groupId: integer("group_id").references(() => athleteGroups.id), // If assigned to a group
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  coordinates: json("coordinates"),
  events: text("events").array(),
  warmupTime: integer("warmup_time").default(60), // Minutes before event
  arrivalTime: integer("arrival_time").default(90), // Minutes before event
  status: text("status").default("upcoming"), // upcoming, completed, cancelled
  isCoachAssigned: boolean("is_coach_assigned").default(false), // Whether assigned by coach
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetsRelations = relations(meets, ({ one, many }) => ({
  athlete: one(users, {
    fields: [meets.userId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [meets.coachId],
    references: [users.id],
    relationName: "coach_meets",
  }),
  group: one(athleteGroups, {
    fields: [meets.groupId],
    references: [athleteGroups.id],
  }),
  results: many(results),
  reminders: many(reminders),
}));

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  meetId: integer("meet_id").notNull().references(() => meets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  coachId: integer("coach_id").references(() => users.id), // Coach who entered result, if applicable
  event: text("event").notNull(),
  performance: real("performance").notNull(), // Time in seconds or distance in meters
  wind: real("wind"), // Wind speed in m/s for affected events
  place: integer("place"), // 1st, 2nd, 3rd, etc.
  notes: text("notes"),
  date: timestamp("date").notNull(), // Date of the result (same as meet date)
  enteredByCoach: boolean("entered_by_coach").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resultsRelations = relations(results, ({ one, many }) => ({
  meet: one(meets, {
    fields: [results.meetId],
    references: [meets.id],
  }),
  athlete: one(users, {
    fields: [results.userId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [results.coachId],
    references: [users.id],
  }),
  coachNotes: many(coachNotes),
}));

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  meetId: integer("meet_id").notNull().references(() => meets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  coachId: integer("coach_id").references(() => users.id), // Coach who created reminder, if applicable
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // nutrition, warmup, rest, exercise, hydration, meal
  date: timestamp("date").notNull(), // When the reminder should occur
  isCompleted: boolean("is_completed").default(false),
  isCoachAssigned: boolean("is_coach_assigned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const remindersRelations = relations(reminders, ({ one }) => ({
  meet: one(meets, {
    fields: [reminders.meetId],
    references: [meets.id],
  }),
  athlete: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [reminders.coachId],
    references: [users.id],
  }),
}));

export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Coach user ID
  athleteId: integer("athlete_id").notNull().references(() => users.id), // Athlete user ID
  status: text("status").default("pending"), // pending, accepted, rejected
  notes: text("notes"), // Coach notes about the athlete
  createdAt: timestamp("created_at").defaultNow(),
});

export const coachesRelations = relations(coaches, ({ one }) => ({
  coach: one(users, {
    fields: [coaches.userId],
    references: [users.id],
    relationName: "coach_side",
  }),
  athlete: one(users, {
    fields: [coaches.athleteId],
    references: [users.id],
    relationName: "athlete_side",
  }),
}));

export const athleteGroups = pgTable("athlete_groups", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id), // Coach user ID
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athleteGroupsRelations = relations(athleteGroups, ({ one, many }) => ({
  coach: one(users, {
    fields: [athleteGroups.coachId],
    references: [users.id],
  }),
  members: many(athleteGroupMembers),
  meets: many(meets),
}));

export const athleteGroupMembers = pgTable("athlete_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => athleteGroups.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const athleteGroupMembersRelations = relations(athleteGroupMembers, ({ one }) => ({
  group: one(athleteGroups, {
    fields: [athleteGroupMembers.groupId],
    references: [athleteGroups.id],
  }),
  athlete: one(users, {
    fields: [athleteGroupMembers.athleteId],
    references: [users.id],
    relationName: "athlete_memberships",
  }),
}));

export const coachNotes = pgTable("coach_notes", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  meetId: integer("meet_id").references(() => meets.id),
  resultId: integer("result_id").references(() => results.id),
  note: text("note").notNull(),
  isPrivate: boolean("is_private").default(true), // If true, only visible to coach
  createdAt: timestamp("created_at").defaultNow(),
});

export const coachNotesRelations = relations(coachNotes, ({ one }) => ({
  coach: one(users, {
    fields: [coachNotes.coachId],
    references: [users.id],
    relationName: "notes_authored",
  }),
  athlete: one(users, {
    fields: [coachNotes.athleteId],
    references: [users.id],
    relationName: "notes_received",
  }),
  meet: one(meets, {
    fields: [coachNotes.meetId],
    references: [meets.id],
  }),
  result: one(results, {
    fields: [coachNotes.resultId],
    references: [results.id],
  }),
}));

// New Entities for Practice Section
export const practicePrograms = pgTable("practice_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coachId: integer("coach_id").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceProgramsRelations = relations(practicePrograms, ({ one, many }) => ({
  coach: one(users, {
    fields: [practicePrograms.coachId],
    references: [users.id],
  }),
  sessions: many(practiceSessions),
}));

export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => practicePrograms.id),
  name: text("name").notNull(),
  description: text("description"),
  intensity: integer("intensity").notNull(), // 1-10 scale
  volume: integer("volume").notNull(), // 1-10 scale
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
  program: one(practicePrograms, {
    fields: [practiceSessions.programId],
    references: [practicePrograms.id],
  }),
  exercises: many(practiceExercises),
  completions: many(practiceCompletions),
}));

export const practiceExercises = pgTable("practice_exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => practiceSessions.id),
  name: text("name").notNull(),
  description: text("description"),
  sets: integer("sets"),
  reps: integer("reps"),
  distance: integer("distance"), // in meters
  duration: integer("duration"), // in seconds
  restTime: integer("rest_time"), // in seconds
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceExercisesRelations = relations(practiceExercises, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [practiceExercises.sessionId],
    references: [practiceSessions.id],
  }),
}));

export const practiceCompletions = pgTable("practice_completions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => practiceSessions.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  satisfactionRating: integer("satisfaction_rating"), // 1-10 scale
  feelingRating: integer("feeling_rating"), // 1-10 scale
  diaryNotes: text("diary_notes"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceCompletionsRelations = relations(practiceCompletions, ({ one, many }) => ({
  session: one(practiceSessions, {
    fields: [practiceCompletions.sessionId],
    references: [practiceSessions.id],
  }),
  athlete: one(users, {
    fields: [practiceCompletions.athleteId],
    references: [users.id],
  }),
  media: many(practiceMedia),
  questions: many(practiceQuestions),
}));

export const practiceMedia = pgTable("practice_media", {
  id: serial("id").primaryKey(),
  completionId: integer("completion_id").notNull().references(() => practiceCompletions.id),
  type: text("type", { enum: ['image', 'video'] }).notNull(),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceMediaRelations = relations(practiceMedia, ({ one }) => ({
  completion: one(practiceCompletions, {
    fields: [practiceMedia.completionId],
    references: [practiceCompletions.id],
  }),
}));

export const practiceQuestions = pgTable("practice_questions", {
  id: serial("id").primaryKey(),
  completionId: integer("completion_id").notNull().references(() => practiceCompletions.id),
  question: text("question").notNull(),
  answer: text("answer"),
  answeredAt: timestamp("answered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceQuestionsRelations = relations(practiceQuestions, ({ one }) => ({
  completion: one(practiceCompletions, {
    fields: [practiceQuestions.completionId],
    references: [practiceCompletions.id],
  }),
}));

// New Entities for Clubs and Groups
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  // isPaid and price removed as they don't exist in the actual DB
  inviteCode: text("invite_code"), // Unique invite code for the club
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"), // New field for club banner image
  createdAt: timestamp("created_at").defaultNow(),
  isPremium: boolean("is_premium").default(false), // Whether the club has premium features
});

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  owner: one(users, {
    fields: [clubs.ownerId],
    references: [users.id],
  }),
  members: many(clubMembers),
  groups: many(groups),
}));

export const clubMembers = pgTable("club_members", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ['member', 'admin'] }).default('member'),
  // status field doesn't exist in the actual database
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
}));

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  club: one(clubs, {
    fields: [groups.clubId],
    references: [clubs.id],
  }),
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
  members: many(chatGroupMembers, { relationName: "groups_members" }),
  messages: many(groupMessages),
}));

export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ['member', 'admin'] }).default('member'),
  status: text("status", { enum: ['pending', 'accepted', 'rejected'] }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatGroupMembersRelations = relations(chatGroupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [chatGroupMembers.groupId],
    references: [groups.id],
    relationName: "groups_members",
  }),
  user: one(users, {
    fields: [chatGroupMembers.userId],
    references: [users.id],
    relationName: "user_groups",
  }),
}));

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  group: one(groups, {
    fields: [groupMessages.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [groupMessages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isPremium: true,
  role: true,
  bio: true,
});

export const insertMeetSchema = createInsertSchema(meets).omit({
  id: true,
  createdAt: true,
  status: true,
  isCoachAssigned: true,
});

export const insertResultSchema = createInsertSchema(results).omit({
  id: true,
  createdAt: true,
  enteredByCoach: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  isCompleted: true,
  isCoachAssigned: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertAthleteGroupSchema = createInsertSchema(athleteGroups).omit({
  id: true,
  createdAt: true,
});

export const insertAthleteGroupMemberSchema = createInsertSchema(athleteGroupMembers).omit({
  id: true,
  createdAt: true,
});

// Alias for backward compatibility
export const insertGroupMemberSchema = insertAthleteGroupMemberSchema;

export const insertCoachNoteSchema = createInsertSchema(coachNotes).omit({
  id: true,
  createdAt: true,
});

export const insertPracticeMediaSchema = createInsertSchema(practiceMedia).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMeet = z.infer<typeof insertMeetSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type InsertAthleteGroup = z.infer<typeof insertAthleteGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertCoachNote = z.infer<typeof insertCoachNoteSchema>;
export type InsertPracticeMedia = z.infer<typeof insertPracticeMediaSchema>;

export type User = typeof users.$inferSelect;
export type Meet = typeof meets.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Coach = typeof coaches.$inferSelect;
export type AthleteGroup = typeof athleteGroups.$inferSelect;
export type AthleteGroupMember = typeof athleteGroupMembers.$inferSelect;
// Alias for backward compatibility
export type GroupMember = AthleteGroupMember;
export type CoachNote = typeof coachNotes.$inferSelect;
export type PracticeMedia = typeof practiceMedia.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginData = z.infer<typeof loginSchema>;

// Weather type
export type Weather = {
  description: string;
  icon: string;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  // Flag for when weather cannot be forecasted (e.g., too far in future)
  isForecastUnavailable?: boolean;
  // Timestamp for when forecast was generated
  forecastTime?: number;
  // Timestamp for target forecast time
  targetTime?: number;
};

// Club and Group schemas
export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
});

export type InsertClub = z.infer<typeof insertClubSchema>;

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;

export const insertClubMemberSchema = createInsertSchema(clubMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertClubMember = z.infer<typeof insertClubMemberSchema>;

export const insertChatGroupMemberSchema = createInsertSchema(chatGroupMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertChatGroupMember = z.infer<typeof insertChatGroupMemberSchema>;

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;

// Select types
export type Club = typeof clubs.$inferSelect;
export type Group = typeof groups.$inferSelect;
// Club Messages
export const clubMessages = pgTable("club_messages", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubMessagesRelations = relations(clubMessages, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMessages.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMessages.userId],
    references: [users.id],
  }),
}));

export const insertClubMessageSchema = createInsertSchema(clubMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertClubMessage = z.infer<typeof insertClubMessageSchema>;

// Select types
export type ClubMember = typeof clubMembers.$inferSelect;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type ClubMessage = typeof clubMessages.$inferSelect;

// Spikes Reward System

// Achievement definition table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // login, workout, journal, meet, group, social, etc.
  iconUrl: text("icon_url"),
  spikeReward: integer("spike_reward").notNull().default(10),
  isOneTime: boolean("is_one_time").notNull().default(true), // Can it be earned multiple times
  requirementValue: integer("requirement_value").notNull().default(1), // e.g. 3 for a 3-day streak
  requirementType: text("requirement_type").notNull(), // streak, count, etc.
  isHidden: boolean("is_hidden").default(false), // Hide until earned
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements - records which achievements a user has earned
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").notNull().default(0), // Current progress toward achievement
  isCompleted: boolean("is_completed").default(false),
  completionDate: timestamp("completion_date"),
  timesEarned: integer("times_earned").default(0), // For repeatable achievements
  lastEarnedAt: timestamp("last_earned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Record of login streaks for users
export const loginStreaks = pgTable("login_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastLoginDate: date("last_login_date"),
  streakUpdatedAt: timestamp("streak_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spikes transactions - history of spikes earned or spent
export const spikeTransactions = pgTable("spike_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Positive for earned, negative for spent
  balance: integer("balance").notNull(), // Running balance after transaction
  source: text("source").notNull(), // achievement, streak, referral, purchase, etc.
  sourceId: integer("source_id"), // ID of the related entity (if applicable)
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral system
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id), // User who referred
  referredId: integer("referred_id").notNull().references(() => users.id), // User who was referred
  referralCode: text("referral_code").notNull(),
  status: text("status", { enum: ['pending', 'completed'] }).default('pending'),
  spikesAwarded: boolean("spikes_awarded").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const loginStreaksRelations = relations(loginStreaks, ({ one }) => ({
  user: one(users, {
    fields: [loginStreaks.userId],
    references: [users.id],
  }),
}));

export const spikeTransactionsRelations = relations(spikeTransactions, ({ one }) => ({
  user: one(users, {
    fields: [spikeTransactions.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
  }),
}));

// Schemas for Spikes System
export const insertAchievementSchema = createInsertSchema(achievements, {
  spikeReward: z.number().int().min(1),
  requirementValue: z.number().int().min(1),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements, {
  progress: z.number().int().min(0),
  timesEarned: z.number().int().min(0),
});

export const insertLoginStreakSchema = createInsertSchema(loginStreaks, {
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
});

export const insertSpikeTransactionSchema = createInsertSchema(spikeTransactions, {
  amount: z.number().int(),
  balance: z.number().int().min(0),
  description: z.string().min(1),
});

export const insertReferralSchema = createInsertSchema(referrals, {
  referralCode: z.string().min(6),
});

// Types
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type LoginStreak = typeof loginStreaks.$inferSelect;
export type SpikeTransaction = typeof spikeTransactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertLoginStreak = z.infer<typeof insertLoginStreakSchema>;
export type InsertSpikeTransaction = z.infer<typeof insertSpikeTransactionSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Workout Library System
export const workoutLibrary = pgTable("workout_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ['coming', 'completed', 'saved'] }).notNull(),
  content: json("content").notNull(), // Structured workout content
  isPublic: boolean("is_public").default(false),
  originalUserId: integer("original_user_id").references(() => users.id), // For saved workouts, null if created by user
  completedAt: timestamp("completed_at"), // When the workout was completed (if applicable)
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutLibraryRelations = relations(workoutLibrary, ({ one }) => ({
  user: one(users, {
    fields: [workoutLibrary.userId],
    references: [users.id],
  }),
  originalUser: one(users, {
    fields: [workoutLibrary.originalUserId],
    references: [users.id],
    relationName: "original_creator",
  }),
}));

export const workoutSessionPreview = pgTable("workout_session_preview", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workoutLibrary.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  previewText: text("preview_text").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutSessionPreviewRelations = relations(workoutSessionPreview, ({ one }) => ({
  workout: one(workoutLibrary, {
    fields: [workoutSessionPreview.workoutId],
    references: [workoutLibrary.id],
  }),
  user: one(users, {
    fields: [workoutSessionPreview.userId],
    references: [users.id],
  }),
}));

// Create Insert Schemas for the new tables
export const insertWorkoutLibrarySchema = createInsertSchema(workoutLibrary, {
  content: z.record(z.string(), z.any()),
}).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSessionPreviewSchema = createInsertSchema(workoutSessionPreview).omit({
  id: true,
  createdAt: true,
});

// Create Type Definitions
export type WorkoutLibrary = typeof workoutLibrary.$inferSelect;
export type InsertWorkoutLibrary = z.infer<typeof insertWorkoutLibrarySchema>;
export type WorkoutSessionPreview = typeof workoutSessionPreview.$inferSelect;
export type InsertWorkoutSessionPreview = z.infer<typeof insertWorkoutSessionPreviewSchema>;

// Training Programs
export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Creator
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility", { enum: ['private', 'public', 'premium'] }).default('private'),
  price: integer("price").default(0), // In spikes currency (for premium programs)
  coverImageUrl: text("cover_image_url"),
  category: text("category").notNull(), // sprint, distance, jumps, throws, etc.
  level: text("level"), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // In days
  totalSessions: integer("total_sessions").default(0),
  isUploadedProgram: boolean("is_uploaded_program").default(false),
  programFileUrl: text("program_file_url"), // URL to uploaded document
  programFileType: text("program_file_type"), // pdf, excel, doc, etc.
  importedFromSheet: boolean("imported_from_sheet").default(false),
  googleSheetUrl: text("google_sheet_url"), // URL to the Google Sheet
  googleSheetId: text("google_sheet_id"), // Google Sheet ID
  createdAt: timestamp("created_at").defaultNow(),
});

// Program assignments (for coach to athlete)
export const programAssignments = pgTable("program_assignments", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  assignerId: integer("assigner_id").notNull().references(() => users.id), // Coach who assigns
  assigneeId: integer("assignee_id").notNull().references(() => users.id), // Athlete who receives
  status: text("status", { enum: ['pending', 'accepted', 'completed', 'rejected'] }).default('pending'),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const programAssignmentsRelations = relations(programAssignments, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [programAssignments.programId],
    references: [trainingPrograms.id],
  }),
  assigner: one(users, {
    fields: [programAssignments.assignerId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [programAssignments.assigneeId],
    references: [users.id],
  }),
}));

export const trainingProgramsRelations = relations(trainingPrograms, ({ one, many }) => ({
  creator: one(users, {
    fields: [trainingPrograms.userId],
    references: [users.id],
  }),
  sessions: many(programSessions),
  purchases: many(programPurchases),
  assignments: many(programAssignments),
}));

export const programSessions = pgTable("program_sessions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  workoutId: integer("workout_id").references(() => workoutLibrary.id),
  title: text("title"),
  description: text("description"),
  dayNumber: integer("day_number"), // Day in the program (1, 2, 3...)
  orderInDay: integer("order_in_day").default(1), // Order if multiple sessions in a day
  
  // Google Sheet import specific fields
  date: text("date"), // ISO Date string for sheet imports
  shortDistanceWorkout: text("short_distance_workout"), // 60/100m focused sessions
  mediumDistanceWorkout: text("medium_distance_workout"), // 200m focused sessions 
  longDistanceWorkout: text("long_distance_workout"), // 400m focused sessions
  preActivation1: text("pre_activation_1"), // Pre-Activation 1
  preActivation2: text("pre_activation_2"), // Pre-Activation 2
  extraSession: text("extra_session"), // Extra afternoon sessions
  isRestDay: boolean("is_rest_day").default(false),
  
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programSessionsRelations = relations(programSessions, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [programSessions.programId],
    references: [trainingPrograms.id],
  }),
  workout: one(workoutLibrary, {
    fields: [programSessions.workoutId],
    references: [workoutLibrary.id],
  }),
}));

export const programPurchases = pgTable("program_purchases", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  price: integer("price").notNull(), // How many spikes were paid
  isFree: boolean("is_free").default(false), // If it was given for free
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const programPurchasesRelations = relations(programPurchases, ({ one }) => ({
  program: one(trainingPrograms, {
    fields: [programPurchases.programId],
    references: [trainingPrograms.id],
  }),
  user: one(users, {
    fields: [programPurchases.userId],
    references: [users.id],
  }),
}));

export const programProgress = pgTable("program_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  sessionId: integer("session_id").notNull().references(() => programSessions.id),
  completedAt: timestamp("completed_at").notNull(),
  rating: integer("rating"), // User rating for the session (1-5)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programProgressRelations = relations(programProgress, ({ one }) => ({
  user: one(users, {
    fields: [programProgress.userId],
    references: [users.id],
  }),
  program: one(trainingPrograms, {
    fields: [programProgress.programId],
    references: [trainingPrograms.id],
  }),
  session: one(programSessions, {
    fields: [programProgress.sessionId],
    references: [programSessions.id],
  }),
}));

// Create Insert Schemas for programs
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({
  id: true,
  createdAt: true,
});

export const insertProgramAssignmentSchema = createInsertSchema(programAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
});

export const insertProgramSessionSchema = createInsertSchema(programSessions).omit({
  id: true,
  createdAt: true,
});

export const insertProgramPurchaseSchema = createInsertSchema(programPurchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertProgramProgressSchema = createInsertSchema(programProgress).omit({
  id: true,
  createdAt: true,
});

// Create Type Definitions
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;

export type ProgramAssignment = typeof programAssignments.$inferSelect;
export type InsertProgramAssignment = z.infer<typeof insertProgramAssignmentSchema>;

export type ProgramSession = typeof programSessions.$inferSelect;
export type InsertProgramSession = z.infer<typeof insertProgramSessionSchema>;

export type ProgramPurchase = typeof programPurchases.$inferSelect;
export type InsertProgramPurchase = z.infer<typeof insertProgramPurchaseSchema>;

export type ProgramProgress = typeof programProgress.$inferSelect;
export type InsertProgramProgress = z.infer<typeof insertProgramProgressSchema>;

// Additional relations for users with spikes system
export const usersSpikesRelations = relations(users, ({ many, one }) => ({
  userAchievements: many(userAchievements),
  loginStreaks: one(loginStreaks),
  spikeTransactions: many(spikeTransactions),
  referrals: many(referrals, { relationName: "referrer" }),
  workouts: many(workoutLibrary),
  workoutPreviews: many(workoutSessionPreview),
}));
