import { Request, Response } from "express";
import { db } from "../db";
import { users, coachAthletes } from "@shared/schema";
import { journalEntries, journalComments, moodEntries, insertJournalCommentSchema, insertMoodEntrySchema } from "@shared/journal-schema";
import { eq, and, gte, desc, sql, avg } from "drizzle-orm";

// Get all athletes for a coach
export async function getCoachAthletes(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const athletes = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        relationshipId: coachAthletes.id,
        acceptedAt: coachAthletes.acceptedAt,
      })
      .from(coachAthletes)
      .innerJoin(users, eq(coachAthletes.athleteId, users.id))
      .where(
        and(
          eq(coachAthletes.coachId, req.user.id),
          eq(coachAthletes.status, 'accepted')
        )
      )
      .orderBy(users.name);

    return res.json(athletes);
  } catch (error) {
    console.error("Error fetching coach athletes:", error);
    return res.status(500).json({ message: "Failed to fetch athletes" });
  }
}

// Get mood statistics for coach's athletes
export async function getAthleteMoodStats(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const { timeRange = '7' } = req.query; // days
    const days = parseInt(timeRange as string);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Get mood data for each athlete
    const athleteMoods = await db
      .select({
        athleteId: users.id,
        athleteName: users.name,
        athleteUsername: users.username,
        avgMood: avg(moodEntries.moodRating),
        entryCount: sql<number>`COUNT(${moodEntries.id})`,
      })
      .from(coachAthletes)
      .innerJoin(users, eq(coachAthletes.athleteId, users.id))
      .leftJoin(moodEntries, and(
        eq(moodEntries.userId, users.id),
        gte(moodEntries.date, cutoffDateStr)
      ))
      .where(
        and(
          eq(coachAthletes.coachId, req.user.id),
          eq(coachAthletes.status, 'accepted')
        )
      )
      .groupBy(users.id, users.name, users.username);

    // Calculate overall average
    const overallAvg = await db
      .select({
        avgMood: avg(moodEntries.moodRating),
        entryCount: sql<number>`COUNT(${moodEntries.id})`,
      })
      .from(coachAthletes)
      .innerJoin(moodEntries, and(
        eq(moodEntries.userId, coachAthletes.athleteId),
        gte(moodEntries.date, cutoffDateStr)
      ))
      .where(
        and(
          eq(coachAthletes.coachId, req.user.id),
          eq(coachAthletes.status, 'accepted')
        )
      );

    return res.json({
      athletes: athleteMoods,
      overall: overallAvg[0] || { avgMood: null, entryCount: 0 },
      timeRange: days,
    });
  } catch (error) {
    console.error("Error fetching mood stats:", error);
    return res.status(500).json({ message: "Failed to fetch mood statistics" });
  }
}

// Get recent diary entries from coach's athletes
export async function getAthleteJournalEntries(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const { limit = '20' } = req.query;

    const entries = await db
      .select({
        id: journalEntries.id,
        title: journalEntries.title,
        notes: journalEntries.notes,
        content: journalEntries.content,
        isPublic: journalEntries.isPublic,
        createdAt: journalEntries.createdAt,
        athleteId: users.id,
        athleteName: users.name,
        athleteUsername: users.username,
        athleteProfileImageUrl: users.profileImageUrl,
      })
      .from(coachAthletes)
      .innerJoin(users, eq(coachAthletes.athleteId, users.id))
      .innerJoin(journalEntries, eq(journalEntries.userId, users.id))
      .where(
        and(
          eq(coachAthletes.coachId, req.user.id),
          eq(coachAthletes.status, 'accepted')
        )
      )
      .orderBy(desc(journalEntries.createdAt))
      .limit(parseInt(limit as string));

    return res.json(entries);
  } catch (error) {
    console.error("Error fetching athlete journal entries:", error);
    return res.status(500).json({ message: "Failed to fetch journal entries" });
  }
}

// Get comments for a journal entry (including private coach comments)
export async function getJournalComments(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const journalId = parseInt(req.params.journalId);
    if (isNaN(journalId)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }

    // Check if user is coach of the journal's author or the author themselves
    const journalEntry = await db.query.journalEntries.findFirst({
      where: eq(journalEntries.id, journalId),
      with: {
        user: true,
      },
    });

    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    const isAuthor = journalEntry.userId === req.user.id;
    const isCoach = await db.query.coachAthletes.findFirst({
      where: and(
        eq(coachAthletes.coachId, req.user.id),
        eq(coachAthletes.athleteId, journalEntry.userId),
        eq(coachAthletes.status, 'accepted')
      ),
    });

    if (!isAuthor && !isCoach && !journalEntry.isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get comments (filter private comments based on access)
    const comments = await db
      .select({
        id: journalComments.id,
        content: journalComments.content,
        isPrivate: journalComments.isPrivate,
        parentCommentId: journalComments.parentCommentId,
        createdAt: journalComments.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorUsername: users.username,
        authorProfileImageUrl: users.profileImageUrl,
        authorIsCoach: users.isCoach,
      })
      .from(journalComments)
      .innerJoin(users, eq(journalComments.authorId, users.id))
      .where(
        and(
          eq(journalComments.journalId, journalId),
          // Show private comments only if user is coach or author
          isAuthor || isCoach
            ? undefined
            : eq(journalComments.isPrivate, false)
        )
      )
      .orderBy(journalComments.createdAt);

    return res.json(comments);
  } catch (error) {
    console.error("Error fetching journal comments:", error);
    return res.status(500).json({ message: "Failed to fetch comments" });
  }
}

// Add a comment to a journal entry
export async function addJournalComment(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const journalId = parseInt(req.params.journalId);
    if (isNaN(journalId)) {
      return res.status(400).json({ message: "Invalid journal ID" });
    }

    const validation = insertJournalCommentSchema.safeParse({
      ...req.body,
      journalId,
      authorId: req.user.id,
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid comment data", 
        errors: validation.error.format() 
      });
    }

    // Check if user has access to comment on this journal
    const journalEntry = await db.query.journalEntries.findFirst({
      where: eq(journalEntries.id, journalId),
    });

    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    const isAuthor = journalEntry.userId === req.user.id;
    const isCoach = await db.query.coachAthletes.findFirst({
      where: and(
        eq(coachAthletes.coachId, req.user.id),
        eq(coachAthletes.athleteId, journalEntry.userId),
        eq(coachAthletes.status, 'accepted')
      ),
    });

    // For private comments, only coaches can create them (to athletes)
    if (validation.data.isPrivate && !isCoach) {
      return res.status(403).json({ message: "Only coaches can create private comments" });
    }

    if (!isAuthor && !isCoach && !journalEntry.isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [newComment] = await db
      .insert(journalComments)
      .values(validation.data)
      .returning();

    // Get the comment with author info
    const commentWithAuthor = await db
      .select({
        id: journalComments.id,
        content: journalComments.content,
        isPrivate: journalComments.isPrivate,
        parentCommentId: journalComments.parentCommentId,
        createdAt: journalComments.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorUsername: users.username,
        authorProfileImageUrl: users.profileImageUrl,
        authorIsCoach: users.isCoach,
      })
      .from(journalComments)
      .innerJoin(users, eq(journalComments.authorId, users.id))
      .where(eq(journalComments.id, newComment.id));

    return res.status(201).json(commentWithAuthor[0]);
  } catch (error) {
    console.error("Error adding journal comment:", error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
}

// Record mood entry for an athlete (can be created by coach or athlete)
export async function recordMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    const validation = insertMoodEntrySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid mood data", 
        errors: validation.error.format() 
      });
    }

    // If recording for another user, verify coach relationship
    if (validation.data.userId !== req.user.id) {
      const isCoach = await db.query.coachAthletes.findFirst({
        where: and(
          eq(coachAthletes.coachId, req.user.id),
          eq(coachAthletes.athleteId, validation.data.userId),
          eq(coachAthletes.status, 'accepted')
        ),
      });

      if (!isCoach) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const [newMoodEntry] = await db
      .insert(moodEntries)
      .values(validation.data)
      .returning();

    return res.status(201).json(newMoodEntry);
  } catch (error) {
    console.error("Error recording mood entry:", error);
    return res.status(500).json({ message: "Failed to record mood entry" });
  }
}