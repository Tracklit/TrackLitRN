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
  subscriptionTier: text("subscription_tier").default("free"), // free, pro, star
  isCoach: boolean("is_coach").default(false),
  role: text("role").default("athlete"), // athlete, coach, admin, or both
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  spikes: integer("spikes").default(0), // In-app currency/tokens
  sprinthiaPrompts: integer("sprinthia_prompts").default(1), // Available AI prompts
  sprinthiaProgramsCreated: integer("sprinthia_programs_created").default(0), // Track AI program generations
  sprinthiaRegenerationsUsed: integer("sprinthia_regenerations_used").default(0), // Track regenerations
  defaultClubId: integer("default_club_id"), // Will be connected through relations
  isBlocked: boolean("is_blocked").default(false), // For admin blocking
  isPrivate: boolean("is_private").default(false), // Privacy setting for profile visibility
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  meetsAsAthlete: many(meets),
  meetsAsCoach: many(meets, { relationName: "coach_meets" }),
  athleteGroups: many(athleteGroups),
  athleteGroupMemberships: many(athleteGroupMembers, { relationName: "athlete_memberships" }),

  coachRelations: many(coaches, { relationName: "coach_side" }),
  athleteRelations: many(coaches, { relationName: "athlete_side" }),
  coachAthleteRelations: many(coachAthletes, { relationName: "coach_relationships" }),
  athleteCoachRelations: many(coachAthletes, { relationName: "athlete_relationships" }),
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
  sentMeetInvitations: many(meetInvitations, { relationName: "sent_invitations" }),
  receivedMeetInvitations: many(meetInvitations, { relationName: "received_invitations" }),
  
  // Subscription relations
  subscriptionOffers: many(userSubscriptions, { relationName: "subscription_offers" }),
  subscriptionsPurchased: many(subscriptionPurchases, { relationName: "subscriptions_purchased" }),
  subscriptionsReceived: many(subscriptionPurchases, { relationName: "subscriptions_received" }),
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
  websiteUrl: text("website_url"), // Official webpage URL for the meet
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
  invitations: many(meetInvitations),
}));

// Meet Invitations Table
export const meetInvitations = pgTable("meet_invitations", {
  id: serial("id").primaryKey(),
  meetId: integer("meet_id").notNull().references(() => meets.id),
  inviterId: integer("inviter_id").notNull().references(() => users.id), // User who sent the invitation
  inviteeId: integer("invitee_id").notNull().references(() => users.id), // User who received the invitation
  status: text("status").default("pending"), // pending, accepted, declined
  message: text("message"), // Optional message from inviter
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const meetInvitationsRelations = relations(meetInvitations, ({ one }) => ({
  meet: one(meets, {
    fields: [meetInvitations.meetId],
    references: [meets.id],
  }),
  inviter: one(users, {
    fields: [meetInvitations.inviterId],
    references: [users.id],
    relationName: "sent_invitations",
  }),
  invitee: one(users, {
    fields: [meetInvitations.inviteeId],
    references: [users.id],
    relationName: "received_invitations",
  }),
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
  thumbUrl: text("thumb_url"), // 200x200 square thumbnail
  mediumUrl: text("medium_url"), // 400x300 for cards
  largeUrl: text("large_url"), // 800x400 for large displays
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
  logoThumbUrl: text("logo_thumb_url"), // 200x200 square logo
  logoMediumUrl: text("logo_medium_url"), // 400x300 logo
  logoLargeUrl: text("logo_large_url"), // 800x400 logo
  bannerUrl: text("banner_url"), // New field for club banner image
  bannerThumbUrl: text("banner_thumb_url"), // 200x200 square banner
  bannerMediumUrl: text("banner_medium_url"), // 400x300 banner
  bannerLargeUrl: text("banner_large_url"), // 800x400 banner
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

}));





export const videoAnalysis = pgTable("video_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type").notNull(),
  status: text("status").default("uploading"), // uploading, processing, completed, failed
  analysisData: text("analysis_data"), // JSON string of analysis results
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const videoAnalysisRelations = relations(videoAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [videoAnalysis.userId],
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

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
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
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertCoachingRequest = z.infer<typeof insertCoachingRequestSchema>;
export type SelectCoachingRequest = typeof coachingRequests.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

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



// Select types
export type Club = typeof clubs.$inferSelect;

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

// Workout Reactions (Likes/Dislikes)
export const workoutReactions = pgTable("workout_reactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").notNull().references(() => programSessions.id),
  reactionType: text("reaction_type").notNull(), // "like" or "dislike"
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'program_assigned', 'meet_invitation', 'workout_liked', 'achievement', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related entity (program, meet, etc.)
  relatedType: text("related_type"), // 'program', 'meet', 'workout', etc.
  actionUrl: text("action_url"), // URL to navigate to when clicked
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutReactionsRelations = relations(workoutReactions, ({ one }) => ({
  user: one(users, {
    fields: [workoutReactions.userId],
    references: [users.id],
  }),
  session: one(programSessions, {
    fields: [workoutReactions.sessionId],
    references: [programSessions.id],
  }),
}));

export const insertWorkoutReactionSchema = createInsertSchema(workoutReactions).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkoutReaction = z.infer<typeof insertWorkoutReactionSchema>;
export type WorkoutReaction = typeof workoutReactions.$inferSelect;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Select types
export type ClubMember = typeof clubMembers.$inferSelect;

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

export const affiliateSubmissions = pgTable("affiliate_submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  socialMediaHandles: text("social_media_handles").notNull(),
  audienceSize: integer("audience_size").notNull(),
  trackLitUsername: text("tracklit_username").notNull(),
  hasTrackLitAccount: boolean("has_tracklit_account").notNull(),
  agreesToLOI: boolean("agrees_to_loi").notNull(),
  signature: text("signature").notNull(),
  assignedTier: text("assigned_tier").notNull(),
  submittedAt: timestamp("submitted_at").notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  status: text("status", { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  adminNotes: text("admin_notes"),
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

export const affiliateSubmissionsRelations = relations(affiliateSubmissions, ({ one }) => ({
  reviewedByUser: one(users, {
    fields: [affiliateSubmissions.reviewedBy],
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

export const insertAffiliateSubmissionSchema = createInsertSchema(affiliateSubmissions, {
  fullName: z.string().min(1),
  email: z.string().email(),
  socialMediaHandles: z.string().min(1),
  audienceSize: z.number().int().min(1000),
  trackLitUsername: z.string().min(1),
  signature: z.string().min(1),
  assignedTier: z.string().min(1),
});

// Types
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type LoginStreak = typeof loginStreaks.$inferSelect;
export type SpikeTransaction = typeof spikeTransactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type AffiliateSubmission = typeof affiliateSubmissions.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertLoginStreak = z.infer<typeof insertLoginStreakSchema>;
export type InsertSpikeTransaction = z.infer<typeof insertSpikeTransactionSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertAffiliateSubmission = z.infer<typeof insertAffiliateSubmissionSchema>;



export const insertVideoAnalysisSchema = createInsertSchema(videoAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = z.infer<typeof insertVideoAnalysisSchema>;

// Competition Calendar Tables
export const competitionsTable = pgTable('competitions', {
  id: serial('id').primaryKey(),
  externalId: integer('external_id').unique(), // World Athletics competition ID
  name: text('name').notNull(),
  location: text('location'),
  country: text('country'),
  city: text('city'),
  rankingCategory: text('ranking_category'),
  disciplines: text('disciplines').array(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  competitionGroup: text('competition_group'),
  competitionSubgroup: text('competition_subgroup'),
  hasResults: boolean('has_results').default(false),
  hasStartlist: boolean('has_startlist').default(false),
  hasCompetitionInformation: boolean('has_competition_information').default(false),
  websiteUrl: text('website_url'),
  liveStreamUrl: text('live_stream_url'),
  resultsUrl: text('results_url'),
  additionalInfo: text('additional_info'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const competitionEventsTable = pgTable('competition_events', {
  id: serial('id').primaryKey(),
  competitionId: integer('competition_id').references(() => competitionsTable.id, { onDelete: 'cascade' }),
  externalEventId: integer('external_event_id'),
  eventName: text('event_name'),
  disciplineName: text('discipline_name'),
  disciplineCode: text('discipline_code'),
  category: text('category'),
  sex: text('sex'), // 'M', 'W', 'X'
  combined: boolean('combined').default(false),
  date: timestamp('date'),
  day: integer('day'),
  createdAt: timestamp('created_at').defaultNow()
});

export const athleteCompetitionResultsTable = pgTable('athlete_competition_results', {
  id: serial('id').primaryKey(),
  competitionId: integer('competition_id').references(() => competitionsTable.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').references(() => competitionEventsTable.id, { onDelete: 'cascade' }),
  athleteName: text('athlete_name'),
  athleteId: integer('athlete_id'), // World Athletics athlete ID
  country: text('country'),
  place: integer('place'),
  performance: text('performance'),
  performanceValue: integer('performance_value'), // Converted to milliseconds/centimeters
  wind: text('wind'),
  raceNumber: integer('race_number'),
  raceName: text('race_name'),
  date: timestamp('date'),
  createdAt: timestamp('created_at').defaultNow()
});

export const userFavoriteCompetitionsTable = pgTable('user_favorite_competitions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  competitionId: integer('competition_id').references(() => competitionsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

export const competitionNotificationsTable = pgTable('competition_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  competitionId: integer('competition_id').references(() => competitionsTable.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type'), // 'start_reminder', 'results_available', 'favorites_competing'
  isEnabled: boolean('is_enabled').default(true),
  reminderDays: integer('reminder_days').default(1), // Days before event to send notification
  createdAt: timestamp('created_at').defaultNow()
});

// Relations for competition tables
export const competitionsRelations = relations(competitionsTable, ({ many }) => ({
  events: many(competitionEventsTable),
  results: many(athleteCompetitionResultsTable),
  userFavorites: many(userFavoriteCompetitionsTable),
  notifications: many(competitionNotificationsTable)
}));

export const competitionEventsRelations = relations(competitionEventsTable, ({ one, many }) => ({
  competition: one(competitionsTable, {
    fields: [competitionEventsTable.competitionId],
    references: [competitionsTable.id]
  }),
  results: many(athleteCompetitionResultsTable)
}));

export const athleteCompetitionResultsRelations = relations(athleteCompetitionResultsTable, ({ one }) => ({
  competition: one(competitionsTable, {
    fields: [athleteCompetitionResultsTable.competitionId],
    references: [competitionsTable.id]
  }),
  event: one(competitionEventsTable, {
    fields: [athleteCompetitionResultsTable.eventId],
    references: [competitionEventsTable.id]
  })
}));

export const userFavoriteCompetitionsRelations = relations(userFavoriteCompetitionsTable, ({ one }) => ({
  user: one(users, {
    fields: [userFavoriteCompetitionsTable.userId],
    references: [users.id]
  }),
  competition: one(competitionsTable, {
    fields: [userFavoriteCompetitionsTable.competitionId],
    references: [competitionsTable.id]
  })
}));

export const competitionNotificationsRelations = relations(competitionNotificationsTable, ({ one }) => ({
  user: one(users, {
    fields: [competitionNotificationsTable.userId],
    references: [users.id]
  }),
  competition: one(competitionsTable, {
    fields: [competitionNotificationsTable.competitionId],
    references: [competitionsTable.id]
  })
}));

// Insert schemas for competition tables
export const insertCompetitionSchema = createInsertSchema(competitionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCompetitionEventSchema = createInsertSchema(competitionEventsTable).omit({
  id: true,
  createdAt: true
});

export const insertAthleteCompetitionResultSchema = createInsertSchema(athleteCompetitionResultsTable).omit({
  id: true,
  createdAt: true
});

export const insertUserFavoriteCompetitionSchema = createInsertSchema(userFavoriteCompetitionsTable).omit({
  id: true,
  createdAt: true
});

export const insertCompetitionNotificationSchema = createInsertSchema(competitionNotificationsTable).omit({
  id: true,
  createdAt: true
});

// Types
export type Competition = typeof competitionsTable.$inferSelect;
export type CompetitionEvent = typeof competitionEventsTable.$inferSelect;
export type AthleteCompetitionResult = typeof athleteCompetitionResultsTable.$inferSelect;
export type UserFavoriteCompetition = typeof userFavoriteCompetitionsTable.$inferSelect;
export type CompetitionNotification = typeof competitionNotificationsTable.$inferSelect;

export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertCompetitionEvent = z.infer<typeof insertCompetitionEventSchema>;
export type InsertAthleteCompetitionResult = z.infer<typeof insertAthleteCompetitionResultSchema>;
export type InsertUserFavoriteCompetition = z.infer<typeof insertUserFavoriteCompetitionSchema>;
export type InsertCompetitionNotification = z.infer<typeof insertCompetitionNotificationSchema>;

// Sprinthia AI Conversations
export const sprinthiaConversations = pgTable("sprinthia_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sprinthiaMessages = pgTable("sprinthia_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => sprinthiaConversations.id),
  role: text("role", { enum: ['user', 'assistant'] }).notNull(),
  content: text("content").notNull(),
  promptCost: integer("prompt_cost").default(1), // How many prompts this message cost
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Community Activity Feed for Ticker Carousel
export const communityActivities = pgTable("community_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // workout, user_joined, meet_created, meet_results, coach_status, program_assigned, group_joined
  title: text("title").notNull(), // Display title for the activity
  description: text("description"), // Optional additional details
  relatedEntityId: integer("related_entity_id"), // ID of related meet, program, group, etc.
  relatedEntityType: text("related_entity_type"), // meet, program, group, etc.
  metadata: json("metadata"), // Additional flexible data
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityActivitiesRelations = relations(communityActivities, ({ one }) => ({
  user: one(users, {
    fields: [communityActivities.userId],
    references: [users.id],
  }),
}));

export const insertCommunityActivitySchema = createInsertSchema(communityActivities).omit({
  id: true,
  createdAt: true,
});

export type CommunityActivity = typeof communityActivities.$inferSelect;
export type InsertCommunityActivity = z.infer<typeof insertCommunityActivitySchema>;

// Direct Messages

// Direct Messages
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: "sent_messages",
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
    relationName: "received_messages",
  }),
}));

// Following/Followers
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers",
  }),
}));

// Message Conversations (for organizing DMs)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  lastMessageId: integer("last_message_id").references(() => directMessages.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "conversations_as_user1",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "conversations_as_user2",
  }),
  lastMessage: one(directMessages, {
    fields: [conversations.lastMessageId],
    references: [directMessages.id],
  }),
}));

// Insert schemas
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

// Types
export type DirectMessage = typeof directMessages.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

// Exercise Library
export const exerciseLibrary = pgTable("exercise_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ['upload', 'youtube', 'video_analysis'] }).notNull(),
  fileUrl: text("file_url"), // For uploaded videos/images
  youtubeUrl: text("youtube_url"), // For YouTube links
  youtubeVideoId: text("youtube_video_id"), // Extracted YouTube video ID
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // In seconds for videos
  fileSize: integer("file_size"), // In bytes for uploads
  mimeType: text("mime_type"), // For uploaded files
  isPublic: boolean("is_public").default(false),
  tags: text("tags").array(), // Array of tags for categorization
  videoAnalysisId: integer("video_analysis_id").references(() => videoAnalysis.id), // For video_analysis type entries
  analysisData: text("analysis_data"), // JSON string of biomechanical analysis data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseLibraryRelations = relations(exerciseLibrary, ({ one, many }) => ({
  user: one(users, {
    fields: [exerciseLibrary.userId],
    references: [users.id],
  }),
  shares: many(exerciseShares),
}));

// Exercise Shares (for sharing videos with connections/athletes)
export const exerciseShares = pgTable("exercise_shares", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exerciseLibrary.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  message: text("message"), // Optional message with the share
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Library Shares (for sharing full exercise library access)
export const libraryShares = pgTable("library_shares", {
  id: serial("id").primaryKey(),
  sharerId: integer("sharer_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  sharedAt: timestamp("shared_at").defaultNow(),
  tier: text("tier", { enum: ['free', 'pro', 'star'] }).notNull(),
  isActive: boolean("is_active").default(true),
});

export const exerciseSharesRelations = relations(exerciseShares, ({ one }) => ({
  exercise: one(exerciseLibrary, {
    fields: [exerciseShares.exerciseId],
    references: [exerciseLibrary.id],
  }),
  fromUser: one(users, {
    fields: [exerciseShares.fromUserId],
    references: [users.id],
    relationName: "shared_exercises_sent",
  }),
  toUser: one(users, {
    fields: [exerciseShares.toUserId],
    references: [users.id],
    relationName: "shared_exercises_received",
  }),
}));

export const librarySharesRelations = relations(libraryShares, ({ one }) => ({
  sharer: one(users, {
    fields: [libraryShares.sharerId],
    references: [users.id],
    relationName: "library_shares_given",
  }),
  recipient: one(users, {
    fields: [libraryShares.recipientId],
    references: [users.id],
    relationName: "library_shares_received",
  }),
}));

// Training Programs
export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Creator
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility", { enum: ['private', 'public', 'premium'] }).default('private'),
  price: integer("price").default(0), // In spikes currency (for premium programs)
  priceType: text("price_type", { enum: ['spikes', 'money'] }).default('spikes'), // spikes or money (Stripe)
  stripeProductId: text("stripe_product_id"), // Stripe product ID for monetized programs
  stripePriceId: text("stripe_price_id"), // Stripe price ID for monetized programs
  coverImageUrl: text("cover_image_url"),
  category: text("category").default('general'), // sprint, distance, jumps, throws, etc.
  level: text("level").default('intermediate'), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // In days
  totalSessions: integer("total_sessions").default(0),
  isUploadedProgram: boolean("is_uploaded_program").default(false),
  programFileUrl: text("program_file_url"), // URL to uploaded document
  programFileType: text("program_file_type"), // pdf, excel, doc, etc.
  importedFromSheet: boolean("imported_from_sheet").default(false),
  googleSheetUrl: text("google_sheet_url"), // URL to the Google Sheet
  googleSheetId: text("google_sheet_id"), // Google Sheet ID
  isTextBased: boolean("is_text_based").default(false),
  textContent: text("text_content"), // Free-form text content for text-based programs
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach-Athlete relationships
export const coachAthletes = pgTable("coach_athletes", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull().references(() => users.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coachAthletesRelations = relations(coachAthletes, ({ one }) => ({
  coach: one(users, {
    fields: [coachAthletes.coachId],
    references: [users.id],
    relationName: "coach_relationships"
  }),
  athlete: one(users, {
    fields: [coachAthletes.athleteId],
    references: [users.id],
    relationName: "athlete_relationships"
  }),
}));

// Coaching requests (bidirectional)
export const coachingRequests = pgTable("coaching_requests", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  requestType: text("request_type", { enum: ['coach_invite', 'athlete_request'] }).notNull(), 
  // coach_invite: Coach inviting athlete to join their roster
  // athlete_request: Athlete requesting to be coached by coach
  status: text("status", { enum: ['pending', 'accepted', 'declined'] }).default('pending'),
  message: text("message"), // Optional message with the request
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const coachingRequestsRelations = relations(coachingRequests, ({ one }) => ({
  fromUser: one(users, {
    fields: [coachingRequests.fromUserId],
    references: [users.id],
    relationName: "sent_coaching_requests"
  }),
  toUser: one(users, {
    fields: [coachingRequests.toUserId],
    references: [users.id],
    relationName: "received_coaching_requests"
  }),
}));

export const insertCoachingRequestSchema = createInsertSchema(coachingRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
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
  gymData: text("gym_data").array(), // Gym exercises fetched from "Gym X" references
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

export const insertCoachAthleteSchema = createInsertSchema(coachAthletes).omit({
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

// ============ TELEGRAM-STYLE CHAT SYSTEM ============

// Chat Groups (Telegram-style channels)
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  adminIds: integer("admin_ids").array().notNull().default([]),
  memberIds: integer("member_ids").array().notNull().default([]),
  isPrivate: boolean("is_private").notNull().default(false),
  inviteCode: text("invite_code"),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  lastMessage: text("last_message"),
  lastMessageSenderId: integer("last_message_sender_id").references(() => users.id),
  messageCount: integer("message_count").notNull().default(0),
});

// Chat Group Messages
export const chatGroupMessages = pgTable("chat_group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderProfileImage: text("sender_profile_image"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  linkPreview: json("link_preview").$type<{
    title: string;
    description: string;
    image: string;
    url: string;
  }>(),
  replyToId: integer("reply_to_id").references((): any => chatGroupMessages.id),
  messageType: text("message_type").notNull().default("text"), // text, image, file, system
  mediaUrl: text("media_url"),
  isPinned: boolean("is_pinned").notNull().default(false),
});

// Chat Group Members (for detailed member management)
export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // member, admin, creator
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadMessageId: integer("last_read_message_id").references(() => chatGroupMessages.id),
  isMuted: boolean("is_muted").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(), // Can reference either group or direct messages
  messageType: text("message_type").notNull(), // "group" or "direct"
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull().default("👍"), // Default to thumbs up
  createdAt: timestamp("created_at").defaultNow(),
});



// Enhanced Direct Messages (for 1-on-1 chats)
export const telegramDirectMessages = pgTable("telegram_direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  linkPreview: json("link_preview").$type<{
    title: string;
    description: string;
    image: string;
    url: string;
  }>(),
  replyToId: integer("reply_to_id"),
  messageType: text("message_type").notNull().default("text"), // text, image, file
  mediaUrl: text("media_url"),
});

// Typing Status (for real-time typing indicators)
export const typingStatus = pgTable("typing_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: integer("group_id").references(() => chatGroups.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  isTyping: boolean("is_typing").notNull().default(false),
  lastTypingAt: timestamp("last_typing_at").defaultNow(),
});

// Relations for chat system
export const chatGroupsRelations = relations(chatGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [chatGroups.creatorId],
    references: [users.id],
    relationName: "created_groups",
  }),
  lastMessageSender: one(users, {
    fields: [chatGroups.lastMessageSenderId],
    references: [users.id],
    relationName: "last_message_sender",
  }),
  messages: many(chatGroupMessages),
  members: many(chatGroupMembers),
}));

export const chatGroupMessagesRelations = relations(chatGroupMessages, ({ one, many }) => ({
  group: one(chatGroups, {
    fields: [chatGroupMessages.groupId],
    references: [chatGroups.id],
  }),
  sender: one(users, {
    fields: [chatGroupMessages.senderId],
    references: [users.id],
    relationName: "sent_group_messages",
  }),
  replyTo: one(chatGroupMessages, {
    fields: [chatGroupMessages.replyToId],
    references: [chatGroupMessages.id],
    relationName: "reply_message",
  }),
  reactions: many(messageReactions),
}));

export const chatGroupMembersRelations = relations(chatGroupMembers, ({ one }) => ({
  group: one(chatGroups, {
    fields: [chatGroupMembers.groupId],
    references: [chatGroups.id],
  }),
  user: one(users, {
    fields: [chatGroupMembers.userId],
    references: [users.id],
    relationName: "group_memberships",
  }),
  lastReadMessage: one(chatGroupMessages, {
    fields: [chatGroupMembers.lastReadMessageId],
    references: [chatGroupMessages.id],
  }),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));



export const telegramDirectMessagesRelations = relations(telegramDirectMessages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [telegramDirectMessages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [telegramDirectMessages.senderId],
    references: [users.id],
    relationName: "sent_direct_messages",
  }),
  receiver: one(users, {
    fields: [telegramDirectMessages.receiverId],
    references: [users.id],
    relationName: "received_direct_messages",
  }),
  replyTo: one(telegramDirectMessages, {
    fields: [telegramDirectMessages.replyToId],
    references: [telegramDirectMessages.id],
    relationName: "reply_direct_message",
  }),
  reactions: many(messageReactions),
}));

export const typingStatusRelations = relations(typingStatus, ({ one }) => ({
  user: one(users, {
    fields: [typingStatus.userId],
    references: [users.id],
  }),
  group: one(chatGroups, {
    fields: [typingStatus.groupId],
    references: [chatGroups.id],
  }),
  conversation: one(conversations, {
    fields: [typingStatus.conversationId],
    references: [conversations.id],
  }),
}));

// Insert schemas for chat system
export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({ 
  id: true, 
  createdAt: true, 
  lastMessageAt: true,
  messageCount: true 
});

export const insertChatGroupMessageSchema = createInsertSchema(chatGroupMessages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertChatGroupMemberSchema = createInsertSchema(chatGroupMembers).omit({ 
  id: true, 
  joinedAt: true,
  lastSeenAt: true 
});

export const insertTelegramDirectMessageSchema = createInsertSchema(telegramDirectMessages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTypingStatusSchema = createInsertSchema(typingStatus).omit({ 
  id: true, 
  lastTypingAt: true 
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({ 
  id: true, 
  createdAt: true 
});

// Types for chat system
export type ChatGroup = typeof chatGroups.$inferSelect;
export type NewChatGroup = z.infer<typeof insertChatGroupSchema>;

export type ChatGroupMessage = typeof chatGroupMessages.$inferSelect;
export type NewChatGroupMessage = z.infer<typeof insertChatGroupMessageSchema>;

export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type NewChatGroupMember = z.infer<typeof insertChatGroupMemberSchema>;

export type TelegramDirectMessage = typeof telegramDirectMessages.$inferSelect;
export type NewTelegramDirectMessage = z.infer<typeof insertTelegramDirectMessageSchema>;

export type TypingStatus = typeof typingStatus.$inferSelect;
export type NewTypingStatus = z.infer<typeof insertTypingStatusSchema>;

export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = z.infer<typeof insertMessageReactionSchema>;

export type ProgramProgress = typeof programProgress.$inferSelect;
export type InsertProgramProgress = z.infer<typeof insertProgramProgressSchema>;

export type CoachAthlete = typeof coachAthletes.$inferSelect;
export type InsertCoachAthlete = z.infer<typeof insertCoachAthleteSchema>;

// Sprinthia Relations
export const sprinthiaConversationsRelations = relations(sprinthiaConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [sprinthiaConversations.userId],
    references: [users.id],
  }),
  messages: many(sprinthiaMessages),
}));

export const sprinthiaMessagesRelations = relations(sprinthiaMessages, ({ one }) => ({
  conversation: one(sprinthiaConversations, {
    fields: [sprinthiaMessages.conversationId],
    references: [sprinthiaConversations.id],
  }),
}));

// Sprinthia Schemas
export const insertSprinthiaConversationSchema = createInsertSchema(sprinthiaConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSprinthiaMessageSchema = createInsertSchema(sprinthiaMessages).omit({
  id: true,
  createdAt: true,
});

// Sprinthia Types
export type SprinthiaConversation = typeof sprinthiaConversations.$inferSelect;
export type SprinthiaMessage = typeof sprinthiaMessages.$inferSelect;
export type InsertSprinthiaConversation = z.infer<typeof insertSprinthiaConversationSchema>;
export type InsertSprinthiaMessage = z.infer<typeof insertSprinthiaMessageSchema>;

// Exercise Library insert schemas and types
export const insertExerciseLibrarySchema = createInsertSchema(exerciseLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseShareSchema = createInsertSchema(exerciseShares).omit({
  id: true,
  createdAt: true,
});

export const insertLibraryShareSchema = createInsertSchema(libraryShares).omit({
  id: true,
  sharedAt: true,
});

export type ExerciseLibrary = typeof exerciseLibrary.$inferSelect;
export type ExerciseShare = typeof exerciseShares.$inferSelect;
export type LibraryShare = typeof libraryShares.$inferSelect;
export type InsertExerciseLibrary = z.infer<typeof insertExerciseLibrarySchema>;
export type InsertExerciseShare = z.infer<typeof insertExerciseShareSchema>;
export type InsertLibraryShare = z.infer<typeof insertLibraryShareSchema>;

// Blocked users table for user blocking functionality
export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  blocker: one(users, {
    fields: [blockedUsers.blockerId],
    references: [users.id],
    relationName: "blocker"
  }),
  blocked: one(users, {
    fields: [blockedUsers.blockedId],
    references: [users.id],
    relationName: "blocked"
  }),
}));

// Schema and types for blocked users
export const insertBlockedUserSchema = createInsertSchema(blockedUsers).omit({
  id: true,
  createdAt: true,
});

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;

// Additional relations for users with spikes system
export const usersSpikesRelations = relations(users, ({ many, one }) => ({
  userAchievements: many(userAchievements),
  loginStreaks: one(loginStreaks),
  spikeTransactions: many(spikeTransactions),
  referrals: many(referrals, { relationName: "referrer" }),
  workouts: many(workoutLibrary),
  workoutPreviews: many(workoutSessionPreview),
  sprinthiaConversations: many(sprinthiaConversations),
  exerciseLibrary: many(exerciseLibrary),
  exerciseSharesSent: many(exerciseShares, { relationName: "shared_exercises_sent" }),
  exerciseSharesReceived: many(exerciseShares, { relationName: "shared_exercises_received" }),
  blockedByMe: many(blockedUsers, { relationName: "blocker" }),
  blockedMe: many(blockedUsers, { relationName: "blocked" }),
}));

// =================
// MARKETPLACE TABLES
// =================

// Base marketplace listings table
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'program' or 'consulting'
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  coachId: integer("coach_id").notNull().references(() => users.id),
  heroUrl: text("hero_url").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("USD"),
  visibility: text("visibility").default("draft"), // 'public', 'unlisted', 'draft'
  tags: text("tags").array(),
  badges: text("badges").array(),
  rating: json("rating"), // { value: number, count: number }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Program-specific listing details
export const programListings = pgTable("program_listings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  programId: integer("program_id").notNull().references(() => trainingPrograms.id),
  durationWeeks: integer("duration_weeks").notNull(),
  level: text("level").notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  category: text("category"), // 'Speed', 'Endurance', 'Strength', 'Mobility'
  compareAtPriceCents: integer("compare_at_price_cents"),
});

// Consulting-specific listing details
export const consultingListings = pgTable("consulting_listings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  description: text("description"),
  slotLengthMin: integer("slot_length_min").notNull(),
  pricePerSlotCents: integer("price_per_slot_cents").notNull(),
  maxParticipants: integer("max_participants").notNull().default(1),
  deliveryFormat: text("delivery_format").notNull(),
  requirements: text("requirements"),
  whatYouGet: text("what_you_get"),
  sessionDurationMinutes: integer("session_duration_minutes").notNull(),
  category: text("category").notNull(),
  availability: text("availability").default("available"),
  bufferMin: integer("buffer_min").default(15),
  groupMax: integer("group_max").default(1),
  reschedulePolicy: text("reschedule_policy").default("moderate"), // 'flexible', 'moderate', 'strict'
  meetingLinkTemplate: text("meeting_link_template"),
});

// Individual consulting time slots
export const consultingSlots = pgTable("consulting_slots", {
  id: serial("id").primaryKey(),
  consultingListingId: integer("consulting_listing_id").notNull().references(() => consultingListings.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  available: boolean("available").default(true),
  maxSeats: integer("max_seats").default(1),
  bookedSeats: integer("booked_seats").default(0),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart items
export const marketplaceCartItems = pgTable("marketplace_cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'program' or 'consulting'
  quantity: integer("quantity").default(1),
  metadata: json("metadata"), // For consulting: selected slot IDs, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const marketplaceOrders = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  subtotalCents: integer("subtotal_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  taxCents: integer("tax_cents").default(0),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending"), // 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  buyerSubscriptionTier: text("buyer_subscription_tier"), // Used for platform fee calculation
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Order items
export const marketplaceOrderItems = pgTable("marketplace_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => marketplaceOrders.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'program' or 'consulting'
  quantity: integer("quantity").default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalPriceCents: integer("total_price_cents").notNull(),
  metadata: json("metadata"), // For consulting: slot IDs, meeting links, etc.
  status: text("status").default("pending"), // 'pending', 'fulfilled', 'cancelled'
  fulfilledAt: timestamp("fulfilled_at"),
});

// Reviews for marketplace items
export const marketplaceReviews = pgTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => marketplaceOrders.id), // Link to purchase
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content"),
  tags: text("tags").array(), // e.g., ["400m", "In-season"]
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =================
// MARKETPLACE RELATIONS
// =================

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  coach: one(users, {
    fields: [marketplaceListings.coachId],
    references: [users.id],
  }),
  programListing: one(programListings, {
    fields: [marketplaceListings.id],
    references: [programListings.listingId],
  }),
  consultingListing: one(consultingListings, {
    fields: [marketplaceListings.id],
    references: [consultingListings.listingId],
  }),
  cartItems: many(marketplaceCartItems),
  orderItems: many(marketplaceOrderItems),
  reviews: many(marketplaceReviews),
}));

export const programListingsRelations = relations(programListings, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [programListings.listingId],
    references: [marketplaceListings.id],
  }),
  program: one(trainingPrograms, {
    fields: [programListings.programId],
    references: [trainingPrograms.id],
  }),
}));

export const consultingListingsRelations = relations(consultingListings, ({ one, many }) => ({
  listing: one(marketplaceListings, {
    fields: [consultingListings.listingId],
    references: [marketplaceListings.id],
  }),
  slots: many(consultingSlots),
}));

export const consultingSlotsRelations = relations(consultingSlots, ({ one }) => ({
  consultingListing: one(consultingListings, {
    fields: [consultingSlots.consultingListingId],
    references: [consultingListings.id],
  }),
}));

export const marketplaceCartItemsRelations = relations(marketplaceCartItems, ({ one }) => ({
  user: one(users, {
    fields: [marketplaceCartItems.userId],
    references: [users.id],
  }),
  listing: one(marketplaceListings, {
    fields: [marketplaceCartItems.listingId],
    references: [marketplaceListings.id],
  }),
}));

export const marketplaceOrdersRelations = relations(marketplaceOrders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [marketplaceOrders.buyerId],
    references: [users.id],
  }),
  items: many(marketplaceOrderItems),
}));

export const marketplaceOrderItemsRelations = relations(marketplaceOrderItems, ({ one }) => ({
  order: one(marketplaceOrders, {
    fields: [marketplaceOrderItems.orderId],
    references: [marketplaceOrders.id],
  }),
  listing: one(marketplaceListings, {
    fields: [marketplaceOrderItems.listingId],
    references: [marketplaceListings.id],
  }),
  seller: one(users, {
    fields: [marketplaceOrderItems.sellerId],
    references: [users.id],
  }),
}));

export const marketplaceReviewsRelations = relations(marketplaceReviews, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceReviews.listingId],
    references: [marketplaceListings.id],
  }),
  reviewer: one(users, {
    fields: [marketplaceReviews.reviewerId],
    references: [users.id],
  }),
  order: one(marketplaceOrders, {
    fields: [marketplaceReviews.orderId],
    references: [marketplaceOrders.id],
  }),
}));

// =================
// USER SUBSCRIPTION TABLES
// =================

// Table for subscription offers that users create
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // The user offering the subscription
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceAmount: integer("price_amount").notNull(), // In cents
  priceCurrency: text("price_currency").notNull().default("USD"), // USD or EUR
  priceFrequency: text("price_frequency").notNull(), // "session", "week", "month", "year"
  includedPrograms: integer("included_programs").array(), // Optional array of program IDs
  isActive: boolean("is_active").default(true),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table for actual subscription purchases between users
export const subscriptionPurchases = pgTable("subscription_purchases", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => users.id), // User who subscribed
  providerId: integer("provider_id").notNull().references(() => users.id), // User being subscribed to
  subscriptionId: integer("subscription_id").notNull().references(() => userSubscriptions.id), // The subscription offer
  status: text("status").default("active"), // active, cancelled, paused, expired
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for subscriptions
export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
    relationName: "subscription_offers"
  }),
  purchases: many(subscriptionPurchases),
}));

export const subscriptionPurchasesRelations = relations(subscriptionPurchases, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptionPurchases.subscriberId],
    references: [users.id],
    relationName: "subscriptions_purchased"
  }),
  provider: one(users, {
    fields: [subscriptionPurchases.providerId],
    references: [users.id],
    relationName: "subscriptions_received"
  }),
  subscription: one(userSubscriptions, {
    fields: [subscriptionPurchases.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

// =================
// MARKETPLACE SCHEMAS
// =================

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgramListingSchema = createInsertSchema(programListings).omit({
  id: true,
});

export const insertConsultingListingSchema = createInsertSchema(consultingListings).omit({
  id: true,
});

export const insertConsultingSlotSchema = createInsertSchema(consultingSlots).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceCartItemSchema = createInsertSchema(marketplaceCartItems).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceOrderSchema = createInsertSchema(marketplaceOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMarketplaceOrderItemSchema = createInsertSchema(marketplaceOrderItems).omit({
  id: true,
  fulfilledAt: true,
});

export const insertMarketplaceReviewSchema = createInsertSchema(marketplaceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// =================
// MARKETPLACE TYPES
// =================

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

export type ProgramListing = typeof programListings.$inferSelect;
export type InsertProgramListing = z.infer<typeof insertProgramListingSchema>;

export type ConsultingListing = typeof consultingListings.$inferSelect;
export type InsertConsultingListing = z.infer<typeof insertConsultingListingSchema>;

export type ConsultingSlot = typeof consultingSlots.$inferSelect;
export type InsertConsultingSlot = z.infer<typeof insertConsultingSlotSchema>;

export type MarketplaceCartItem = typeof marketplaceCartItems.$inferSelect;
export type InsertMarketplaceCartItem = z.infer<typeof insertMarketplaceCartItemSchema>;

export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = z.infer<typeof insertMarketplaceOrderSchema>;

export type MarketplaceOrderItem = typeof marketplaceOrderItems.$inferSelect;
export type InsertMarketplaceOrderItem = z.infer<typeof insertMarketplaceOrderItemSchema>;

export type MarketplaceReview = typeof marketplaceReviews.$inferSelect;
export type InsertMarketplaceReview = z.infer<typeof insertMarketplaceReviewSchema>;

// =================
// SUBSCRIPTION SCHEMAS
// =================

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeProductId: true,
  stripePriceId: true,
}).extend({
  priceAmount: z.number().min(0), // Allow free subscriptions
  priceCurrency: z.enum(["USD", "EUR"]),
  priceFrequency: z.enum(["session", "week", "month", "year"]),
});

export const insertSubscriptionPurchaseSchema = createInsertSchema(subscriptionPurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
});

// =================
// SUBSCRIPTION TYPES
// =================

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type SubscriptionPurchase = typeof subscriptionPurchases.$inferSelect;
export type InsertSubscriptionPurchase = z.infer<typeof insertSubscriptionPurchaseSchema>;
