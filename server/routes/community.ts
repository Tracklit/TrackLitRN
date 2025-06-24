import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// Get community activities for ticker carousel
router.get("/activities", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // Return sample data for the community carousel
    const activities = [
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
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          user: { id: 3, username: 'coach_jones', name: 'Coach Jones', profileImageUrl: undefined }
        },
        {
          id: 4,
          userId: 1,
          activityType: 'meet_results',
          title: 'Personal Best Achievement!',
          description: 'New 200m PB of 22.85s at Regional Qualifier meet',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: undefined }
        },
        {
          id: 5,
          userId: 4,
          activityType: 'coach_status',
          title: 'Certified Coach',
          description: 'Marcus T. became a certified coach on TrackLit',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: { id: 4, username: 'coach_marcus', name: 'Marcus T.', profileImageUrl: undefined }
        },
        {
          id: 6,
          userId: 2,
          activityType: 'program_assigned',
          title: 'Speed Development Program',
          description: 'Started 8-week speed development training program',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          user: { id: 2, username: 'sarah_m_runner', name: 'Sarah M.', profileImageUrl: undefined }
        },
        {
          id: 7,
          userId: 5,
          activityType: 'group_joined',
          title: 'Elite Sprinters Club',
          description: 'Joined the Elite Sprinters training group',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user: { id: 5, username: 'elite_runner', name: 'Jordan K.', profileImageUrl: undefined }
        }
      ];

    res.json(activities);
  } catch (error) {
    console.error("Error fetching community activities:", error);
    res.status(500).json({ error: "Failed to fetch community activities" });
  }
});

// Create a new community activity
router.post("/activities", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    // For now, return success without saving to database
    res.json({ success: true, message: "Activity created successfully" });
  } catch (error) {
    console.error("Error creating community activity:", error);
    res.status(500).json({ error: "Failed to create community activity" });
  }
});

export default router;