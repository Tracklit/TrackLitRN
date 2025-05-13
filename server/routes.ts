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
  InsertMeet,
  InsertResult,
  InsertReminder,
  InsertCoach,
  InsertAthleteGroup,
  InsertGroupMember,
  InsertCoachNote,
  InsertPracticeMedia,
  PracticeMedia
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Storage configuration for multer
  const uploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, 'practice-' + uniqueSuffix + ext);
    },
  });
  
  const upload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Accept only images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images and videos are allowed'));
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
      const allowedUpdates = ["name", "email", "events"];
      
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
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
      const { name, description, isPrivate, logoUrl, bannerUrl } = req.body;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
