import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  events: text("events").array(),
  isPremium: boolean("is_premium").default(false),
  role: text("role").default("athlete"), // athlete, coach, or both
  bio: text("bio"),
  spikes: integer("spikes").default(0), // In-app currency/tokens
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  meetsAsAthlete: many(meets),
  meetsAsCoach: many(meets, { relationName: "coach_meets" }),
  athleteGroups: many(athleteGroups),
  athleteGroupMemberships: many(athleteGroupMembers, { relationName: "athlete_memberships" }),
  chatGroupMemberships: many(chatGroupMembers, { relationName: "user_groups" }),
  coachRelations: many(coaches, { relationName: "coach_side" }),
  athleteRelations: many(coaches, { relationName: "athlete_side" }),
  coachNotesAuthored: many(coachNotes, { relationName: "notes_authored" }),
  coachNotesReceived: many(coachNotes, { relationName: "notes_received" }),
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
  isPaid: boolean("is_paid").default(false),
  price: integer("price"), // in currency or spikes
  joinCode: text("join_code").notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
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
  status: text("status", { enum: ['pending', 'accepted', 'rejected'] }).default('pending'),
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
  ownerId: integer("owner_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  isPaid: boolean("is_paid").default(false),
  price: integer("price"), // in currency or spikes
  joinCode: text("join_code").notNull().unique(),
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
  createdAt: true,
  joinCode: true, // Generated on the server
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
export type ClubMember = typeof clubMembers.$inferSelect;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
