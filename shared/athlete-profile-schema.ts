import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Define the athlete profile table
export const athleteProfiles = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  
  // Event selections (boolean flags for each event)
  sprint60m100m: boolean("sprint_60m_100m").default(false),
  sprint200m: boolean("sprint_200m").default(false),
  sprint400m: boolean("sprint_400m").default(false),
  hurdles100m110m: boolean("hurdles_100m_110m").default(false),
  hurdles400m: boolean("hurdles_400m").default(false),
  otherEvent: boolean("other_event").default(false),
  otherEventName: text("other_event_name"),
  
  // Goal times for each event (in seconds)
  sprint60m100mGoal: real("sprint_60m_100m_goal"),
  sprint200mGoal: real("sprint_200m_goal"),
  sprint400mGoal: real("sprint_400m_goal"),
  hurdles100m110mGoal: real("hurdles_100m_110m_goal"),
  hurdles400mGoal: real("hurdles_400m_goal"),
  otherEventGoal: real("other_event_goal"),
  
  // Timing preference for display
  timingPreference: text("timing_preference", { enum: ['on_movement', 'first_foot'] }).default('on_movement'),
  
  // When the profile was last updated
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const athleteProfilesRelations = relations(athleteProfiles, ({ one }) => ({
  user: one(users, {
    fields: [athleteProfiles.userId],
    references: [users.id],
  }),
}));

// Create Zod schema for inserting athlete profiles
export const insertAthleteProfileSchema = createInsertSchema(athleteProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Define types based on the schema
export type InsertAthleteProfile = z.infer<typeof insertAthleteProfileSchema>;
export type AthleteProfile = typeof athleteProfiles.$inferSelect;