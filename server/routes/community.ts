import { Router } from "express";
import { dbStorage } from "../storage";
import type { Request, Response } from "express";

const router = Router();

// Get community activities for ticker carousel
router.get("/activities", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await db.getCommunityActivities(limit);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching community activities:", error);
    res.status(500).json({ error: "Failed to fetch community activities" });
  }
});

// Create a new community activity
router.post("/activities", requireAuth, async (req: Request, res: Response) => {
  try {
    const { activityType, title, description, relatedEntityId, relatedEntityType, metadata } = req.body;
    
    const activity = await db.createCommunityActivity({
      userId: req.user!.id,
      activityType,
      title,
      description,
      relatedEntityId,
      relatedEntityType,
      metadata,
      isVisible: true
    });
    
    res.json(activity);
  } catch (error) {
    console.error("Error creating community activity:", error);
    res.status(500).json({ error: "Failed to create community activity" });
  }
});

export default router;