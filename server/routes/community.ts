import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { communityActivities, users } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

const STATIC_FALLBACK = [
  {
    id: 1,
    userId: 1,
    activityType: 'workout',
    title: 'Sprint Training Complete',
    description: 'Finished 6x100m sprint session with excellent form',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: undefined }
  },
  {
    id: 2,
    userId: 2,
    activityType: 'user_joined',
    title: 'New Athlete Joined',
    description: 'Welcome Sarah M. to the TrackLit community!',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: { id: 2, username: 'sarah_m_runner', name: 'Sarah M.', profileImageUrl: undefined }
  },
  {
    id: 3,
    userId: 3,
    activityType: 'meet_created',
    title: 'Spring Championship Meet',
    description: 'New track meet scheduled for April 15th at Metro Stadium',
    relatedEntityId: 1,
    relatedEntityType: 'meet',
    metadata: {
      meetData: {
        name: 'Spring Championship Meet',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Metro Stadium',
        events: ['100m', '200m', '400m', 'Long Jump'],
      }
    },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    user: { id: 3, username: 'coach_jones', name: 'Coach Jones', profileImageUrl: undefined }
  },
  {
    id: 4,
    userId: 1,
    activityType: 'journal_entry',
    title: 'Training Journal Entry',
    description: 'Completed Beast Mode Day 15 — felt strong during 6x100m intervals',
    relatedEntityId: 15,
    relatedEntityType: 'journal_entry',
    metadata: { workoutData: { moodRating: 8 } },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: undefined }
  },
  {
    id: 5,
    userId: 1,
    activityType: 'meet_results',
    title: 'Personal Best Achievement!',
    description: 'New 200m PB of 22.85s at Regional Qualifier meet',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: undefined }
  },
];

// Get community activities for ticker carousel — newest first (index 0 = leftmost card)
router.get("/activities", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const rows = await db
      .select({
        id: communityActivities.id,
        userId: communityActivities.userId,
        activityType: communityActivities.activityType,
        title: communityActivities.title,
        description: communityActivities.description,
        relatedEntityId: communityActivities.relatedEntityId,
        relatedEntityType: communityActivities.relatedEntityType,
        metadata: communityActivities.metadata,
        createdAt: communityActivities.createdAt,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(communityActivities)
      .innerJoin(users, eq(communityActivities.userId, users.id))
      .where(eq(communityActivities.isVisible, true))
      .orderBy(desc(communityActivities.createdAt))
      .limit(50);

    if (rows.length === 0) {
      return res.json(STATIC_FALLBACK);
    }

    const activities = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      activityType: row.activityType,
      title: row.title,
      description: row.description,
      relatedEntityId: row.relatedEntityId,
      relatedEntityType: row.relatedEntityType,
      metadata: row.metadata,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      user: {
        id: row.userId,
        username: row.username,
        name: row.name,
        profileImageUrl: row.profileImageUrl ?? undefined,
      },
    }));

    res.json(activities);
  } catch (error) {
    console.error("Error fetching community activities:", error);
    res.json(STATIC_FALLBACK);
  }
});

// Create a new community activity
router.post("/activities", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { activityType, title, description, relatedEntityId, relatedEntityType, metadata } = req.body;

    if (!activityType || !title) {
      return res.status(400).json({ error: "activityType and title are required" });
    }

    const [newActivity] = await db
      .insert(communityActivities)
      .values({
        userId: req.user!.id,
        activityType,
        title,
        description,
        relatedEntityId,
        relatedEntityType,
        metadata,
        isVisible: true,
      })
      .returning();

    res.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error("Error creating community activity:", error);
    res.status(500).json({ error: "Failed to create community activity" });
  }
});

export default router;
