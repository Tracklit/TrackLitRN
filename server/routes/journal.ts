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

    // Clean and prepare update data
    let updateData = { ...req.body };
    
    // Remove problematic timestamp fields that will be handled by the database
    delete updateData.createdAt;
    
    // Explicitly set updatedAt to a new Date
    updateData.updatedAt = new Date();
    
    // Handle the content field specially - ensure it's properly stringified if it's an object
    if (updateData.content && typeof updateData.content === 'object') {
      // If content has a date field, ensure it's a string
      if (updateData.content.date) {
        try {
          // Attempt to convert any date-like object to ISO string
          if (typeof updateData.content.date === 'object') {
            if (updateData.content.date instanceof Date) {
              updateData.content.date = updateData.content.date.toISOString();
            } else {
              updateData.content.date = new Date().toISOString();
            }
          }
          // If it's already a string, leave it alone
        } catch (err) {
          console.error("Error processing date in content:", err);
          updateData.content.date = new Date().toISOString();
        }
      }
      
      // Convert the entire content object to a string for storage
      updateData.content = JSON.stringify(updateData.content);
    }
    
    console.log("Updating journal entry with data:", updateData);
    
    try {
      const [updatedEntry] = await db
        .update(journalEntries)
        .set(updateData)
        .where(eq(journalEntries.id, entryId))
        .returning();
        
      return res.status(200).json(updatedEntry);
    } catch (dbError) {
      console.error("Error updating journal entry:", dbError);
      
      // Fallback to raw SQL as a last resort for critical fields
      try {
        const { title, notes, type, isPublic, content } = updateData;
        
        // Only update the most critical fields with proper escaping
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const result = await db.execute(
          `UPDATE journal_entries 
           SET title = '${title?.replace(/'/g, "''")}', 
               notes = '${notes?.replace(/'/g, "''")}', 
               type = '${type?.replace(/'/g, "''")}',
               is_public = ${isPublic === true ? 'true' : 'false'},
               content = '${contentStr?.replace(/'/g, "''")}',
               updated_at = NOW()
           WHERE id = ${entryId} AND user_id = ${req.user!.id}
           RETURNING *`
        );
        
        return res.status(200).json(result[0]);
      } catch (rawError) {
        console.error("Raw SQL error updating journal entry:", rawError);
        return res.status(500).json({ message: "Failed to update journal entry" });
      }
    }
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