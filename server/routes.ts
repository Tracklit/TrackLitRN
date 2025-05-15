import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertMeetSchema, 
  insertResultSchema, 
  insertReminderSchema, 
  insertCoachSchema,
  insertAthleteGroupSchema,
  insertGroupMemberSchema,
  insertCoachNoteSchema,
  insertPracticeMediaSchema,
  insertGroupSchema,
  insertUserAchievementSchema,
  insertReferralSchema,
  insertTrainingProgramSchema,
  insertProgramSessionSchema,
  insertProgramPurchaseSchema,
  insertProgramProgressSchema,
  insertWorkoutLibrarySchema,
  InsertMeet,
  InsertResult,
  InsertReminder,
  InsertCoach,
  InsertAthleteGroup,
  InsertGroupMember,
  InsertCoachNote,
  InsertPracticeMedia,
  PracticeMedia,
  InsertTrainingProgram,
  InsertProgramSession,
  InsertProgramPurchase,
  InsertProgramProgress,
  InsertWorkoutLibrary
} from "@shared/schema";

// Initialize default achievements
async function initializeDefaultAchievements() {
  try {
    // Check if we already have achievements
    const existingAchievements = await dbStorage.getAchievements();
    if (existingAchievements.length > 0) {
      return; // Already initialized
    }

    // Define our default achievements
    const defaultAchievements = [
      // Login achievements
      {
        name: "First Login",
        description: "Log in to the app for the first time",
        category: "login",
        iconUrl: "/icons/achievements/first-login.svg",
        spikeReward: 5,
        isOneTime: true,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Week Streak",
        description: "Maintain a 7-day login streak",
        category: "login",
        iconUrl: "/icons/achievements/week-streak.svg",
        spikeReward: 25,
        isOneTime: false,
        requirementValue: 7,
        requirementType: "streak",
        isHidden: false
      },
      {
        name: "Month Streak",
        description: "Maintain a 30-day login streak",
        category: "login",
        iconUrl: "/icons/achievements/month-streak.svg",
        spikeReward: 100,
        isOneTime: false,
        requirementValue: 30,
        requirementType: "streak",
        isHidden: false
      },
      
      // Workout achievements
      {
        name: "First Workout",
        description: "Complete your first workout",
        category: "workout",
        iconUrl: "/icons/achievements/first-workout.svg",
        spikeReward: 20,
        isOneTime: true,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Workout Warrior",
        description: "Complete 10 workouts",
        category: "workout",
        iconUrl: "/icons/achievements/workout-warrior.svg",
        spikeReward: 50,
        isOneTime: true,
        requirementValue: 10,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Training Master",
        description: "Complete 100 workouts",
        category: "workout",
        iconUrl: "/icons/achievements/training-master.svg",
        spikeReward: 500,
        isOneTime: true,
        requirementValue: 100,
        requirementType: "count",
        isHidden: false
      },
      
      // Meet achievements
      {
        name: "Competition Planner",
        description: "Create your first competition",
        category: "meet",
        iconUrl: "/icons/achievements/competition-planner.svg",
        spikeReward: 30,
        isOneTime: true,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Meet Manager",
        description: "Create 5 competitions",
        category: "meet",
        iconUrl: "/icons/achievements/meet-manager.svg",
        spikeReward: 100,
        isOneTime: true,
        requirementValue: 5,
        requirementType: "count",
        isHidden: false
      },
      
      // Group achievements
      {
        name: "Team Builder",
        description: "Create your first group",
        category: "group",
        iconUrl: "/icons/achievements/team-builder.svg",
        spikeReward: 25,
        isOneTime: true,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Club Leader",
        description: "Create a club",
        category: "club",
        iconUrl: "/icons/achievements/club-leader.svg",
        spikeReward: 50,
        isOneTime: true,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      },
      
      // Social achievements
      {
        name: "Social Butterfly",
        description: "Send 10 messages in groups",
        category: "social",
        iconUrl: "/icons/achievements/social-butterfly.svg",
        spikeReward: 20,
        isOneTime: true,
        requirementValue: 10,
        requirementType: "count",
        isHidden: false
      },
      {
        name: "Recruiter",
        description: "Successfully refer a friend to join the app",
        category: "social",
        iconUrl: "/icons/achievements/recruiter.svg",
        spikeReward: 100,
        isOneTime: false,
        requirementValue: 1,
        requirementType: "count",
        isHidden: false
      }
    ];
    
    // Insert each achievement
    for (const achievement of defaultAchievements) {
      await dbStorage.createAchievement(achievement);
    }
    
    console.log(`Initialized ${defaultAchievements.length} default achievements`);
  } catch (error) {
    console.error("Error initializing default achievements:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Initialize default achievements
  await initializeDefaultAchievements();

  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Storage configuration for multer
  const uploadStorage = multer.diskStorage({
    destination: (req, _file, cb) => {
      // Use different subdirectories for program files and practice media
      if (req.path === '/api/programs/upload') {
        const programsUploadsDir = path.join(uploadsDir, 'programs');
        if (!fs.existsSync(programsUploadsDir)) {
          fs.mkdirSync(programsUploadsDir, { recursive: true });
        }
        cb(null, programsUploadsDir);
      } else {
        const practiceUploadsDir = path.join(uploadsDir, 'practice');
        if (!fs.existsSync(practiceUploadsDir)) {
          fs.mkdirSync(practiceUploadsDir, { recursive: true });
        }
        cb(null, practiceUploadsDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      
      if (req.path === '/api/programs/upload') {
        cb(null, 'program-' + uniqueSuffix + ext);
      } else {
        cb(null, 'practice-' + uniqueSuffix + ext);
      }
    },
  });
  
  const upload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit
    },
    fileFilter: (req, file, cb) => {
      // For program files, accept PDF, Word, and Excel documents
      if (req.path === '/api/programs/upload') {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, Word, and Excel documents are allowed for programs'));
        }
      } 
      // For practice media, accept only images and videos
      else {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only images and videos are allowed for practice media'));
        }
      }
    }
  });
  
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(uploadsDir));
  
  // Practice media routes
  // Get media for a completion
  app.get('/api/practice/media', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in' });
      }
      
      const { completionId } = req.query;
      
      if (!completionId) {
        return res.status(400).json({ message: 'Completion ID is required' });
      }
      
      const media = await dbStorage.getPracticeMediaByCompletionId(parseInt(completionId as string));
      
      res.status(200).json(media);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch media' });
    }
  });
  
  // Delete media
  app.delete('/api/practice/media/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in' });
      }
      
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'Media ID is required' });
      }
      
      // Get the media first to find the file path
      const media = await dbStorage.getPracticeMedia(parseInt(id));
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      // Delete the file from filesystem
      const filePath = path.join(process.cwd(), media.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete the media record from database
      const deleted = await dbStorage.deletePracticeMedia(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ message: 'Media not found or already deleted' });
      }
      
      res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting media:', error);
      res.status(500).json({ message: error.message || 'Failed to delete media' });
    }
  });
  
  // Upload media
  app.post('/api/practice/media', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { completionId } = req.body;
      
      if (!completionId) {
        return res.status(400).json({ message: 'Completion ID is required' });
      }
      
      // Determine file type
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      // Create file path URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Create thumbnail if it's a video (for now we'll just use the same URL)
      const thumbnail = fileType === 'video' ? fileUrl : undefined;
      
      // Create media record in database
      const mediaData: InsertPracticeMedia = {
        completionId: parseInt(completionId as string),
        type: fileType,
        url: fileUrl,
        thumbnail,
      };
      
      const media = await dbStorage.createPracticeMedia(mediaData);
      
      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: error.message || 'Failed to upload media' });
    }
  });

  // API Routes - prefix all routes with /api
  
  // Spikes and achievements endpoints
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const achievements = await dbStorage.getAchievements();
      
      // Get user achievements to determine completion status
      const userAchievements = await dbStorage.getUserAchievementsByUserId(req.user!.id);
      
      // Map user achievements to their respective achievement details
      const achievementsWithStatus = achievements.map((achievement) => {
        const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);
        return {
          ...achievement,
          progress: userAchievement?.progress || 0,
          isCompleted: userAchievement?.isCompleted || false,
          timesEarned: userAchievement?.timesEarned || 0,
          completionDate: userAchievement?.completionDate || null,
          lastEarnedAt: userAchievement?.lastEarnedAt || null
        };
      });
      
      res.json(achievementsWithStatus);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  
  // Endpoint for workout session previews
  app.get("/api/workout-previews", (_req: Request, res: Response) => {
    // Mock data for workout previews demo
    const workoutPreviews = [
      {
        id: 1,
        workoutId: 1,
        userId: 2,
        title: "Speed Intervals",
        previewText: "Completed a great sprint session with 6x200m at 30s each!",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: { username: "sarah_runner", name: "Sarah T." }
      },
      {
        id: 2,
        workoutId: 2,
        userId: 3,
        title: "Long Run Day",
        previewText: "10km easy run completed in 45mins. Feeling great!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user: { username: "track_star", name: "Michael J." }
      },
      {
        id: 3,
        workoutId: 3,
        userId: 4,
        title: "Tempo Run",
        previewText: "5x400m ladder workout complete. New personal best!",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        user: { username: "coach_k", name: "Coach Kevin" }
      },
      {
        id: 4,
        workoutId: 4,
        userId: 5,
        title: "Hill Sprints",
        previewText: "Just finished 10x hill sprints. My legs are on fire but worth it!",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        user: { username: "sprint_queen", name: "Lisa M." }
      },
      {
        id: 5,
        workoutId: 5,
        userId: 6,
        title: "Morning Endurance",
        previewText: "Early morning 800m repeats - 6 sets at 2:15 pace. New week, new goals!",
        createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        user: { username: "distance_king", name: "Alex P." }
      },
      {
        id: 6,
        workoutId: 6,
        userId: 7,
        title: "Track Workout",
        previewText: "400m, 300m, 200m, 100m ladder with full recovery. Felt strong today!",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        user: { username: "track_coach", name: "Coach Smith" }
      },
      {
        id: 7,
        workoutId: 7,
        userId: 8,
        title: "Race Prep",
        previewText: "Final tuneup before Saturday's meet - 4x150m at race pace with 3min rest",
        createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
        user: { username: "medal_hunter", name: "James W." }
      }
    ];
    
    res.json(workoutPreviews);
  });
  
  app.get("/api/login-streak", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const streak = await dbStorage.getLoginStreakByUserId(req.user!.id);
      if (!streak) {
        // Create a new login streak record if it doesn't exist
        return res.json({ currentStreak: 0, longestStreak: 0 });
      }
      
      res.json(streak);
    } catch (error) {
      console.error("Error fetching login streak:", error);
      res.status(500).json({ error: "Failed to fetch login streak" });
    }
  });
  
  app.get("/api/spike-transactions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const transactions = await dbStorage.getSpikeTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching spike transactions:", error);
      res.status(500).json({ error: "Failed to fetch spike transactions" });
    }
  });
  
  app.post("/api/check-daily-login", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // For this initial version, we'll just return the current login streak
      // We'll implement proper daily login tracking in a future update
      const streak = await dbStorage.getLoginStreakByUserId(req.user!.id);
      res.json(streak || { currentStreak: 0, longestStreak: 0 });
    } catch (error) {
      console.error("Error checking daily login:", error);
      res.status(500).json({ error: "Failed to check daily login" });
    }
  });
  
  app.post("/api/claim-achievement/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ error: "Invalid achievement ID" });
      }
      
      // For this initial version, we'll just fetch the achievement
      // We'll implement proper achievement claiming in a future update
      const achievements = await dbStorage.getAchievements();
      const achievement = achievements.find((a) => a.id === achievementId);
      
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Error claiming achievement:", error);
      res.status(500).json({ error: "Failed to claim achievement" });
    }
  });
  
  // Proxy route for external API calls - no auth required
  app.get("/api/proxy", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Validate that this is a Google API URL for security
      if (!url.startsWith('https://maps.googleapis.com/')) {
        return res.status(403).json({ error: "Only Google APIs are allowed" });
      }
      
      console.log(`Proxying request to: ${url.substring(0, 100)}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in proxy request:", error);
      res.status(500).json({ error: "Failed to fetch data from external API" });
    }
  });
  
  // Meet routes
  app.get("/api/meets", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const meets = await dbStorage.getMeetsByUserId(userId);
    res.json(meets);
  });

  app.get("/api/meets/upcoming", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const meets = await dbStorage.getUpcomingMeetsByUserId(userId);
    res.json(meets);
  });

  app.get("/api/meets/past", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const meets = await dbStorage.getPastMeetsByUserId(userId);
    res.json(meets);
  });

  app.get("/api/meets/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetId = parseInt(req.params.id);
    if (isNaN(meetId)) return res.status(400).send("Invalid meet ID");
    
    const meet = await dbStorage.getMeet(meetId);
    if (!meet) return res.status(404).send("Meet not found");
    
    // Check if user owns the meet
    if (meet.userId !== req.user!.id) return res.sendStatus(403);
    
    res.json(meet);
  });

  app.post("/api/meets", async (req: Request, res: Response) => {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // Get the raw data
      const rawData = req.body;
      
      // Validate required fields
      if (!rawData.name || !rawData.date || !rawData.location) {
        return res.status(400).json({ 
          error: 'Missing required fields'
        });
      }
      
      // Parse date if it's a string
      if (rawData.date && typeof rawData.date === 'string') {
        rawData.date = new Date(rawData.date);
        
        // Check if date is valid
        if (isNaN(rawData.date.getTime())) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
      }
      
      // Parse and validate the data
      const meetData = insertMeetSchema.parse(rawData);
      
      // Override userId with authenticated user
      meetData.userId = req.user!.id;
      
      // Create the meet
      const meet = await dbStorage.createMeet(meetData);
      
      // Create automatic reminders
      try {
        const meetDate = new Date(meet.date);
        
        // 5 days before reminder
        const fiveDaysBefore = new Date(meetDate);
        fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);
        await dbStorage.createReminder({
          meetId: meet.id,
          userId: req.user!.id,
          title: "Prepare your equipment",
          description: "Prepare your equipment for the upcoming meet",
          category: "equipment",
          date: fiveDaysBefore
        });
        
        // 3 days before reminder
        const threeDaysBefore = new Date(meetDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        await dbStorage.createReminder({
          meetId: meet.id,
          userId: req.user!.id,
          title: "Pre-meet nutrition plan",
          description: "Start following your pre-meet nutrition plan",
          category: "nutrition",
          date: threeDaysBefore
        });
        
        // 1 day before reminder
        const dayBefore = new Date(meetDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        await dbStorage.createReminder({
          meetId: meet.id,
          userId: req.user!.id,
          title: "Sleep preparation",
          description: "Get at least 8 hours of sleep tonight",
          category: "rest",
          date: dayBefore
        });
        
        // Warmup reminder on meet day
        const warmupTime = new Date(meetDate);
        warmupTime.setMinutes(warmupTime.getMinutes() - (meet.warmupTime || 60));
        await dbStorage.createReminder({
          meetId: meet.id,
          userId: req.user!.id,
          title: "Warmup time",
          description: "Time to start your warmup routine",
          category: "warmup",
          date: warmupTime
        });
      } catch (reminderError) {
        console.error('Error creating reminders:', reminderError);
        // Continue execution - don't fail the meet creation if reminders fail
      }
      
      // Return the created meet
      return res.status(201).json(meet);
      
    } catch (error) {
      console.error('Error in POST /api/meets:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.patch("/api/meets/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetId = parseInt(req.params.id);
    if (isNaN(meetId)) return res.status(400).send("Invalid meet ID");
    
    const meet = await dbStorage.getMeet(meetId);
    if (!meet) return res.status(404).send("Meet not found");
    
    // Check if user owns the meet
    if (meet.userId !== req.user!.id) return res.sendStatus(403);
    
    try {
      // Only allow specific fields to be updated
      const allowedUpdates = [
        "name", "date", "location", "coordinates", 
        "events", "warmupTime", "arrivalTime", "status"
      ];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedMeet = await dbStorage.updateMeet(meetId, updates);
      res.json(updatedMeet);
    } catch (error) {
      res.status(500).send("Error updating meet");
    }
  });

  app.delete("/api/meets/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetId = parseInt(req.params.id);
    if (isNaN(meetId)) return res.status(400).send("Invalid meet ID");
    
    const meet = await dbStorage.getMeet(meetId);
    if (!meet) return res.status(404).send("Meet not found");
    
    // Check if user owns the meet
    if (meet.userId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteMeet(meetId);
    res.sendStatus(204);
  });

  // Result routes
  app.get("/api/results", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const results = await dbStorage.getResultsByUserId(userId);
    res.json(results);
  });

  app.get("/api/meets/:meetId/results", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetId = parseInt(req.params.meetId);
    if (isNaN(meetId)) return res.status(400).send("Invalid meet ID");
    
    const meet = await dbStorage.getMeet(meetId);
    if (!meet) return res.status(404).send("Meet not found");
    
    // Check if user owns the meet
    if (meet.userId !== req.user!.id) return res.sendStatus(403);
    
    const results = await dbStorage.getResultsByMeetId(meetId);
    res.json(results);
  });

  app.post("/api/results", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const resultData = insertResultSchema.parse(req.body);
      
      // Override userId with authenticated user
      resultData.userId = req.user!.id;
      
      // Verify meet exists and user owns it
      const meet = await dbStorage.getMeet(resultData.meetId);
      if (!meet) return res.status(404).send("Meet not found");
      if (meet.userId !== req.user!.id) return res.sendStatus(403);
      
      // Create the result
      const result = await dbStorage.createResult(resultData);
      
      // Update meet status to completed if not already
      if (meet.status === 'upcoming') {
        await dbStorage.updateMeet(meet.id, { status: 'completed' });
      }
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error creating result");
    }
  });

  app.patch("/api/results/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const resultId = parseInt(req.params.id);
    if (isNaN(resultId)) return res.status(400).send("Invalid result ID");
    
    const result = await dbStorage.getResult(resultId);
    if (!result) return res.status(404).send("Result not found");
    
    // Check if user owns the result
    if (result.userId !== req.user!.id) return res.sendStatus(403);
    
    try {
      // Only allow specific fields to be updated
      const allowedUpdates = ["result", "windSpeed", "place", "notes"];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedResult = await dbStorage.updateResult(resultId, updates);
      res.json(updatedResult);
    } catch (error) {
      res.status(500).send("Error updating result");
    }
  });

  app.delete("/api/results/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const resultId = parseInt(req.params.id);
    if (isNaN(resultId)) return res.status(400).send("Invalid result ID");
    
    const result = await dbStorage.getResult(resultId);
    if (!result) return res.status(404).send("Result not found");
    
    // Check if user owns the result
    if (result.userId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteResult(resultId);
    res.sendStatus(204);
  });

  // Reminder routes
  app.get("/api/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const reminders = await dbStorage.getRemindersByUserId(userId);
    res.json(reminders);
  });

  app.get("/api/meets/:meetId/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetId = parseInt(req.params.meetId);
    if (isNaN(meetId)) return res.status(400).send("Invalid meet ID");
    
    const meet = await dbStorage.getMeet(meetId);
    if (!meet) return res.status(404).send("Meet not found");
    
    // Check if user owns the meet
    if (meet.userId !== req.user!.id) return res.sendStatus(403);
    
    const reminders = await dbStorage.getRemindersByMeetId(meetId);
    res.json(reminders);
  });

  app.post("/api/reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const parsedData = insertReminderSchema.parse(req.body);
      
      // Create a new object with the user ID from the authenticated user
      const reminderData: InsertReminder = {
        ...parsedData,
        userId: req.user!.id
      };
      
      // Verify meet exists and user owns it
      const meet = await dbStorage.getMeet(reminderData.meetId);
      if (!meet) return res.status(404).send("Meet not found");
      if (meet.userId !== req.user!.id) return res.sendStatus(403);
      
      const reminder = await dbStorage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error creating reminder");
    }
  });

  app.patch("/api/reminders/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const reminderId = parseInt(req.params.id);
    if (isNaN(reminderId)) return res.status(400).send("Invalid reminder ID");
    
    const reminder = await dbStorage.getReminder(reminderId);
    if (!reminder) return res.status(404).send("Reminder not found");
    
    // Check if user owns the reminder
    if (reminder.userId !== req.user!.id) return res.sendStatus(403);
    
    try {
      // Only allow specific fields to be updated
      const allowedUpdates = ["message", "dueDate", "completed"];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updatedReminder = await dbStorage.updateReminder(reminderId, updates);
      res.json(updatedReminder);
    } catch (error) {
      res.status(500).send("Error updating reminder");
    }
  });

  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const reminderId = parseInt(req.params.id);
    if (isNaN(reminderId)) return res.status(400).send("Invalid reminder ID");
    
    const reminder = await dbStorage.getReminder(reminderId);
    if (!reminder) return res.status(404).send("Reminder not found");
    
    // Check if user owns the reminder
    if (reminder.userId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteReminder(reminderId);
    res.sendStatus(204);
  });

  // Coach routes
  app.get("/api/coaches", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const coaches = await dbStorage.getCoachesByUserId(userId);
    res.json(coaches);
  });

  app.get("/api/athletes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const coachId = req.user!.id;
    const athletes = await dbStorage.getAthletesByCoachId(coachId);
    res.json(athletes);
  });

  app.post("/api/coaches", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const coachData = insertCoachSchema.parse(req.body);
      
      // Verify athlete exists
      const athlete = await dbStorage.getUser(coachData.athleteId);
      if (!athlete) return res.status(404).send("Athlete not found");
      
      // Create the coach relationship (pending by default)
      const coach = await dbStorage.createCoach(coachData);
      res.status(201).json(coach);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error creating coach relationship");
    }
  });

  app.patch("/api/coaches/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) return res.status(400).send("Invalid coach ID");
    
    const coach = await dbStorage.getCoach(coachId);
    if (!coach) return res.status(404).send("Coach relationship not found");
    
    // Check if user is the athlete in the relationship (for accepting/rejecting)
    // or the coach (for updating status)
    if (coach.athleteId !== req.user!.id && coach.userId !== req.user!.id) {
      return res.sendStatus(403);
    }
    
    try {
      // Only allow status to be updated
      if (req.body.status === undefined) {
        return res.status(400).send("Status is required");
      }
      
      // Validate status value
      if (!['pending', 'accepted', 'rejected'].includes(req.body.status)) {
        return res.status(400).send("Invalid status value");
      }
      
      const updatedCoach = await dbStorage.updateCoach(coachId, { status: req.body.status });
      res.json(updatedCoach);
    } catch (error) {
      res.status(500).send("Error updating coach relationship");
    }
  });

  app.delete("/api/coaches/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) return res.status(400).send("Invalid coach ID");
    
    const coach = await dbStorage.getCoach(coachId);
    if (!coach) return res.status(404).send("Coach relationship not found");
    
    // Check if user is either the athlete or the coach
    if (coach.athleteId !== req.user!.id && coach.userId !== req.user!.id) {
      return res.sendStatus(403);
    }
    
    await dbStorage.deleteCoach(coachId);
    res.sendStatus(204);
  });
  
  // Athlete Group routes
  app.get("/api/athlete-groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const coachId = req.user!.id;
    const groups = await dbStorage.getAthleteGroupsByCoachId(coachId);
    res.json(groups);
  });

  app.post("/api/athlete-groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupData = insertAthleteGroupSchema.parse(req.body);
      
      // Make sure the coach is the current user
      if (groupData.coachId !== req.user!.id) {
        return res.status(403).send("Coach ID must match the current user");
      }
      
      const group = await dbStorage.createAthleteGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error creating athlete group");
    }
  });

  app.get("/api/athlete-groups/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const group = await dbStorage.getAthleteGroup(groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    // Get the members of the group
    const members = await dbStorage.getGroupMembersByGroupId(groupId);
    
    // Get details of each athlete
    const athletePromises = members.map(async (member) => {
      return await dbStorage.getUser(member.athleteId);
    });
    
    const athletes = await Promise.all(athletePromises);
    const validAthletes = athletes.filter(Boolean);
    
    res.json({
      ...group,
      athletes: validAthletes,
    });
  });

  app.patch("/api/athlete-groups/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const group = await dbStorage.getAthleteGroup(groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    try {
      // Only allow name and description to be updated
      const allowedUpdates = ["name", "description"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid updates provided");
      }
      
      const updatedGroup = await dbStorage.updateAthleteGroup(groupId, updates);
      res.json(updatedGroup);
    } catch (error) {
      res.status(500).send("Error updating athlete group");
    }
  });

  app.delete("/api/athlete-groups/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const group = await dbStorage.getAthleteGroup(groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteAthleteGroup(groupId);
    res.sendStatus(204);
  });

  // Group Member routes
  app.get("/api/athlete-groups/:groupId/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const group = await dbStorage.getAthleteGroup(groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    const members = await dbStorage.getGroupMembersByGroupId(groupId);
    
    // Get details of each athlete
    const athletePromises = members.map(async (member) => {
      const athlete = await dbStorage.getUser(member.athleteId);
      if (athlete) {
        return {
          memberId: member.id,
          athlete,
        };
      }
      return null;
    });
    
    const results = await Promise.all(athletePromises);
    const validResults = results.filter(Boolean);
    
    res.json(validResults);
  });

  app.post("/api/athlete-groups/:groupId/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const group = await dbStorage.getAthleteGroup(groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    try {
      const memberData = insertGroupMemberSchema.parse({
        ...req.body,
        groupId,
      });
      
      // Verify athlete exists
      const athlete = await dbStorage.getUser(memberData.athleteId);
      if (!athlete) return res.status(404).send("Athlete not found");
      
      // Verify the coach-athlete relationship exists and is accepted
      const coachRelation = await dbStorage.getCoachesByUserId(req.user!.id)
        .then(coaches => coaches.find(coach => 
          coach.athleteId === memberData.athleteId && coach.status === 'accepted'
        ));
      
      if (!coachRelation) {
        return res.status(403).send("You must have an accepted coach relationship with this athlete");
      }
      
      // Check if athlete is already in the group
      const existingMember = await dbStorage.getGroupMembersByGroupId(groupId)
        .then(members => members.find(member => member.athleteId === memberData.athleteId));
      
      if (existingMember) {
        return res.status(400).send("Athlete is already in this group");
      }
      
      const member = await dbStorage.createAthleteGroupMember(memberData);
      
      // Return the created member with athlete details
      const result = {
        memberId: member.id,
        athlete,
      };
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error adding athlete to group");
    }
  });

  app.delete("/api/group-members/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const memberId = parseInt(req.params.id);
    if (isNaN(memberId)) return res.status(400).send("Invalid member ID");
    
    const member = await dbStorage.getGroupMember(memberId);
    if (!member) return res.status(404).send("Group member not found");
    
    // Get the group to check ownership
    const group = await dbStorage.getAthleteGroup(member.groupId);
    if (!group) return res.status(404).send("Athlete group not found");
    
    // Check if user owns the group
    if (group.coachId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteAthleteGroupMember(memberId);
    res.sendStatus(204);
  });

  // Coach Notes routes
  app.get("/api/coach-notes/athlete/:athleteId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const athleteId = parseInt(req.params.athleteId);
    if (isNaN(athleteId)) return res.status(400).send("Invalid athlete ID");
    
    const userId = req.user!.id;
    
    // If the user is the coach, include private notes
    const isCoach = await dbStorage.getCoachesByUserId(userId)
      .then(coaches => coaches.some(coach => 
        coach.athleteId === athleteId && coach.status === 'accepted'
      ));
    
    const includePrivate = isCoach;
    const notes = await dbStorage.getCoachNotesByAthleteId(athleteId, includePrivate);
    
    // If the user is the athlete, filter out private notes and only show notes where they are the athlete
    if (!isCoach) {
      const filteredNotes = notes.filter(note => 
        note.athleteId === userId && !note.isPrivate
      );
      return res.json(filteredNotes);
    }
    
    res.json(notes);
  });

  app.post("/api/coach-notes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const noteData = insertCoachNoteSchema.parse(req.body);
      
      // Make sure the coach is the current user
      if (noteData.coachId !== req.user!.id) {
        return res.status(403).send("Coach ID must match the current user");
      }
      
      // Verify athlete exists
      const athlete = await dbStorage.getUser(noteData.athleteId);
      if (!athlete) return res.status(404).send("Athlete not found");
      
      // Verify the coach-athlete relationship exists and is accepted
      const coachRelation = await dbStorage.getCoachesByUserId(req.user!.id)
        .then(coaches => coaches.find(coach => 
          coach.athleteId === noteData.athleteId && coach.status === 'accepted'
        ));
      
      if (!coachRelation) {
        return res.status(403).send("You must have an accepted coach relationship with this athlete");
      }
      
      // Optional: Verify meet exists if meetId is provided
      if (noteData.meetId) {
        const meet = await dbStorage.getMeet(noteData.meetId);
        if (!meet) return res.status(404).send("Meet not found");
      }
      
      // Optional: Verify result exists if resultId is provided
      if (noteData.resultId) {
        const result = await dbStorage.getResult(noteData.resultId);
        if (!result) return res.status(404).send("Result not found");
      }
      
      const note = await dbStorage.createCoachNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Error creating coach note");
    }
  });

  app.patch("/api/coach-notes/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) return res.status(400).send("Invalid note ID");
    
    const note = await dbStorage.getCoachNote(noteId);
    if (!note) return res.status(404).send("Coach note not found");
    
    // Check if user is the coach who created the note
    if (note.coachId !== req.user!.id) return res.sendStatus(403);
    
    try {
      // Only allow note text and isPrivate to be updated
      const allowedUpdates = ["note", "isPrivate"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).send("No valid updates provided");
      }
      
      const updatedNote = await dbStorage.updateCoachNote(noteId, updates);
      res.json(updatedNote);
    } catch (error) {
      res.status(500).send("Error updating coach note");
    }
  });

  app.delete("/api/coach-notes/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) return res.status(400).send("Invalid note ID");
    
    const note = await dbStorage.getCoachNote(noteId);
    if (!note) return res.status(404).send("Coach note not found");
    
    // Check if user is the coach who created the note
    if (note.coachId !== req.user!.id) return res.sendStatus(403);
    
    await dbStorage.deleteCoachNote(noteId);
    res.sendStatus(204);
  });

  // User routes (excluding auth routes which are in auth.ts)
  app.patch("/api/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Only allow specific fields to be updated
      const allowedUpdates = ["name", "email", "defaultClubId"];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      // If a default club ID is provided, verify the user is a member of that club
      if (updates.defaultClubId !== undefined) {
        const clubMember = await dbStorage.getClubMemberByUserAndClub(userId, updates.defaultClubId);
        if (!clubMember && updates.defaultClubId !== null) {
          return res.status(400).send("User is not a member of the specified club");
        }
      }
      
      const updatedUser = await dbStorage.updateUser(userId, updates);
      
      // Update the session user object
      if (updatedUser) {
        req.login(updatedUser, (err) => {
          if (err) return res.status(500).send("Error updating session");
          res.json(updatedUser);
        });
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      res.status(500).send("Error updating user");
    }
  });
  
  // Get user by ID - for getting admin usernames for clubs
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Only return public user info
      const publicUserInfo = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
      
      res.json(publicUserInfo);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).send(`Error fetching user: ${error.message || error}`);
    }
  });

  // Club endpoints
  app.get("/api/clubs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubs = await dbStorage.getClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).send("Error fetching clubs");
    }
  });

  app.get("/api/clubs/my", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubs = await dbStorage.getUserClubs(req.user!.id);
      res.json(clubs);
    } catch (error) {
      res.status(500).send("Error fetching user clubs");
    }
  });

  app.post("/api/clubs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Parse and validate the club data
      const clubData = {
        ...req.body,
        ownerId: req.user!.id
        // joinCode removed as it doesn't exist in the DB
      };
      const newClub = await dbStorage.createClub(clubData);
      res.status(201).json(newClub);
    } catch (error: any) {
      console.error("Error creating club:", error);
      res.status(500).send(`Error creating club: ${error.message || error}`);
    }
  });

  app.get("/api/clubs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      res.json(club);
    } catch (error: any) {
      console.error("Error fetching club:", error);
      res.status(500).send(`Error fetching club: ${error.message || error}`);
    }
  });
  
  // Get club members
  app.get("/api/clubs/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const club = await dbStorage.getClub(clubId);
      
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is a member of the club
      const userMembership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      if (!userMembership) {
        return res.status(403).send("You are not a member of this club");
      }
      
      // Get all members
      const members = await dbStorage.getClubMembersByClubId(clubId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching club members:", error);
      res.status(500).send(`Error fetching club members: ${error.message || error}`);
    }
  });
  
  // Generate club invite link
  app.post("/api/clubs/:id/generateInviteLink", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user has admin permission
      const userMembership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      if (!userMembership || userMembership.role !== 'admin') {
        return res.status(403).send("You don't have permission to generate invite links");
      }
      
      // Generate a unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store the invite code for the club
      const updatedClub = await dbStorage.updateClub(clubId, {
        inviteCode
      });
      
      if (!updatedClub) {
        return res.status(500).send("Failed to generate invite link");
      }
      
      // Return the full invite link
      const inviteLink = `${process.env.BASE_URL || 'http://localhost:5000'}/clubs/join/${inviteCode}`;
      res.json({ inviteLink, inviteCode });
    } catch (error: any) {
      console.error("Error generating invite link:", error);
      res.status(500).send(`Error generating invite link: ${error.message || error}`);
    }
  });
  
  // Request to join club
  app.post("/api/clubs/:id/request", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is already a member
      const existingMembership = await dbStorage.getClubMemberByUserAndClub(userId, clubId);
      if (existingMembership) {
        return res.status(400).send("You are already a member of this club");
      }
      
      // Create a membership request (joinedAt is NULL until approved)
      const memberRequest = await dbStorage.createClubMember({
        clubId,
        userId,
        role: 'member' as const,
        joinedAt: null // Pending approval
      });
      
      res.status(201).json({ message: "Join request sent successfully" });
    } catch (error: any) {
      console.error("Error requesting to join club:", error);
      res.status(500).send(`Error requesting to join club: ${error.message || error}`);
    }
  });
  
  // Approve member join request
  app.post("/api/clubs/:id/approve/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const userIdToApprove = parseInt(req.params.userId);
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if requester has admin permission
      const userMembership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      if (!userMembership || userMembership.role !== 'admin') {
        return res.status(403).send("You don't have permission to approve members");
      }
      
      // Get the pending membership
      const membershipRequest = await dbStorage.getClubMemberByUserAndClub(userIdToApprove, clubId);
      if (!membershipRequest) {
        return res.status(404).send("Membership request not found");
      }
      
      if (membershipRequest.joinedAt !== null) {
        return res.status(400).send("User is already a member of this club");
      }
      
      // Approve the request by setting joinedAt
      const updatedMembership = await dbStorage.updateClubMember(membershipRequest.id, {
        joinedAt: new Date()
      });
      
      if (!updatedMembership) {
        return res.status(500).send("Failed to approve member");
      }
      
      res.json({ message: "Member approved successfully" });
    } catch (error: any) {
      console.error("Error approving club member:", error);
      res.status(500).send(`Error approving club member: ${error.message || error}`);
    }
  });
  
  // Join with invite code
  app.post("/api/clubs/join-with-code/:inviteCode", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { inviteCode } = req.params;
      const userId = req.user!.id;
      
      // Find club by invite code
      const club = await dbStorage.getClubByInviteCode(inviteCode);
      if (!club) {
        return res.status(404).send("Invalid or expired invite code");
      }
      
      // Check if user is already a member
      const existingMembership = await dbStorage.getClubMemberByUserAndClub(userId, club.id);
      if (existingMembership) {
        return res.status(400).send("You are already a member of this club");
      }
      
      // Create the membership (automatically approved via invite link)
      const newMember = await dbStorage.createClubMember({
        clubId: club.id,
        userId,
        role: 'member' as const,
        joinedAt: new Date() // Automatically approved via invite
      });
      
      res.status(201).json({ message: "Successfully joined the club" });
    } catch (error: any) {
      console.error("Error joining club with invite code:", error);
      res.status(500).send(`Error joining club: ${error.message || error}`);
    }
  });
  
  // Remove member from club
  app.delete("/api/clubs/:clubId/members/:memberId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.clubId);
      const memberId = parseInt(req.params.memberId);
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user has admin permission
      const userMembership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      if (!userMembership || userMembership.role !== 'admin') {
        return res.status(403).send("You don't have permission to remove members");
      }
      
      // Get the member details
      const memberToRemove = await dbStorage.getClubMember(memberId);
      if (!memberToRemove || memberToRemove.clubId !== clubId) {
        return res.status(404).send("Member not found in this club");
      }
      
      // Don't allow removing the owner
      if (memberToRemove.userId === club.ownerId) {
        return res.status(403).send("Cannot remove the club owner");
      }
      
      // Remove the member
      const success = await dbStorage.deleteClubMember(memberId);
      if (!success) {
        return res.status(500).send("Failed to remove member");
      }
      
      res.status(200).send("Member removed successfully");
    } catch (error: any) {
      console.error("Error removing member:", error);
      res.status(500).send(`Error removing member: ${error.message || error}`);
    }
  });
  
  // Upload club images (logo or banner)
  app.post("/api/clubs/:id/upload", upload.single('file'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const fileType = req.body.fileType as 'logo' | 'banner';
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is the owner
      if (club.ownerId !== req.user!.id) {
        return res.status(403).send("Only the club owner can update club images");
      }
      
      // Ensure file was uploaded
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }
      
      // Generate file path
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = `club-${fileType}-${clubId}-${uniqueSuffix}${ext}`;
      
      // Move file to a permanent location (it's already saved by multer)
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, filename);
      
      fs.renameSync(oldPath, newPath);
      
      // Update relative path for the database
      const fileUrl = `/uploads/${filename}`;
      
      // Update the club in the database
      if (fileType === 'logo') {
        await dbStorage.updateClub(clubId, { logoUrl: fileUrl });
      } else if (fileType === 'banner') {
        await dbStorage.updateClub(clubId, { bannerUrl: fileUrl });
      }
      
      // Return the file URL
      res.json({ fileUrl });
    } catch (error: any) {
      console.error(`Error uploading club ${req.body.fileType}:`, error);
      res.status(500).send(`Error uploading image: ${error.message || error}`);
    }
  });

  // Update club
  app.patch("/api/clubs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const { name, description, isPrivate, isPremium, logoUrl, bannerUrl } = req.body;
      
      // Validation
      if (name !== undefined && !name.trim()) {
        return res.status(400).send("Club name cannot be empty");
      }
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is the owner
      if (club.ownerId !== req.user!.id) {
        return res.status(403).send("Only the club owner can update club details");
      }
      
      // Update the club
      const updatedClub = await dbStorage.updateClub(clubId, {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isPrivate: isPrivate !== undefined ? isPrivate : undefined,
        isPremium: isPremium !== undefined ? isPremium : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined
      });
      
      if (!updatedClub) {
        return res.status(500).send("Failed to update club");
      }
      
      res.json(updatedClub);
    } catch (error: any) {
      console.error("Error updating club:", error);
      res.status(500).send(`Error updating club: ${error.message || error}`);
    }
  });
  
  // Delete club
  app.delete("/api/clubs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      
      // Check if club exists
      const club = await dbStorage.getClub(clubId);
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is the owner
      if (club.ownerId !== req.user!.id) {
        return res.status(403).send("Only the club owner can delete the club");
      }
      
      // Delete the club
      const success = await dbStorage.deleteClub(clubId);
      if (!success) {
        return res.status(500).send("Failed to delete club");
      }
      
      res.status(200).send("Club deleted successfully");
    } catch (error: any) {
      console.error("Error deleting club:", error);
      res.status(500).send(`Error deleting club: ${error.message || error}`);
    }
  });

  app.post("/api/clubs/:id/join", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const club = await dbStorage.getClub(clubId);
      
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if user is already a member
      const existingMembership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      if (existingMembership) {
        return res.status(400).send("Already a member of this club");
      }
      
      // For private clubs, we'll set status to 'pending' for admin approval
      // Join codes are not implemented in this version
      
      const memberData = {
        clubId,
        userId: req.user!.id,
        role: "member" as const,
        status: club.isPrivate ? "pending" as const : "accepted" as const
      };
      
      const membership = await dbStorage.createClubMember(memberData);
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).send("Error joining club");
    }
  });

  // Club messages endpoints
  app.get("/api/clubs/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      
      // Check if user is a member of the club
      const membership = await dbStorage.getClubMemberByUserAndClub(req.user!.id, clubId);
      
      if (!membership) {
        return res.status(403).send("Not authorized to view messages in this club");
      }
      
      const messages = await dbStorage.getClubMessages(clubId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching club messages:", error);
      res.status(500).send("Error fetching messages");
    }
  });
  
  app.post("/api/clubs/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const clubId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user is a member of the club
      const membership = await dbStorage.getClubMemberByUserAndClub(userId, clubId);
      
      if (!membership) {
        return res.status(403).send("Not authorized to post messages in this club");
      }
      
      // Get the club to check if it's premium
      const club = await dbStorage.getClub(clubId);
      
      if (!club) {
        return res.status(404).send("Club not found");
      }
      
      // Check if the club is premium or if the club owner is sending the message
      if (!club.isPremium && club.ownerId !== userId) {
        return res.status(403).send("Chat is a premium feature. Please upgrade to send messages.");
      }
      
      const message = await dbStorage.createClubMessage({
        clubId,
        userId,
        content: req.body.content
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error posting club message:", error);
      res.status(500).send("Error posting message");
    }
  });

  // Group endpoints
  app.get("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groups = await dbStorage.getUserGroups(req.user!.id);
      res.json(groups);
    } catch (error) {
      res.status(500).send("Error fetching user groups");
    }
  });

  app.post("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate the request data and use the correct field name for owner
      const parsedData = insertGroupSchema.safeParse({
        ...req.body,
        ownerId: req.user!.id
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          error: "Invalid data", 
          details: parsedData.error.format() 
        });
      }
      
      // Create the group with owner ID properly set
      const newGroup = await dbStorage.createGroup(parsedData.data);
      
      res.status(201).json(newGroup);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).send("An error occurred while creating the group");
    }
  });

  app.get("/api/groups/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Check if user is a member
      const membership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (!membership && group.ownerId !== req.user!.id && group.isPrivate) {
        return res.status(403).send("Not authorized to view this group");
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).send("Error fetching group");
    }
  });

  app.get("/api/groups/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Check if user is a member or owner
      const membership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (!membership && group.ownerId !== req.user!.id && group.isPrivate) {
        return res.status(403).send("Not authorized to view group members");
      }
      
      const members = await dbStorage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).send("Error fetching group members");
    }
  });

  app.post("/api/groups/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Only owner or admin can add members
      const membership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (group.ownerId !== req.user!.id && (!membership || membership.role !== 'admin')) {
        return res.status(403).send("Not authorized to add members to this group");
      }
      
      const { userId, role = 'member' } = req.body;
      if (!userId) {
        return res.status(400).send("User ID is required");
      }
      
      const memberData = {
        groupId,
        userId,
        role: role as "member" | "admin",
        status: "accepted" as const // Directly accepted when added by admin/owner
      };
      
      const newMember = await dbStorage.createChatGroupMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).send("Error adding group member");
    }
  });

  app.post("/api/groups/:id/join", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Check if user is already a member
      const existingMembership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (existingMembership) {
        return res.status(400).send("Already a member of this group");
      }
      
      // For private groups, we'll set status to 'pending' for admin approval
      // Join codes are not implemented in this version
      
      const memberData = {
        groupId,
        userId: req.user!.id,
        role: "member" as const,
        status: group.isPrivate ? "pending" as const : "accepted" as const
      };
      
      const membership = await dbStorage.createChatGroupMember(memberData);
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).send("Error joining group");
    }
  });

  app.post("/api/groups/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Check if user is a member
      const membership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (!membership && group.ownerId !== req.user!.id) {
        return res.status(403).send("Not authorized to post messages in this group");
      }
      
      const messageData = {
        groupId,
        senderId: req.user!.id,
        message: req.body.message,
        mediaUrl: req.body.mediaUrl
      };
      
      const newMessage = await dbStorage.createGroupMessage(messageData);
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).send("Error sending message");
    }
  });

  app.get("/api/groups/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      const group = await dbStorage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).send("Group not found");
      }
      
      // Check if user is a member
      const membership = await dbStorage.getGroupMemberByUserAndGroup(req.user!.id, groupId);
      if (!membership && group.ownerId !== req.user!.id) {
        return res.status(403).send("Not authorized to view messages in this group");
      }
      
      const messages = await dbStorage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).send("Error fetching messages");
    }
  });

  // Premium features - just mock endpoints for now
  app.post("/api/premium/upgrade", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const updatedUser = await dbStorage.updateUser(userId, { isPremium: true });
      
      if (updatedUser) {
        // Update the session user object
        req.login(updatedUser, (err) => {
          if (err) return res.status(500).send("Error updating session");
          res.json(updatedUser);
        });
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      res.status(500).send("Error upgrading to premium");
    }
  });

  // ============================================================
  // Spikes Reward System Routes
  // ============================================================

  // Update login streak when user logs in
  app.post("/api/login-streak", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const streak = await dbStorage.createOrUpdateLoginStreak(userId);
      res.json(streak);
    } catch (error) {
      console.error("Error updating login streak:", error);
      res.status(500).send("Error updating login streak");
    }
  });

  // Get user's achievement progress
  app.get("/api/achievements", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const achievements = await dbStorage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).send("Error fetching achievements");
    }
  });

  // Get user's achievements
  app.get("/api/user/achievements", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const userAchievements = await dbStorage.getUserAchievementsByUserId(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).send("Error fetching user achievements");
    }
  });

  // Award achievement to user
  app.post("/api/user/achievements/:achievementId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const achievementId = parseInt(req.params.achievementId);
      
      if (isNaN(achievementId)) {
        return res.status(400).send("Invalid achievement ID");
      }
      
      const userAchievement = await dbStorage.completeUserAchievement(userId, achievementId);
      res.json(userAchievement);
    } catch (error) {
      console.error("Error awarding achievement:", error);
      res.status(500).send("Error awarding achievement");
    }
  });

  // Get user's login streak
  app.get("/api/user/streak", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const streak = await dbStorage.getLoginStreakByUserId(userId);
      res.json(streak || { currentStreak: 0, longestStreak: 0 });
    } catch (error) {
      console.error("Error fetching login streak:", error);
      res.status(500).send("Error fetching login streak");
    }
  });

  // Get user's spike transaction history
  app.get("/api/user/spikes/transactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const transactions = await dbStorage.getSpikeTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching spike transactions:", error);
      res.status(500).send("Error fetching spike transactions");
    }
  });

  // Add spikes to user (for testing or admin purposes)
  app.post("/api/user/spikes/add", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { amount, reason } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).send("Invalid amount");
      }
      
      const result = await dbStorage.addSpikesToUser(
        userId, 
        amount, 
        'manual', 
        undefined, 
        reason || `Manual addition of ${amount} spikes`
      );
      
      // Update the session user object
      req.login(result.user, (err) => {
        if (err) return res.status(500).send("Error updating session");
        res.json(result);
      });
    } catch (error) {
      console.error("Error adding spikes:", error);
      res.status(500).send("Error adding spikes");
    }
  });

  // Spend spikes (for purchasing items, etc.)
  app.post("/api/user/spikes/spend", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { amount, source, description } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).send("Invalid amount");
      }
      
      if (!source) {
        return res.status(400).send("Source is required");
      }
      
      const result = await dbStorage.deductSpikesFromUser(
        userId, 
        amount, 
        source, 
        undefined, 
        description
      );
      
      if (!result) {
        return res.status(400).send("Not enough spikes");
      }
      
      // Update the session user object
      req.login(result.user, (err) => {
        if (err) return res.status(500).send("Error updating session");
        res.json(result);
      });
    } catch (error) {
      console.error("Error spending spikes:", error);
      res.status(500).send("Error spending spikes");
    }
  });

  // Generate referral code
  app.post("/api/user/referral", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Generate a unique referral code
      const referralCode = `${req.user!.username.substring(0, 4)}${Date.now().toString(36).substring(4)}`;
      
      const newReferral = await dbStorage.createReferral({
        referrerId: userId,
        referredId: 0, // We'll update this when someone uses the code
        referralCode,
        status: 'pending'
      });
      
      res.json(newReferral);
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).send("Error generating referral code");
    }
  });

  // Get user's referrals
  app.get("/api/user/referrals", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const referrals = await dbStorage.getUserReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).send("Error fetching referrals");
    }
  });

  // Use referral code (for new user registration)
  app.post("/api/referral/:code", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const referralCode = req.params.code;
      
      const referral = await dbStorage.getReferralByCode(referralCode);
      
      if (!referral) {
        return res.status(404).send("Invalid referral code");
      }
      
      if (referral.referrerId === userId) {
        return res.status(400).send("You cannot use your own referral code");
      }
      
      // Update referral with the new user's ID
      const updatedReferral = await dbStorage.completeReferral(referral.id);
      
      // Also award some spikes to the new user who was referred
      const newUserBonus = await dbStorage.addSpikesToUser(
        userId,
        50,
        'referral_bonus',
        referral.id,
        `Welcome bonus for using a referral code: 50 spikes`
      );
      
      // Update the session user object
      req.login(newUserBonus.user, (err) => {
        if (err) return res.status(500).send("Error updating session");
        res.json({ referral: updatedReferral, bonus: newUserBonus });
      });
    } catch (error) {
      console.error("Error using referral code:", error);
      res.status(500).send("Error using referral code");
    }
  });

  // Award spikes for workout completion
  app.post("/api/practice/completion/:completionId/reward", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const completionId = parseInt(req.params.completionId);
      
      if (isNaN(completionId)) {
        return res.status(400).send("Invalid completion ID");
      }
      
      // Award spikes for workout completion (50 spikes)
      const result = await dbStorage.addSpikesToUser(
        userId,
        50,
        'workout_completion',
        completionId,
        `Completed workout: 50 spikes`
      );
      
      // Update the session user object
      req.login(result.user, (err) => {
        if (err) return res.status(500).send("Error updating session");
        res.json(result);
      });
    } catch (error) {
      console.error("Error awarding workout completion spikes:", error);
      res.status(500).send("Error awarding workout completion spikes");
    }
  });

  // Award spikes for creating a meet
  app.post("/api/meets/:meetId/reward", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const meetId = parseInt(req.params.meetId);
      
      if (isNaN(meetId)) {
        return res.status(400).send("Invalid meet ID");
      }
      
      // Award spikes for creating a meet (30 spikes)
      const result = await dbStorage.addSpikesToUser(
        userId,
        30,
        'meet_creation',
        meetId,
        `Created a competition: 30 spikes`
      );
      
      // Update the session user object
      req.login(result.user, (err) => {
        if (err) return res.status(500).send("Error updating session");
        res.json(result);
      });
    } catch (error) {
      console.error("Error awarding meet creation spikes:", error);
      res.status(500).send("Error awarding meet creation spikes");
    }
  });

  // Programs endpoints
  // 1. Get user's own programs
  app.get("/api/programs", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programs = await dbStorage.getUserPrograms(req.user!.id);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });
  
  // 2. Get program by id
  app.get("/api/programs/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user has access to this program
      if (program.userId !== req.user!.id && program.visibility !== 'public') {
        // For private or premium programs, check if user has purchased or has access
        const purchase = await dbStorage.getPurchasedProgram(req.user!.id, programId);
        if (!purchase) {
          return res.status(403).json({ error: "You don't have access to this program" });
        }
      }
      
      // Get program sessions
      const sessions = await dbStorage.getProgramSessions(programId);
      
      res.json({
        ...program,
        sessions
      });
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });
  
  // 3. Create a new program
  app.post("/api/programs", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const program = await dbStorage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(500).json({ error: "Failed to create program" });
    }
  });
  
  // 3.1 Create a new program with file upload
  app.post("/api/programs/upload", upload.single('programFile'), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get file info
      const file = req.file;
      const fileUrl = `/uploads/programs/${file.filename}`;
      const fileType = file.mimetype;
      
      // Create program record with file information
      const programData = {
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description || '',
        category: req.body.category,
        level: req.body.level,
        duration: parseInt(req.body.duration),
        visibility: req.body.visibility,
        price: req.body.price ? parseFloat(req.body.price) : 0,
        isUploadedProgram: req.body.isUploadedProgram === 'true',
        programFileUrl: fileUrl,
        programFileType: fileType
      };
      
      const program = await dbStorage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program with file upload:", error);
      res.status(500).json({ error: "Failed to create program with file upload" });
    }
  });
  
  // 4. Update a program
  app.put("/api/programs/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user is the owner of this program
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to update this program" });
      }
      
      const updatedProgram = await dbStorage.updateProgram(programId, req.body);
      res.json(updatedProgram);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(500).json({ error: "Failed to update program" });
    }
  });
  
  // 5. Delete a program
  app.delete("/api/programs/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user is the owner of this program
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to delete this program" });
      }
      
      await dbStorage.deleteProgram(programId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  });
  
  // 6. Get user's purchased programs
  app.get("/api/purchased-programs", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const purchases = await dbStorage.getUserPurchasedPrograms(req.user!.id);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchased programs:", error);
      res.status(500).json({ error: "Failed to fetch purchased programs" });
    }
  });
  
  // 7. Purchase a program
  app.post("/api/programs/:id/purchase", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if the user already purchased this program
      const existingPurchase = await dbStorage.getPurchasedProgram(req.user!.id, programId);
      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this program" });
      }
      
      // Check if the program is free or the user has enough spikes
      const isFree = !program.price || program.price <= 0;
      
      if (!isFree) {
        const programPrice = program.price || 0;
        
        // Check if user has enough spikes
        if ((req.user!.spikes || 0) < programPrice) {
          return res.status(400).json({ error: "You don't have enough spikes to purchase this program" });
        }
        
        // Deduct spikes from user
        await dbStorage.deductSpikesFromUser(
          req.user!.id, 
          programPrice, 
          'program_purchase', 
          programId, 
          `Purchased program: ${program.title}`
        );
        
        // Add spikes to program creator
        await dbStorage.addSpikesToUser(
          program.userId, 
          programPrice, 
          'program_sale', 
          programId, 
          `Program purchased: ${program.title}`
        );
      }
      
      // Record the purchase
      const purchase = await dbStorage.purchaseProgram({
        programId,
        userId: req.user!.id,
        price: program.price || 0,
        isFree
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error purchasing program:", error);
      res.status(500).json({ error: "Failed to purchase program" });
    }
  });
  
  // 8. Record program session progress
  app.post("/api/program-sessions/:id/complete", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const sessionId = parseInt(req.params.id);
      const { programId, rating, notes } = req.body;
      
      if (!programId) {
        return res.status(400).json({ error: "Program ID is required" });
      }
      
      // Check if user has access to this program
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user owns this program or has purchased it
      const hasAccess = program.userId === req.user!.id || 
                         !!(await dbStorage.getPurchasedProgram(req.user!.id, programId));
      
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this program" });
      }
      
      // Record the progress
      const progress = await dbStorage.recordProgramProgress({
        userId: req.user!.id,
        programId,
        sessionId,
        completedAt: new Date(),
        rating,
        notes
      });
      
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error completing program session:", error);
      res.status(500).json({ error: "Failed to complete program session" });
    }
  });
  
  // 9. Get saved workouts (library)
  app.get("/api/workout-library", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const savedWorkouts = await dbStorage.getSavedWorkouts(req.user!.id);
      
      // Check if user has reached free limit (10 saved workouts) and is not premium
      const isLimited = !req.user!.isPremium && savedWorkouts.length >= 10;
      
      res.json({
        workouts: savedWorkouts,
        isLimited,
        totalSaved: savedWorkouts.length,
        maxFreeAllowed: 10
      });
    } catch (error) {
      console.error("Error fetching workout library:", error);
      res.status(500).json({ error: "Failed to fetch workout library" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
