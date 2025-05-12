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
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  meetsAsAthlete: many(meets),
  meetsAsCoach: many(meets, { relationName: "coach_meets" }),
  athleteGroups: many(athleteGroups),
  groupMemberships: many(groupMembers, { relationName: "athlete_memberships" }),
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
  members: many(groupMembers),
  meets: many(meets),
}));

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => athleteGroups.id),
  athleteId: integer("athlete_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(athleteGroups, {
    fields: [groupMembers.groupId],
    references: [athleteGroups.id],
  }),
  athlete: one(users, {
    fields: [groupMembers.athleteId],
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

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  createdAt: true,
});

export const insertCoachNoteSchema = createInsertSchema(coachNotes).omit({
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

export type User = typeof users.$inferSelect;
export type Meet = typeof meets.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Coach = typeof coaches.$inferSelect;
export type AthleteGroup = typeof athleteGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type CoachNote = typeof coachNotes.$inferSelect;

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
