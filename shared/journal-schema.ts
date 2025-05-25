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

// Define type for insertable journal entry
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// Type for selected journal entry
export type JournalEntry = typeof journalEntries.$inferSelect;