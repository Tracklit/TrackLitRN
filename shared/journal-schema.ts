import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  notes: text("notes"),
  type: text("type").default("manual"), // manual, training, etc.
  content: json("content"), // Flexible JSON content including mood ratings and workout details
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Set up relations
export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

// Create Zod schema for insert operations
export const insertJournalEntrySchema = createInsertSchema(journalEntries, {
  content: z.any(), // Allow any JSON structure for content
});

// Journal Entry Comments (private coaching comments)
export const journalComments = pgTable("journal_comments", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id").notNull().references(() => journalEntries.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false), // true for coach-athlete private comments
  parentCommentId: integer("parent_comment_id").references(() => journalComments.id), // for replies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mood Tracking (aggregated from journal entries)
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moodRating: integer("mood_rating").notNull(), // 1-10 scale
  date: text("date").notNull(), // Daily mood entry (YYYY-MM-DD format)
  journalId: integer("journal_id").references(() => journalEntries.id), // Optional link to journal entry
  notes: text("notes"), // Optional notes about mood
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const journalCommentsRelations = relations(journalComments, ({ one, many }) => ({
  journal: one(journalEntries, {
    fields: [journalComments.journalId],
    references: [journalEntries.id],
  }),
  author: one(users, {
    fields: [journalComments.authorId],
    references: [users.id],
  }),
  parentComment: one(journalComments, {
    fields: [journalComments.parentCommentId],
    references: [journalComments.id],
    relationName: "parent_child_comments",
  }),
  replies: many(journalComments, { relationName: "parent_child_comments" }),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
  journal: one(journalEntries, {
    fields: [moodEntries.journalId],
    references: [journalEntries.id],
  }),
}));

// Create Zod schemas for insert operations
export const insertJournalCommentSchema = createInsertSchema(journalComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

// Define type for insertable journal entry
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertJournalComment = z.infer<typeof insertJournalCommentSchema>;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

// Type for selected journal entry
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalComment = typeof journalComments.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;