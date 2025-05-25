import { Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { journalEntries, insertJournalEntrySchema, InsertJournalEntry } from "@shared/journal-schema";
import { eq } from "drizzle-orm";

// Get all journal entries for the current user with direct SQL for reliable content parsing
export async function getUserJournalEntries(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in to access journal entries" });
    }

    try {
      // Use a simpler approach with direct SQL query
      const result = await db.query.journalEntries.findMany({
        where: eq(journalEntries.userId, req.user.id),
        orderBy: (entries, { desc }) => [desc(entries.createdAt)],
      });
      
      console.log("Retrieved journal entries:", result.length);
      
      // Format response and ensure content is properly parsed
      const formattedEntries = result.map(entry => {
        // Parse content if it's a string
        if (entry.content && typeof entry.content === 'string') {
          try {
            entry.content = JSON.parse(entry.content);
          } catch (e) {
            console.error(`Failed to parse content for entry ${entry.id}:`, e);
            // Keep content as is if parsing fails
          }
        }
        return entry;
      });
      
      return res.status(200).json(formattedEntries);
    } catch (dbError) {
      console.error("Database error fetching journal entries:", dbError);
      
      // Fallback to raw SQL as a last resort
      try {
        const rawEntries = await db.execute(
          `SELECT * FROM journal_entries WHERE user_id = ${req.user.id} ORDER BY created_at DESC`
        );
        
        console.log("Retrieved journal entries using raw SQL:", rawEntries.length || 'unknown');
        
        return res.status(200).json(rawEntries);
      } catch (rawError) {
        console.error("Raw SQL error fetching journal entries:", rawError);
        return res.status(500).json({ message: "Failed to fetch journal entries after multiple attempts" });
      }
    }

  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return res.status(500).json({ message: "Failed to fetch journal entries" });
  }
}

// Create a new journal entry
export async function createJournalEntry(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in to create journal entries" });
    }

    const validation = insertJournalEntrySchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });

    if (!validation.success) {
      return res.status(400).json({ message: "Invalid journal entry data", errors: validation.error.format() });
    }

    const journalData: InsertJournalEntry = validation.data;

    const [newEntry] = await db.insert(journalEntries).values(journalData).returning();

    return res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return res.status(500).json({ message: "Failed to create journal entry" });
  }
}

// Update an existing journal entry
export async function updateJournalEntry(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in to update journal entries" });
    }

    const entryId = parseInt(req.params.id);
    
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }

    // Check if the entry exists and belongs to the user
    const existingEntry = await db.query.journalEntries.findFirst({
      where: (entries, { and, eq }) => 
        and(eq(entries.id, entryId), eq(entries.userId, req.user!.id)),
    });

    if (!existingEntry) {
      return res.status(404).json({ message: "Journal entry not found or you don't have permission to edit it" });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [updatedEntry] = await db
      .update(journalEntries)
      .set(updateData)
      .where(eq(journalEntries.id, entryId))
      .returning();

    return res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return res.status(500).json({ message: "Failed to update journal entry" });
  }
}

// Delete a journal entry
export async function deleteJournalEntry(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in to delete journal entries" });
    }

    const entryId = parseInt(req.params.id);
    
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }

    // Check if the entry exists and belongs to the user
    const existingEntry = await db.query.journalEntries.findFirst({
      where: (entries, { and, eq }) => 
        and(eq(entries.id, entryId), eq(entries.userId, req.user!.id)),
    });

    if (!existingEntry) {
      return res.status(404).json({ message: "Journal entry not found or you don't have permission to delete it" });
    }

    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, entryId));

    return res.status(200).json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return res.status(500).json({ message: "Failed to delete journal entry" });
  }
}