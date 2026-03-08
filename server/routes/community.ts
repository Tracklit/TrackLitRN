import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { communityActivities, users } from "@shared/schema";
import { eq, desc, and, ne } from "drizzle-orm";

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

const FIELDS = {
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
};

function mapRow(row: any) {
  return {
    id: row.id,
    userId: row.userId,
    activityType: row.activityType,
    title: row.title,
    description: row.description ?? undefined,
    relatedEntityId: row.relatedEntityId ?? undefined,
    relatedEntityType: row.relatedEntityType ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    user: {
      id: row.userId,
      username: row.username,
      name: row.name,
      profileImageUrl: row.profileImageUrl ?? undefined,
    },
  };
}

// GET /api/community/activities?offset=0&limit=25
// offset=0: user's own most-recent activity is pinned at position 0
// offset>0: plain paginated continuation
router.get("/activities", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const currentUserId = (req.user as any).id as number;
  const offset = Math.max(0, parseInt((req.query.offset as string) ?? '0') || 0);
  const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '25') || 25), 50);

  try {
    let pinned: any = null;

    if (offset === 0) {
      // Fetch the current user's most recent visible activity to pin first
      const [pinnedRow] = await db
        .select(FIELDS)
        .from(communityActivities)
        .innerJoin(users, eq(communityActivities.userId, users.id))
        .where(and(
          eq(communityActivities.isVisible, true),
          eq(communityActivities.userId, currentUserId)
        ))
        .orderBy(desc(communityActivities.createdAt))
        .limit(1);

      pinned = pinnedRow ?? null;
    }

    // For offset=0: fetch (limit-1) others, excluding the pinned row's ID
    // For offset>0: fetch `limit` items starting from DB offset (offset-1 to account for pin)
    const dbOffset = offset === 0 ? 0 : offset - 1;
    const dbLimit  = offset === 0 ? (pinned ? limit - 1 : limit) : limit;

    const whereClause = pinned
      ? and(eq(communityActivities.isVisible, true), ne(communityActivities.id, pinned.id))
      : eq(communityActivities.isVisible, true);

    const rows = await db
      .select(FIELDS)
      .from(communityActivities)
      .innerJoin(users, eq(communityActivities.userId, users.id))
      .where(whereClause)
      .orderBy(desc(communityActivities.createdAt))
      .offset(dbOffset)
      .limit(dbLimit);

    const activities = [
      ...(pinned ? [mapRow(pinned)] : []),
      ...rows.map(mapRow),
    ];

    if (activities.length === 0) {
      return res.json(offset === 0 ? STATIC_FALLBACK : []);
    }

    res.json(activities);
  } catch (error) {
    console.error("Error fetching community activities:", error);
    res.json(offset === 0 ? STATIC_FALLBACK : []);
  }
});

// POST /api/community/activities
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
        userId: (req.user as any).id,
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
