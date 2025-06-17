import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { pool, db } from "./db";
import { meets, notifications, groups, chatGroupMembers, groupMessages, users, passwordResetTokens } from "@shared/schema";
import { and, eq, or, sql, isNotNull } from "drizzle-orm";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { transcribeAudioHandler, upload as audioUpload } from "./routes/transcribe";
import { getUserJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from "./routes/journal";
import { getCoachAthletes, getAthleteMoodStats, getAthleteJournalEntries, getJournalComments, addJournalComment, recordMoodEntry } from "./routes/coaches";
import { getWeatherForecast } from "./weather";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { notificationSystem } from "./notification-system";
import { insertAthleteProfileSchema } from "@shared/athlete-profile-schema";
import { worldAthleticsService } from "./world-athletics";

// Background processing function for gym data
async function processGymDataInBackground(programId: number, googleSheetId: string, sessions: any[]) {
  console.log(`Starting background gym data processing for program ${programId}`);
  
  try {
    const sheetsUtils = await import('./utils/sheets');
    const { containsGymReference, fetchGymData } = sheetsUtils;
    
    // Cache for gym data to avoid repeated fetches
    const gymDataCache: { [key: number]: string[] } = {};
    let processedCount = 0;
    
    // Process sessions that need gym data
    for (const session of sessions) {
      // Skip if session already has gym data
      if (session.gymData && session.gymData.length > 0) {
        continue;
      }
      
      let gymData: string[] = [];
      const workoutFields = [
        session.shortDistanceWorkout,
        session.mediumDistanceWorkout, 
        session.longDistanceWorkout,
        session.preActivation1,
        session.preActivation2,
        session.extraSession
      ];
      
      for (const field of workoutFields) {
        if (field) {
          const gymCheck = containsGymReference(field);
          if (gymCheck.hasGym && gymCheck.gymNumber) {
            // Check cache first
            if (gymDataCache[gymCheck.gymNumber]) {
              const cachedExercises = gymDataCache[gymCheck.gymNumber];
              for (const exercise of cachedExercises) {
                if (!gymData.includes(exercise)) {
                  gymData.push(exercise);
                }
              }
            } else {
              try {
                const exercises = await fetchGymData(googleSheetId, gymCheck.gymNumber);
                if (exercises.length > 0) {
                  gymDataCache[gymCheck.gymNumber] = exercises;
                  for (const exercise of exercises) {
                    if (!gymData.includes(exercise)) {
                      gymData.push(exercise);
                    }
                  }
                }
              } catch (error) {
                console.error(`Background: Error fetching gym ${gymCheck.gymNumber}:`, error);
              }
            }
          }
        }
      }
      
      // Update session in database if gym data found
      if (gymData.length > 0) {
        try {
          await dbStorage.updateProgramSession(session.id, { gymData });
          processedCount++;
          console.log(`Background: Updated session ${session.dayNumber} with ${gymData.length} gym exercises`);
        } catch (error) {
          console.error(`Background: Error updating session ${session.id}:`, error);
        }
      }
    }
    
    console.log(`Background gym data processing completed for program ${programId}. Updated ${processedCount} sessions.`);
  } catch (error) {
    console.error(`Background gym data processing failed for program ${programId}:`, error);
  }
}
import { 
  competitionsTable, 
  competitionEventsTable, 
  athleteCompetitionResultsTable,
  userFavoriteCompetitionsTable,
  insertCompetitionSchema,
  insertCompetitionEventSchema,
  insertAthleteCompetitionResultSchema,
  insertUserFavoriteCompetitionSchema
} from "@shared/schema";
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
  ProgramAssignment,
  insertTrainingProgramSchema,
  insertProgramSessionSchema,
  insertProgramPurchaseSchema,
  insertProgramProgressSchema,
  insertWorkoutLibrarySchema,
  insertCoachAthleteSchema,
  insertCoachingRequestSchema,
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
  InsertWorkoutLibrary,
  InsertCoachAthlete,
  exerciseLibrary,
  exerciseShares,
  insertExerciseLibrarySchema,
  insertExerciseShareSchema,
  ExerciseLibrary,
  InsertExerciseLibrary,
  InsertExerciseShare
} from "@shared/schema";

// Initialize default achievements
// Image compression and cropping utility functions
async function compressImage(inputPath: string, outputPath: string, quality: number = 80): Promise<void> {
  try {
    const inputStats = fs.statSync(inputPath);
    
    // Only compress if it's an image file
    if (!inputPath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return;
    }
    
    await sharp(inputPath)
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality, progressive: true })
      .png({ quality, progressive: true })
      .webp({ quality })
      .toFile(outputPath);
    
    // Remove original file after compression if it's different
    if (inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    const outputStats = fs.statSync(outputPath);
    console.log(`Image compressed: ${inputStats.size} -> ${outputStats.size} bytes (${Math.round((1 - outputStats.size/inputStats.size) * 100)}% reduction)`);
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, keep the original file
  }
}

// Generate multiple optimized image sizes for different containers
async function generateImageSizes(inputPath: string, baseFilename: string, outputDir: string): Promise<{ original: string; thumb: string; medium: string; large: string }> {
  const baseNameWithoutExt = path.parse(baseFilename).name;
  const ext = '.webp'; // Use WebP for best compression
  
  const sizes = {
    thumb: { width: 200, height: 200, suffix: '_thumb' },    // Square thumbnails
    medium: { width: 400, height: 300, suffix: '_medium' },  // Card headers
    large: { width: 800, height: 400, suffix: '_large' }    // Banners/large displays
  };
  
  const results = {
    original: `${baseNameWithoutExt}${ext}`,
    thumb: `${baseNameWithoutExt}${sizes.thumb.suffix}${ext}`,
    medium: `${baseNameWithoutExt}${sizes.medium.suffix}${ext}`,
    large: `${baseNameWithoutExt}${sizes.large.suffix}${ext}`
  };
  
  try {
    // Generate original compressed version with quadrupled compression
    await sharp(inputPath)
      .jpeg({ quality: 20, progressive: true })
      .png({ quality: 20, progressive: true })
      .webp({ quality: 20 })
      .toFile(path.join(outputDir, results.original));
    
    // Generate different sizes with quadrupled compression
    await sharp(inputPath)
      .resize(sizes.thumb.width, sizes.thumb.height, { fit: 'cover', position: 'center' })
      .webp({ quality: 20 })
      .toFile(path.join(outputDir, results.thumb));
      
    await sharp(inputPath)
      .resize(sizes.medium.width, sizes.medium.height, { fit: 'cover', position: 'center' })
      .webp({ quality: 20 })
      .toFile(path.join(outputDir, results.medium));
      
    await sharp(inputPath)
      .resize(sizes.large.width, sizes.large.height, { fit: 'cover', position: 'center' })
      .webp({ quality: 25 })
      .toFile(path.join(outputDir, results.large));
    
    // Remove original after processing
    fs.unlinkSync(inputPath);
    
    console.log(`Generated image sizes for ${baseFilename}: original, thumb (${sizes.thumb.width}x${sizes.thumb.height}), medium (${sizes.medium.width}x${sizes.medium.height}), large (${sizes.large.width}x${sizes.large.height})`);
    
    return results;
  } catch (error) {
    console.error('Error generating image sizes:', error);
    throw error;
  }
}

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

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

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
  
  // Audio transcription endpoint
  app.post('/api/transcribe', audioUpload.single('file'), transcribeAudioHandler);
  
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
      
      let mediaUrls: any = {};
      
      // Generate multiple sizes for images
      if (fileType === 'image') {
        try {
          const outputDir = path.dirname(req.file.path);
          const imageSizes = await generateImageSizes(req.file.path, req.file.filename, outputDir);
          
          mediaUrls = {
            url: `/uploads/practice/${imageSizes.original}`,
            thumbUrl: `/uploads/practice/${imageSizes.thumb}`,
            mediumUrl: `/uploads/practice/${imageSizes.medium}`,
            largeUrl: `/uploads/practice/${imageSizes.large}`,
          };
        } catch (compressionError) {
          console.error('Image size generation failed, using original:', compressionError);
          mediaUrls = {
            url: `/uploads/practice/${req.file.filename}`,
          };
        }
      } else {
        // For videos, just use the original file
        mediaUrls = {
          url: `/uploads/practice/${req.file.filename}`,
          thumbnail: `/uploads/practice/${req.file.filename}`, // Video thumbnail generation could be added later
        };
      }
      
      // Create media record in database
      const mediaData: InsertPracticeMedia = {
        completionId: parseInt(completionId as string),
        type: fileType,
        ...mediaUrls,
      };
      
      const media = await dbStorage.createPracticeMedia(mediaData);
      
      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: error.message || 'Failed to upload media' });
    }
  });

  // API Routes - prefix all routes with /api
  
  // User search endpoint
  app.get("/api/users/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await dbStorage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Google authentication endpoint
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { email, name, googleId } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }
      
      // Check if user already exists
      let user = await dbStorage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google data
        const username = email.split('@')[0];
        const userData = {
          username,
          name,
          email,
          password: 'google_auth', // Special marker for Google auth users
          spikes: 100, // Welcome bonus
        };
        
        user = await dbStorage.createUser(userData);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ user: { id: user.id, username: user.username, name: user.name, email: user.email } });
      });
      
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  
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
        user: { username: "sarah_runner", name: "Sarah T.", profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 2,
        workoutId: 2,
        userId: 3,
        title: "Long Run Day",
        previewText: "10km easy run completed in 45mins. Feeling great!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user: { username: "track_star", name: "Michael J.", profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 3,
        workoutId: 3,
        userId: 4,
        title: "Tempo Run",
        previewText: "5x400m ladder workout complete. New personal best!",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        user: { username: "coach_k", name: "Coach Kevin", profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 4,
        workoutId: 4,
        userId: 5,
        title: "Hill Sprints",
        previewText: "Just finished 10x hill sprints. My legs are on fire but worth it!",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        user: { username: "sprint_queen", name: "Lisa M.", profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 5,
        workoutId: 5,
        userId: 6,
        title: "Morning Endurance",
        previewText: "Early morning 800m repeats - 6 sets at 2:15 pace. New week, new goals!",
        createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        user: { username: "distance_king", name: "Alex P.", profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 6,
        workoutId: 6,
        userId: 7,
        title: "Track Workout",
        previewText: "400m, 300m, 200m, 100m ladder with full recovery. Felt strong today!",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        user: { username: "track_coach", name: "Coach Smith", profileImageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face" }
      },
      {
        id: 7,
        workoutId: 7,
        userId: 8,
        title: "Race Prep",
        previewText: "Final tuneup before Saturday's meet - 4x150m at race pace with 3min rest",
        createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
        user: { username: "medal_hunter", name: "James W.", profileImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face" }
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
  
  // Public Profile Routes - No auth required for viewing profiles
  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive information for public profiles
      const { password, ...publicProfile } = user;
      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:userId/meets", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userMeets = await dbStorage.getMeetsByUserId(userId);
      res.json(userMeets);
    } catch (error) {
      console.error("Error fetching user meets:", error);
      res.status(500).json({ message: "Failed to fetch user meets" });
    }
  });

  app.get("/api/users/:userId/latest-workout", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user?.id;
      
      // For now, return null since we don't have workout data structure
      res.json(null);
    } catch (error) {
      console.error("Error fetching latest workout:", error);
      res.status(500).json({ message: "Failed to fetch latest workout" });
    }
  });

  app.get("/api/users/:userId/programs", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const programs = await dbStorage.getAllPrograms();
      const userPrograms = programs.filter(program => program.userId === userId && program.visibility === 'public');
      res.json(userPrograms);
    } catch (error) {
      console.error("Error fetching user programs:", error);
      res.status(500).json({ message: "Failed to fetch user programs" });
    }
  });

  app.get("/api/users/:userId/connections", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await dbStorage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching user connections:", error);
      res.status(500).json({ message: "Failed to fetch user connections" });
    }
  });

  app.patch("/api/users/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user?.id;
      
      // Only allow users to update their own profile
      if (!req.isAuthenticated() || currentUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }

      const updates = req.body;
      const updatedUser = await dbStorage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive information
      const { password, ...publicProfile } = updatedUser;
      res.json(publicProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
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
      
      // Create meetData with proper field mapping
      const meetData = {
        name: rawData.name,
        date: rawData.date,
        location: rawData.location,
        coordinates: rawData.coordinates,
        events: rawData.events || [],
        warmupTime: rawData.warmupTime || 60,
        arrivalTime: rawData.arrivalTime || 90,
        websiteUrl: rawData.websiteUrl || null,
        userId: req.user!.id
      };
      
      console.log("Raw websiteUrl:", rawData.websiteUrl);
      console.log("Meet data to save:", meetData);
      
      // Create the meet using direct database insertion to ensure websiteUrl is saved
      const [meet] = await db.insert(meets).values(meetData).returning();
      
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

    try {
      const { search, page = "1" } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 10;
      const offset = (pageNum - 1) * limit;
      
      console.log(`Fetching athletes - Page: ${pageNum}, Search: ${search}`);
      
      // Get all users except the current user
      let allUsers = await dbStorage.getAllUsers();
      allUsers = allUsers.filter(user => user.id !== req.user.id);
      
      // Remove any potential duplicates by ID
      const uniqueUsers = new Map();
      allUsers.forEach(user => {
        uniqueUsers.set(user.id, user);
      });
      allUsers = Array.from(uniqueUsers.values());
      
      // Sort by newest first (highest ID)
      allUsers.sort((a, b) => b.id - a.id);
      
      // Apply search filter if provided
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        allUsers = allUsers.filter(user => 
          user.username.toLowerCase().includes(searchTerm) ||
          (user.name && user.name.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply pagination
      const total = allUsers.length;
      const users = allUsers.slice(offset, offset + limit);
      const hasMore = (pageNum * limit) < total;
      
      // Add follow status for each user
      const usersWithStatus = await Promise.all(
        users.map(async (user) => {
          try {
            const followStatus = await dbStorage.getFollowStatus(req.user.id, user.id);
            return {
              ...user,
              isFollowing: followStatus.isFollowing || false,
              isFollower: followStatus.isFollower || false
            };
          } catch (error) {
            return {
              ...user,
              isFollowing: false,
              isFollower: false
            };
          }
        })
      );
      
      console.log(`Found ${users.length} athletes on page ${pageNum}, total: ${total}, hasMore: ${hasMore}`);
      
      res.json({
        athletes: usersWithStatus,
        pagination: {
          page: pageNum,
          limit,
          total,
          hasMore
        }
      });
    } catch (error) {
      console.error("Error fetching athletes:", error);
      res.status(500).send("Error fetching athletes");
    }
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

  // Weather endpoint
  app.get("/api/weather", async (req: Request, res: Response) => {
    try {
      const { location, date } = req.query;
      
      if (!location || !date) {
        return res.status(400).json({ error: "Location and date are required" });
      }
      
      const weather = await getWeatherForecast(location as string, date as string);
      
      if (!weather) {
        return res.status(404).json({ error: "Weather data not available" });
      }
      
      res.json(weather);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
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
  // Athlete Profile Routes
  app.get("/api/athlete-profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profile = await dbStorage.getAthleteProfile(userId);
      return res.json(profile || null);
    } catch (err) {
      console.error("Error fetching athlete profile:", err);
      return res.status(500).json({ error: "Failed to fetch athlete profile" });
    }
  });

  app.post("/api/athlete-profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileData = insertAthleteProfileSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if profile already exists
      const existingProfile = await dbStorage.getAthleteProfile(userId);
      if (existingProfile) {
        return res.status(400).json({ error: "Profile already exists, use PATCH to update" });
      }

      const profile = await dbStorage.createAthleteProfile(profileData);
      return res.status(201).json(profile);
    } catch (err) {
      console.error("Error creating athlete profile:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      return res.status(500).json({ error: "Failed to create athlete profile" });
    }
  });

  app.patch("/api/athlete-profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profileData = req.body;
      const profile = await dbStorage.updateAthleteProfile(userId, profileData);

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      return res.json(profile);
    } catch (err) {
      console.error("Error updating athlete profile:", err);
      return res.status(500).json({ error: "Failed to update athlete profile" });
    }
  });

  // Public profile update route with image upload
  const profileUpload = multer({
    dest: 'uploads/profiles/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/user/public-profile", profileUpload.single('profileImage'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { name, bio } = req.body;
      let profileImageUrl = '';

      // Handle profile image upload
      if (req.file) {
        const fileName = `profile-${req.user!.id}-${Date.now()}${path.extname(req.file.originalname)}`;
        const finalPath = path.join('uploads/profiles', fileName);
        
        // Move file to final location
        fs.renameSync(req.file.path, finalPath);
        
        // Compress the profile image
        const compressedFileName = `compressed_${fileName}`;
        const compressedPath = path.join('uploads/profiles', compressedFileName);
        
        try {
          await compressImage(finalPath, compressedPath, 85);
          profileImageUrl = `/uploads/profiles/${compressedFileName}`;
        } catch (compressionError) {
          console.error('Profile image compression failed, using original:', compressionError);
          profileImageUrl = `/uploads/profiles/${fileName}`;
        }
      }

      // Update user profile
      const updateData: any = { name };
      if (bio !== undefined) updateData.bio = bio;
      if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

      const updatedUser = await dbStorage.updateUser(req.user!.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating public profile:", error);
      res.status(500).json({ error: "Failed to update public profile" });
    }
  });

  // Image upload endpoint for messages
  const messageImageUpload = multer({
    dest: 'uploads/messages/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/upload/image", messageImageUpload.single('image'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const fileName = `message-${req.user!.id}-${Date.now()}${path.extname(req.file.originalname)}`;
      const finalPath = path.join('uploads/messages', fileName);
      
      // Ensure the messages directory exists
      const messagesDir = path.join('uploads/messages');
      if (!fs.existsSync(messagesDir)) {
        fs.mkdirSync(messagesDir, { recursive: true });
      }
      
      // Move file to final location
      fs.renameSync(req.file.path, finalPath);
      
      // Compress the image for better performance
      const compressedFileName = `compressed_${fileName}`;
      const compressedPath = path.join('uploads/messages', compressedFileName);
      
      try {
        await sharp(finalPath)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toFile(compressedPath);
        
        // Remove original uncompressed file
        fs.unlinkSync(finalPath);
        
        const imageUrl = `/uploads/messages/${compressedFileName}`;
        res.json({ url: imageUrl });
      } catch (compressionError) {
        console.error('Message image compression failed, using original:', compressionError);
        const imageUrl = `/uploads/messages/${fileName}`;
        res.json({ url: imageUrl });
      }
    } catch (error) {
      console.error("Error uploading message image:", error);
      res.status(500).json({ error: "Failed to upload image" });
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
      
      let imageUrls: any = {};
      
      try {
        // Generate multiple optimized sizes
        const outputDir = path.dirname(req.file.path);
        const imageSizes = await generateImageSizes(req.file.path, filename, outputDir);
        
        imageUrls = {
          [`${fileType}Url`]: `/uploads/${imageSizes.original}`,
          [`${fileType}ThumbUrl`]: `/uploads/${imageSizes.thumb}`,
          [`${fileType}MediumUrl`]: `/uploads/${imageSizes.medium}`,
          [`${fileType}LargeUrl`]: `/uploads/${imageSizes.large}`,
        };
      } catch (compressionError) {
        console.error('Image size generation failed, using original:', compressionError);
        // Move file to permanent location and use original
        const newPath = path.join(uploadsDir, filename);
        fs.renameSync(req.file.path, newPath);
        
        imageUrls = {
          [`${fileType}Url`]: `/uploads/${filename}`,
        };
      }
      
      // Update the club in the database with all image sizes
      await dbStorage.updateClub(clubId, imageUrls);
      
      // Return the main file URL for compatibility
      const mainUrl = imageUrls[`${fileType}Url`];
      res.json({ fileUrl: mainUrl, imageUrls });
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

  // Award spikes for workout completion (with rate limiting)
  app.post("/api/practice/completion/:completionId/reward", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const completionId = parseInt(req.params.completionId);
      
      if (isNaN(completionId)) {
        return res.status(400).send("Invalid completion ID");
      }
      
      // Check daily workout completion reward limit (max 3 per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysWorkoutRewards = await dbStorage.getSpikeTransactionsBySourceAndDate(
        userId, 
        'workout_completion', 
        today, 
        tomorrow
      );
      
      if (todaysWorkoutRewards.length >= 3) {
        return res.status(429).json({ 
          error: "Daily workout completion reward limit reached",
          message: "You can only earn Spikes for 3 workout completions per day"
        });
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

  // Award spikes for creating a meet (with rate limiting)
  app.post("/api/meets/:meetId/reward", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const meetId = parseInt(req.params.meetId);
      
      if (isNaN(meetId)) {
        return res.status(400).send("Invalid meet ID");
      }
      
      // Check daily meet creation reward limit (max 2 per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysMeetRewards = await dbStorage.getSpikeTransactionsBySourceAndDate(
        userId, 
        'meet_creation', 
        today, 
        tomorrow
      );
      
      if (todaysMeetRewards.length >= 2) {
        return res.status(429).json({ 
          error: "Daily meet creation reward limit reached",
          message: "You can only earn Spikes for 2 meet creations per day"
        });
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

  // Exercise Library endpoints
  
  // Get user's exercise library with pagination
  app.get("/api/exercise-library", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 30;
      const offset = (page - 1) * limit;
      
      const exercises = await db
        .select()
        .from(exerciseLibrary)
        .where(eq(exerciseLibrary.userId, req.user!.id))
        .orderBy(sql`${exerciseLibrary.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
      
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(exerciseLibrary)
        .where(eq(exerciseLibrary.userId, req.user!.id));
      
      res.json({
        exercises,
        totalCount: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
        currentPage: page
      });
    } catch (error) {
      console.error("Error fetching exercise library:", error);
      res.status(500).send("Error fetching exercise library");
    }
  });

  // Check user's exercise library usage and limits
  app.get("/api/exercise-library/limits", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      const subscriptionTier = user.subscriptionTier || 'free';
      
      // Count current uploads and YouTube links
      const uploadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(exerciseLibrary)
        .where(and(
          eq(exerciseLibrary.userId, user.id),
          sql`${exerciseLibrary.fileUrl} IS NOT NULL`
        ));
      
      const youtubeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(exerciseLibrary)
        .where(and(
          eq(exerciseLibrary.userId, user.id),
          sql`${exerciseLibrary.youtubeUrl} IS NOT NULL`
        ));
      
      // Define limits based on subscription tier
      const limits = {
        free: { uploads: 10, youtube: 50 },
        pro: { uploads: 50, youtube: 100 },
        star: { uploads: -1, youtube: -1 } // -1 means unlimited
      };
      
      const tierLimits = limits[subscriptionTier as keyof typeof limits];
      
      res.json({
        uploads: {
          current: uploadCount[0].count,
          limit: tierLimits.uploads,
          canUpload: tierLimits.uploads === -1 || uploadCount[0].count < tierLimits.uploads
        },
        youtube: {
          current: youtubeCount[0].count,
          limit: tierLimits.youtube,
          canAdd: tierLimits.youtube === -1 || youtubeCount[0].count < tierLimits.youtube
        }
      });
    } catch (error) {
      console.error("Error checking exercise library limits:", error);
      res.status(500).send("Error checking exercise library limits");
    }
  });

  // Upload video/image to exercise library
  const exerciseUpload = multer({
    dest: "uploads/exercises/",
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow videos and images
      const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only video and image files are allowed'));
      }
    }
  });

  app.post("/api/exercise-library/upload", exerciseUpload.single('file'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }
      
      const user = req.user!;
      const { name, description, tags, isPublic } = req.body;
      
      // Check upload limits
      const subscriptionTier = user.subscriptionTier || 'free';
      const limits = {
        free: 10,
        pro: 50,
        star: -1 // unlimited
      };
      
      if (limits[subscriptionTier as keyof typeof limits] !== -1) {
        const uploadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(exerciseLibrary)
          .where(and(
            eq(exerciseLibrary.userId, user.id),
            eq(exerciseLibrary.type, 'upload')
          ));
        
        if (uploadCount[0].count >= limits[subscriptionTier as keyof typeof limits]) {
          // Delete uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ 
            error: "Upload limit reached",
            message: `${subscriptionTier} users can upload up to ${limits[subscriptionTier as keyof typeof limits]} files`
          });
        }
      }
      
      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const finalPath = path.join("uploads/exercises", uniqueFilename);
      
      // Move file to final location
      fs.renameSync(req.file.path, finalPath);
      
      // Create exercise entry
      const exerciseData: InsertExerciseLibrary = {
        userId: user.id,
        name: name || req.file.originalname,
        description: description || null,
        type: 'upload',
        fileUrl: `/uploads/exercises/${uniqueFilename}`,
        youtubeUrl: null,
        youtubeVideoId: null,
        thumbnailUrl: null,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isPublic: isPublic === 'true',
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : []
      };
      
      const [newExercise] = await db
        .insert(exerciseLibrary)
        .values(exerciseData)
        .returning();
      
      res.status(201).json(newExercise);
    } catch (error) {
      console.error("Error uploading exercise file:", error);
      if (req.file) {
        // Clean up uploaded file on error
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }
      res.status(500).send("Error uploading exercise file");
    }
  });

  // Add YouTube video to exercise library
  app.post("/api/exercise-library/youtube", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      const { name, description, youtubeUrl, tags, isPublic } = req.body;
      
      // Validate YouTube URL and extract video ID
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = youtubeUrl.match(youtubeRegex);
      
      if (!match) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      
      const videoId = match[1];
      
      // Check YouTube limits
      const subscriptionTier = user.subscriptionTier || 'free';
      const limits = {
        free: 50,
        pro: 100,
        star: -1 // unlimited
      };
      
      if (limits[subscriptionTier as keyof typeof limits] !== -1) {
        const youtubeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(exerciseLibrary)
          .where(and(
            eq(exerciseLibrary.userId, user.id),
            eq(exerciseLibrary.type, 'youtube')
          ));
        
        if (youtubeCount[0].count >= limits[subscriptionTier as keyof typeof limits]) {
          return res.status(403).json({ 
            error: "YouTube link limit reached",
            message: `${subscriptionTier} users can add up to ${limits[subscriptionTier as keyof typeof limits]} YouTube videos`
          });
        }
      }
      
      // Create exercise entry
      const exerciseData: InsertExerciseLibrary = {
        userId: user.id,
        name: name || `YouTube Video - ${videoId}`,
        description: description || null,
        type: 'youtube',
        fileUrl: null,
        youtubeUrl,
        youtubeVideoId: videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        fileSize: null,
        mimeType: null,
        isPublic: isPublic || false,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : []
      };
      
      const [newExercise] = await db
        .insert(exerciseLibrary)
        .values(exerciseData)
        .returning();
      
      res.status(201).json(newExercise);
    } catch (error) {
      console.error("Error adding YouTube video:", error);
      res.status(500).send("Error adding YouTube video");
    }
  });

  // Share exercise with connections/athletes
  app.post("/api/exercise-library/:exerciseId/share", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      const exerciseId = parseInt(req.params.exerciseId);
      const { toUserIds, message } = req.body;
      
      // Verify exercise exists and belongs to user
      const exercise = await db
        .select()
        .from(exerciseLibrary)
        .where(eq(exerciseLibrary.id, exerciseId))
        .limit(1);
      
      if (!exercise.length || exercise[0].userId !== user.id) {
        return res.status(404).send("Exercise not found");
      }
      
      // Create shares for each recipient
      const shares = [];
      for (const toUserId of toUserIds) {
        const shareData: InsertExerciseShare = {
          exerciseId,
          fromUserId: user.id,
          toUserId,
          message: message || null
        };
        
        const [newShare] = await db
          .insert(exerciseShares)
          .values(shareData)
          .returning();
        
        shares.push(newShare);
      }
      
      res.status(201).json(shares);
    } catch (error) {
      console.error("Error sharing exercise:", error);
      res.status(500).send("Error sharing exercise");
    }
  });

  // Get shared exercises received by user
  app.get("/api/exercise-library/shared", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 30;
      const offset = (page - 1) * limit;
      
      const sharedExercises = await db
        .select({
          id: exerciseShares.id,
          exercise: exerciseLibrary,
          fromUser: {
            id: sql`from_user.id`,
            username: sql`from_user.username`,
            name: sql`from_user.name`
          },
          message: exerciseShares.message,
          createdAt: exerciseShares.createdAt
        })
        .from(exerciseShares)
        .innerJoin(exerciseLibrary, eq(exerciseShares.exerciseId, exerciseLibrary.id))
        .innerJoin(sql`users as from_user`, sql`exercise_shares.from_user_id = from_user.id`)
        .where(eq(exerciseShares.toUserId, req.user!.id))
        .orderBy(sql`${exerciseShares.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
      
      res.json(sharedExercises);
    } catch (error) {
      console.error("Error fetching shared exercises:", error);
      res.status(500).send("Error fetching shared exercises");
    }
  });

  // Delete exercise from library
  app.delete("/api/exercise-library/:exerciseId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      const user = req.user!;
      
      // Get exercise to verify ownership and get file path
      const exercise = await db
        .select()
        .from(exerciseLibrary)
        .where(eq(exerciseLibrary.id, exerciseId))
        .limit(1);
      
      if (!exercise.length || exercise[0].userId !== user.id) {
        return res.status(404).send("Exercise not found");
      }
      
      // Delete file if it's an upload
      if (exercise[0].type === 'upload' && exercise[0].fileUrl) {
        const filePath = path.join(process.cwd(), exercise[0].fileUrl);
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error("Error deleting file:", fileError);
        }
      }
      
      // Delete from database
      await db
        .delete(exerciseLibrary)
        .where(eq(exerciseLibrary.id, exerciseId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(500).send("Error deleting exercise");
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
  // Get gym exercises for a specific session
  app.get("/api/sessions/:sessionId/gym-data", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const session = await dbStorage.getProgramSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // If session already has gym data, return it
      if (session.gymData && session.gymData.length > 0) {
        return res.json({ gymData: session.gymData });
      }

      // Get the program to check if it's from Google Sheets
      const program = await dbStorage.getProgram(session.programId);
      if (!program || !program.importedFromSheet || !program.googleSheetId) {
        return res.json({ gymData: [] });
      }

      // Check session fields for gym references
      const sheetsUtils = await import('./utils/sheets');
      const { containsGymReference, fetchGymData } = sheetsUtils;
      
      let gymData: string[] = [];
      const workoutFields = [
        session.shortDistanceWorkout,
        session.mediumDistanceWorkout, 
        session.longDistanceWorkout,
        session.preActivation1,
        session.preActivation2,
        session.extraSession
      ];

      for (const field of workoutFields) {
        if (field) {
          const gymCheck = containsGymReference(field);
          if (gymCheck.hasGym && gymCheck.gymNumber) {
            try {
              const exercises = await fetchGymData(program.googleSheetId, gymCheck.gymNumber);
              for (const exercise of exercises) {
                if (!gymData.includes(exercise)) {
                  gymData.push(exercise);
                }
              }
            } catch (error) {
              console.error(`Error fetching gym ${gymCheck.gymNumber}:`, error);
            }
          }
        }
      }

      // Update session with gym data if found
      if (gymData.length > 0) {
        await dbStorage.updateProgramSession(sessionId, { gymData });
        console.log(`Updated session ${sessionId} with ${gymData.length} gym exercises`);
      }

      res.json({ gymData });
    } catch (error) {
      console.error("Error fetching gym data:", error);
      res.status(500).json({ error: "Failed to fetch gym data" });
    }
  });

  app.get("/api/programs/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      
      if (isNaN(programId)) {
        return res.status(400).json({ error: "Invalid program ID" });
      }
      
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Debug logging for program 22
      if (programId === 22) {
        console.log(`Program ${programId} debug - isTextBased:`, program.isTextBased);
        console.log(`Program ${programId} debug - textContent:`, program.textContent);
        
        // Force cache busting for program 22
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
      
      // Check if user has access to this program
      if (program.userId !== req.user!.id && program.visibility !== 'public') {
        // For private or premium programs, check if user has purchased or has been assigned access
        const purchase = await dbStorage.getPurchasedProgram(req.user!.id, programId);
        const assignment = await dbStorage.getProgramAssignment(programId, req.user!.id);
        
        if (!purchase && !assignment) {
          return res.status(403).json({ error: "You don't have access to this program" });
        }
      }
      
      // Get program sessions
      let sessions = await dbStorage.getProgramSessions(programId);
      
      // Return sessions immediately without blocking on gym data processing
      
      // If we have no sessions but this is an imported Google Sheet, generate mock data
      if (sessions.length === 0 && program.importedFromSheet) {
        console.log("No sessions found for imported sheet, generating mock data");
        
        // Generate 10 sessions with sample data
        const mockSessions = [];
        for (let i = 1; i <= 10; i++) {
          const isRestDay = i % 3 === 0; // Every third day is a rest day
          
          // Following the specified Google Sheet structure:
          // Column A: date, B: pre-activation 1, C: pre-activation 2
          // D: 60/100m, E: 200m, F: 400m, G: extra session
          mockSessions.push({
            id: i,
            programId: programId,
            dayNumber: i,
            // Map to spreadsheet columns
            columnA: `2025-05-${i < 10 ? '0' + i : i}`, // Date in column A
            columnB: 'Warm up 10 min',                  // Pre-Activation 1 in column B
            columnC: 'Dynamic stretching',              // Pre-Activation 2 in column C
            columnD: isRestDay ? '' : 'Sprint intervals 5x100m',  // 60/100m sessions in column D
            columnE: isRestDay ? '' : '3x400m at race pace',      // 200m sessions in column E
            columnF: isRestDay ? '' : '1x800m tempo run',         // 400m sessions in column F
            columnG: i % 4 === 0 ? 'Evening recovery session' : '', // Extra sessions in column G
            // Include these for better display
            title: `Day ${i} Training`,
            description: isRestDay ? 'Rest and Recovery' : 'Training Session',
            isRestDay: isRestDay,
            createdAt: new Date().toISOString()
          });
          
          // Since we've already imported the program, 
          // let's also save these sessions to the database for future use
          try {
            await dbStorage.createProgramSession({
              programId,
              dayNumber: i,
              date: `2025-05-${i < 10 ? '0' + i : i}`,
              preActivation1: 'Warm up 10 min',
              preActivation2: 'Dynamic stretching',
              shortDistanceWorkout: isRestDay ? '' : 'Sprint intervals 5x100m',
              mediumDistanceWorkout: isRestDay ? '' : '3x400m at race pace',
              longDistanceWorkout: isRestDay ? '' : '1x800m tempo run',
              extraSession: i % 4 === 0 ? 'Evening recovery session' : '',
              isRestDay,
              title: `Day ${i} Training`,
              description: isRestDay ? 'Rest and Recovery' : 'Training Session',
            });
          } catch (err) {
            console.error("Error saving mock session:", err);
          }
        }
        
        sessions = mockSessions;
      }
      
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
        userId: req.user!.id,
        category: req.body.category || 'general',
        level: req.body.level || 'intermediate'
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
        category: req.body.category || 'general',
        level: req.body.level || 'intermediate',
        duration: parseInt(req.body.duration),
        visibility: req.body.visibility,
        price: req.body.price ? parseFloat(req.body.price) : 0,
        isUploadedProgram: true,  // Ensure this is set to true for uploaded documents
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
  
  // 3.2 Update program document
  app.put("/api/programs/:id/document", upload.single('programFile'), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      if (isNaN(programId)) {
        return res.status(400).json({ error: "Invalid program ID" });
      }
      
      // Check if the program exists and user has permission
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to update this program" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get file info
      const file = req.file;
      const fileUrl = `/uploads/programs/${file.filename}`;
      const fileType = file.mimetype;
      
      // Update the program with the document info
      const updatedProgram = await dbStorage.updateProgram(programId, {
        isUploadedProgram: true,
        programFileUrl: fileUrl,
        programFileType: fileType
      });
      
      res.status(200).json(updatedProgram);
    } catch (error) {
      console.error("Error updating program document:", error);
      res.status(500).json({ error: "Failed to update program document" });
    }
  });
  
  // 3.2 Import program from Google Sheet
  app.post("/api/programs/import-sheet", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { 
        title, 
        description, 
        googleSheetUrl, 
        category, 
        level, 
        visibility, 
        duration 
      } = req.body;
      
      // Extract sheet ID from the URL
      const urlPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = googleSheetUrl.match(urlPattern);
      
      if (!match || !match[1]) {
        return res.status(400).json({ error: "Invalid Google Sheet URL" });
      }
      
      const sheetId = match[1];
      
      // Try to fetch the sheet data (works for both public and private sheets with API key)
      let sheetData: any = null;
      
      try {
        // Import the sheets utility and fetch data
        const { fetchSpreadsheetData } = await import('./utils/sheets');
        console.log(`Attempting to fetch Google Sheet with ID: ${sheetId}`);
        sheetData = await fetchSpreadsheetData(sheetId);
        console.log(`Successfully fetched sheet data: ${sheetData.title} with ${sheetData.totalSessions} sessions`);
      } catch (err) {
        console.error("Failed to fetch Google Sheet data:", err);
        return res.status(400).json({ 
          error: "Failed to fetch Google Sheet data. Make sure your sheet is public or you've added a valid Google API key." 
        });
      }
      
      // Create program with sheet info
      const programData = {
        userId: req.user!.id,
        title: sheetData?.title || title,
        description: description || '',
        category,
        level,
        visibility,
        duration: parseInt(duration),
        importedFromSheet: true,
        googleSheetUrl,
        googleSheetId: sheetId,
        totalSessions: sheetData?.totalSessions || 10, // Use actual session count if available
      };
      
      // Create the program
      const createdProgram = await dbStorage.createProgram(programData);
      
      // Create sessions from the sheet data (we've verified it exists in the try/catch above)
      // Map each row in the spreadsheet to a program session
      for (const session of sheetData.sessions) {
        await dbStorage.createProgramSession({
          ...session,
          programId: createdProgram.id
        });
      }
      
      // Return success response
      res.status(201).json({
        program: createdProgram,
        importedSessions: sheetData.sessions.length,
        message: "Program created successfully with data from Google Sheet."
      });
    } catch (error: any) {
      console.error("Error importing program:", error);
      res.status(500).json({ error: error.message || "Failed to import program" });
    }
  });
  
  // 3.1 Refresh a program's spreadsheet data
  app.post("/api/programs/refresh-sheet/:id", async (req: Request, res: Response) => {
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
        return res.status(403).json({ error: "You don't have permission to refresh this program" });
      }
      
      // Verify the program is a Google Sheet import
      if (!program.importedFromSheet || !program.googleSheetId) {
        return res.status(400).json({ error: "This program is not linked to a Google Sheet" });
      }
      
      // Try to fetch the updated sheet data
      let sheetData: any = null;
      try {
        // Import the sheets utility and fetch fresh data
        const { fetchSpreadsheetData } = await import('./utils/sheets');
        console.log(`Refreshing Google Sheet with ID: ${program.googleSheetId}`);
        sheetData = await fetchSpreadsheetData(program.googleSheetId);
        console.log(`Successfully fetched updated sheet data: ${sheetData.title} with ${sheetData.sessions.length} sessions`);
      } catch (err) {
        console.error("Failed to fetch updated Google Sheet data:", err);
        return res.status(400).json({ 
          error: "Failed to fetch updated Google Sheet data. Make sure your sheet is public or you've added a valid Google API key." 
        });
      }
      
      // First, delete all existing sessions
      await dbStorage.deleteProgramSessions(programId);
      
      // Create new sessions from the updated sheet data
      for (const session of sheetData.sessions) {
        await dbStorage.createProgramSession({
          ...session,
          programId: programId
        });
      }
      
      // Return success response
      res.status(200).json({
        program,
        refreshedSessions: sheetData.sessions.length,
        message: "Program data refreshed successfully from Google Sheet."
      });
    } catch (error: any) {
      console.error("Error refreshing program data:", error);
      res.status(500).json({ error: error.message || "Failed to refresh program data" });
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
  
  // 4.1 Create a program session
  app.post("/api/programs/:id/sessions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      if (isNaN(programId)) {
        return res.status(400).json({ error: "Invalid program ID" });
      }
      
      // Get the program
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user is the owner of this program
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to add sessions to this program" });
      }
      
      // Create the session
      const sessionData = {
        ...req.body,
        programId
      };
      
      const newSession = await dbStorage.createProgramSession(sessionData);
      res.json(newSession);
    } catch (error) {
      console.error("Error creating program session:", error);
      res.status(500).json({ error: "Failed to create program session" });
    }
  });
  
  // 4.2 Update a program session
  app.put("/api/programs/:programId/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.programId);
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(programId) || isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid ID parameters" });
      }
      
      // Get the program
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user is the owner of this program
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to update sessions in this program" });
      }
      
      // Update the session
      // When moving sessions between days, we only need to update specific fields
      // This prevents issues with date formatting during updates
      const { dayNumber } = req.body;
      
      // If we're just updating the day number (for drag and drop), only send that field
      // Otherwise send the full update data
      const sessionData = dayNumber !== undefined && Object.keys(req.body).length <= 3
        ? { dayNumber, programId } // For drag and drop operations
        : { ...req.body, programId }; // For full updates
      
      console.log("Updating session with data:", sessionData);
      const updatedSession = await dbStorage.updateProgramSession(sessionId, sessionData);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating program session:", error);
      res.status(500).json({ error: "Failed to update program session" });
    }
  });
  
  // 4.3 Delete a program session
  app.delete("/api/programs/:programId/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.programId);
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(programId) || isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid ID parameters" });
      }
      
      // Get the program
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if user is the owner of this program
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to delete sessions in this program" });
      }
      
      // Delete the session
      await dbStorage.deleteProgramSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program session:", error);
      res.status(500).json({ error: "Failed to delete program session" });
    }
  });
  
  // Gym data endpoint using program and day number for frontend compatibility
  app.get('/api/programs/:programId/days/:dayNumber/gym-data', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const programId = parseInt(req.params.programId);
      const dayNumber = parseInt(req.params.dayNumber);
      
      if (!programId || !dayNumber) {
        return res.status(400).json({ error: "Invalid program ID or day number" });
      }

      // Get the program to access the Google Sheet
      const program = await dbStorage.getProgram(programId);
      if (!program || !program.googleSheetId) {
        return res.json({ gymData: [] });
      }

      // Get all sessions for this program to find the one with matching day number
      const allSessions = await dbStorage.getProgramSessions(programId);
      const session = allSessions.find(s => s.dayNumber === dayNumber);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Check session fields for gym references
      const sheetsUtils = await import('./utils/sheets');
      const { containsGymReference, fetchGymData } = sheetsUtils;
      
      let gymData: string[] = [];
      const workoutFields = [
        session.shortDistanceWorkout,
        session.mediumDistanceWorkout, 
        session.longDistanceWorkout,
        session.preActivation1,
        session.preActivation2,
        session.extraSession
      ];

      for (const field of workoutFields) {
        if (field) {
          const gymCheck = containsGymReference(field);
          if (gymCheck.hasGym && gymCheck.gymNumber) {
            try {
              const exercises = await fetchGymData(program.googleSheetId, gymCheck.gymNumber);
              for (const exercise of exercises) {
                if (!gymData.includes(exercise)) {
                  gymData.push(exercise);
                }
              }
              console.log(`Found ${exercises.length} exercises for Gym ${gymCheck.gymNumber} in day ${dayNumber}`);
            } catch (error) {
              console.error(`Error fetching gym ${gymCheck.gymNumber}:`, error);
            }
          }
        }
      }

      res.json({ gymData });
    } catch (error) {
      console.error("Error fetching gym data:", error);
      res.status(500).json({ error: "Failed to fetch gym data" });
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
      
      // Get both purchased programs and assigned programs
      const purchases = await dbStorage.getUserPurchasedPrograms(req.user!.id);
      const assignedPrograms = await dbStorage.getAssignedPrograms(req.user!.id);
      
      console.log('Assigned programs for user', req.user!.id, ':', assignedPrograms);
      
      // Transform assigned programs to match purchased programs format
      const filteredAssignments = assignedPrograms.filter(assignment => 
        assignment.status === 'accepted' || 
        (assignment.assignerId === req.user!.id && assignment.assigneeId === req.user!.id) // Show self-assignments regardless of status
      );
      
      console.log('Filtered assignments:', filteredAssignments);
      
      // Deduplicate assignments by programId, keeping the latest one
      const deduplicatedAssignments = filteredAssignments.reduce((acc, assignment) => {
        const existing = acc.find(a => a.programId === assignment.programId);
        if (!existing || assignment.assignedAt > existing.assignedAt) {
          acc = acc.filter(a => a.programId !== assignment.programId);
          acc.push(assignment);
        }
        return acc;
      }, [] as typeof filteredAssignments);
      
      console.log('Deduplicated assignments:', deduplicatedAssignments);
      
      const assignedAsPurchased = await Promise.all(
        deduplicatedAssignments
          .map(async (assignment) => {
            try {
              const program = await dbStorage.getProgram(assignment.programId);
              const assigner = await dbStorage.getUser(assignment.assignerId);
              
              if (!program) {
                console.error(`Program not found for assignment ${assignment.id}, programId: ${assignment.programId}`);
                return null;
              }
              
              return {
                id: `assigned-${assignment.id}`, // Prefix to avoid ID conflicts
                programId: assignment.programId,
                userId: req.user!.id,
                price: 0,
                isFree: true,
                purchasedAt: assignment.assignedAt,
                program: program,
                creator: {
                  username: assigner?.username || 'Unknown'
                },
                isAssigned: true, // Flag to indicate this is an assigned program
                assignerName: assigner?.username || 'Unknown Coach'
              };
            } catch (error) {
              console.error(`Error processing assignment ${assignment.id}:`, error);
              return null;
            }
          })
      ).then(results => results.filter(r => r !== null));
      
      console.log('Assigned as purchased after processing:', assignedAsPurchased);
      
      // Combine purchased and assigned programs
      const allPrograms = [...purchases, ...assignedAsPurchased];
      
      console.log('Final combined programs:', allPrograms);
      
      res.json(allPrograms);
    } catch (error) {
      console.error("Error fetching purchased programs:", error);
      res.status(500).json({ error: "Failed to fetch purchased programs" });
    }
  });
  
  // ============================================================
  // Stripe Payment Routes
  // ============================================================
  
  // Create payment intent for program purchase
  app.post("/api/programs/:id/create-payment-intent", async (req: Request, res: Response) => {
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
      
      // Check if program has a price set for Stripe
      if (!program.price || program.price <= 0 || program.priceType !== 'money') {
        return res.status(400).json({ error: "This program is not available for purchase with Stripe" });
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(program.price * 100), // Convert to cents
        currency: "usd",
        metadata: {
          programId: programId.toString(),
          userId: req.user!.id.toString(),
          programTitle: program.title,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Confirm payment and complete purchase
  app.post("/api/programs/:id/confirm-payment", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }
      
      const programId = parseInt(req.params.id);
      
      // Retrieve payment intent from Stripe to verify payment
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }
      
      // Verify the payment is for this program and user
      if (
        paymentIntent.metadata.programId !== programId.toString() ||
        paymentIntent.metadata.userId !== req.user!.id.toString()
      ) {
        return res.status(400).json({ error: "Payment verification failed" });
      }
      
      // Check if purchase already exists (prevent double processing)
      const existingPurchase = await dbStorage.getPurchasedProgram(req.user!.id, programId);
      if (existingPurchase) {
        return res.status(400).json({ error: "Program already purchased" });
      }
      
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Record the purchase
      const purchase = await dbStorage.purchaseProgram({
        programId,
        userId: req.user!.id,
        price: Math.round(paymentIntent.amount / 100), // Convert back from cents
        isFree: false
      });
      
      res.status(201).json({ purchase, paymentIntent: paymentIntent.id });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Error confirming payment: " + error.message });
    }
  });

  // 7. Purchase a program (Spikes-based)
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
  
  // 7.1 Get potential assignees for a program (club members, athletes, etc.)
  app.get("/api/programs/:id/potential-assignees", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Only the creator can assign programs
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "Only the creator can assign this program" });
      }
      
      // Get users from clubs where this user is an admin/coach
      const clubMembers = await dbStorage.getCoachableUsers(req.user!.id);
      
      // Get coach's athletes (if user is a coach)
      const coachAthletes = req.user!.isCoach ? await dbStorage.getCoachAthletes(req.user!.id) : [];
      
      // Combine both lists and remove duplicates
      const allPotentialAssignees = [...clubMembers];
      coachAthletes.forEach(athlete => {
        if (!allPotentialAssignees.find(member => member.id === athlete.id)) {
          allPotentialAssignees.push(athlete);
        }
      });
      
      // Filter out users who already have this program assigned
      const existingAssignees = await dbStorage.getProgramAssignees(programId);
      const existingAssigneeIds = existingAssignees.map(a => a.assigneeId);
      
      const eligibleAssignees = allPotentialAssignees.filter(member => 
        !existingAssigneeIds.includes(member.id) && 
        member.id !== req.user!.id
      );
      
      res.json(eligibleAssignees);
    } catch (error) {
      console.error("Error fetching potential assignees:", error);
      res.status(500).json({ error: "Failed to fetch potential assignees" });
    }
  });
  
  // 7.2 Assign a program to a user
  app.post("/api/programs/:id/assign", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const { assigneeId, notes } = req.body;
      
      if (!assigneeId) {
        return res.status(400).json({ error: "Assignee ID is required" });
      }
      
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Only the creator can assign programs
      if (program.userId !== req.user!.id) {
        return res.status(403).json({ error: "Only the creator can assign this program" });
      }
      
      // Check if the assignee is eligible (in same club/group or a coached athlete)
      const clubMembers = await dbStorage.getCoachableUsers(req.user!.id);
      const coachAthletes = req.user!.isCoach ? await dbStorage.getCoachAthletes(req.user!.id) : [];
      
      const isClubMember = clubMembers.some(member => member.id === assigneeId);
      const isCoachAthlete = coachAthletes.some(athlete => athlete.id === assigneeId);
      
      if (!isClubMember && !isCoachAthlete) {
        return res.status(403).json({ error: "You can only assign programs to your club members or athletes" });
      }
      
      // Check if already assigned
      const existingAssignment = await dbStorage.getProgramAssignment(programId, assigneeId);
      if (existingAssignment) {
        return res.status(400).json({ error: "Program is already assigned to this user" });
      }
      
      // Create assignment
      const assignment = await dbStorage.createProgramAssignment({
        programId,
        assignerId: req.user!.id,
        assigneeId,
        notes: notes || "",
        status: "pending"
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning program:", error);
      res.status(500).json({ error: "Failed to assign program" });
    }
  });
  
  // 7.2.1 Self-assign a program (assign to yourself)
  app.post("/api/programs/:id/self-assign", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const programId = parseInt(req.params.id);
      const { notes } = req.body;
      const userId = req.user!.id;
      
      const program = await dbStorage.getProgram(programId);
      
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      
      // Check if already assigned
      const existingAssignment = await dbStorage.getProgramAssignment(programId, userId);
      if (existingAssignment) {
        return res.status(400).json({ error: "You've already started this program" });
      }
      
      // Create assignment (self-assigned)
      const assignment = await dbStorage.createProgramAssignment({
        programId,
        assigneeId: userId,
        assignerId: userId, // Self-assigned
        notes: notes || 'Self-assigned program',
        status: "accepted"  // Auto-activate for self-assignments
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error self-assigning program:", error);
      res.status(500).json({ error: "Failed to start program" });
    }
  });
  
  // 7.3 Get programs assigned to the current user
  app.get("/api/assigned-programs", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const assignedPrograms = await dbStorage.getAssignedPrograms(req.user!.id);
      
      // For each assigned program, fetch the full program details and assigner info
      const enrichedAssignments = await Promise.all(
        assignedPrograms.map(async (assignment) => {
          const program = await dbStorage.getProgram(assignment.programId);
          const assigner = await dbStorage.getUser(assignment.assignerId);
          
          return {
            ...assignment,
            program,
            assigner: assigner ? {
              id: assigner.id,
              username: assigner.username,
              name: assigner.name
            } : null
          };
        })
      );
      
      res.json(enrichedAssignments);
    } catch (error) {
      console.error("Error fetching assigned programs:", error);
      res.status(500).json({ error: "Failed to fetch assigned programs" });
    }
  });
  
  // 7.4 Update the status of an assigned program
  app.patch("/api/program-assignments/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const assignmentId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      // Fetch the assignment to check permissions
      const assignments = await dbStorage.getAssignedPrograms(req.user!.id);
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found or you don't have access to it" });
      }
      
      // Update the assignment
      const updates: Partial<ProgramAssignment> = {};
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      
      // If marking as completed, set completedAt
      if (status === 'completed') {
        updates.completedAt = new Date();
      }
      
      const updatedAssignment = await dbStorage.updateProgramAssignment(assignmentId, updates);
      
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating program assignment:", error);
      res.status(500).json({ error: "Failed to update program assignment" });
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

  // Journal API routes
  app.get('/api/journal', getUserJournalEntries);
  app.post('/api/journal', createJournalEntry);
  app.put('/api/journal/:id', updateJournalEntry);
  app.delete('/api/journal/:id', deleteJournalEntry);
  
  // Use the standard journal entry endpoint for the basic save operation
  // Meet Invitations API
  app.get("/api/meet-invitations", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const invitations = await db
        .select({
          id: meetInvitations.id,
          meetId: meetInvitations.meetId,
          inviterId: meetInvitations.inviterId,
          inviteeId: meetInvitations.inviteeId,
          status: meetInvitations.status,
          message: meetInvitations.message,
          createdAt: meetInvitations.createdAt,
          respondedAt: meetInvitations.respondedAt,
          meet: {
            id: meets.id,
            name: meets.name,
            date: meets.date,
            location: meets.location,
            events: meets.events,
            status: meets.status,
          },
          inviter: {
            id: users.id,
            name: users.name,
            username: users.username,
          },
        })
        .from(meetInvitations)
        .leftJoin(meets, eq(meetInvitations.meetId, meets.id))
        .leftJoin(users, eq(meetInvitations.inviterId, users.id))
        .where(eq(meetInvitations.inviteeId, req.user.id))
        .orderBy(desc(meetInvitations.createdAt));

      res.json(invitations);
    } catch (error) {
      console.error("Error fetching meet invitations:", error);
      res.status(500).json({ error: "Failed to fetch meet invitations" });
    }
  });

  app.post("/api/meet-invitations", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { meetId, inviteeId, message } = req.body;
      
      // Verify the user owns the meet
      const meet = await db
        .select()
        .from(meets)
        .where(and(eq(meets.id, meetId), eq(meets.userId, req.user.id)))
        .limit(1);

      if (meet.length === 0) {
        return res.status(403).json({ error: "You can only invite to your own meets" });
      }

      // Check if invitation already exists
      const existingInvitation = await db
        .select()
        .from(meetInvitations)
        .where(
          and(
            eq(meetInvitations.meetId, meetId),
            eq(meetInvitations.inviteeId, inviteeId)
          )
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        return res.status(400).json({ error: "Invitation already sent to this user" });
      }

      const [invitation] = await db
        .insert(meetInvitations)
        .values({
          meetId,
          inviteeId,
          message,
          inviterId: req.user.id,
        })
        .returning();

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating meet invitation:", error);
      res.status(500).json({ error: "Failed to create meet invitation" });
    }
  });

  app.patch("/api/meet-invitations/:id", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      // Verify the user is the invitee
      const invitation = await db
        .select()
        .from(meetInvitations)
        .where(
          and(
            eq(meetInvitations.id, parseInt(id)),
            eq(meetInvitations.inviteeId, req.user.id),
            eq(meetInvitations.status, "pending")
          )
        )
        .limit(1);

      if (invitation.length === 0) {
        return res.status(404).json({ error: "Invitation not found or already responded" });
      }

      // Update invitation status
      const [updatedInvitation] = await db
        .update(meetInvitations)
        .set({
          status,
          respondedAt: new Date(),
        })
        .where(eq(meetInvitations.id, parseInt(id)))
        .returning();

      // If accepted, duplicate the meet for the invitee
      if (status === "accepted") {
        const originalMeet = await db
          .select()
          .from(meets)
          .where(eq(meets.id, invitation[0].meetId))
          .limit(1);

        if (originalMeet.length > 0) {
          await db.insert(meets).values({
            userId: req.user.id,
            name: originalMeet[0].name,
            date: originalMeet[0].date,
            location: originalMeet[0].location,
            coordinates: originalMeet[0].coordinates,
            events: originalMeet[0].events,
            warmupTime: originalMeet[0].warmupTime,
            arrivalTime: originalMeet[0].arrivalTime,
            status: originalMeet[0].status,
            isCoachAssigned: false,
          });
        }
      }

      res.json(updatedInvitation);
    } catch (error) {
      console.error("Error updating meet invitation:", error);
      res.status(500).json({ error: "Failed to update meet invitation" });
    }
  });

  app.post('/api/journal/basic-save', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "You must be logged in to create journal entries" });
      }
      
      const { userId, title, notes, moodRating, shortWorkout, mediumWorkout, longWorkout } = req.body;
      
      // Validate required fields
      if (!userId || !title) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create a content object that will be stored as JSON
      const contentObject = {
        moodRating: moodRating || 5,
        shortDistanceWorkout: shortWorkout || null,
        mediumDistanceWorkout: mediumWorkout || null,
        longDistanceWorkout: longWorkout || null,
        date: new Date().toISOString()
      };
      
      // Use the Drizzle ORM to create the journal entry
      const newEntry = await dbStorage.createJournalEntry({
        userId: userId,
        title: title,
        notes: notes || 'Completed workout session',
        type: 'training',
        content: contentObject,
        isPublic: true
      });
      
      console.log('Successfully saved journal entry:', newEntry);
      
      return res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      return res.status(500).json({ message: "Failed to create journal entry", error: String(error) });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll assume any authenticated user can access admin features
    // You can add an isAdmin field to users table later
    
    try {
      const { search } = req.query;
      if (!search || typeof search !== 'string' || search.length < 2) {
        return res.status(400).json({ message: "Search term must be at least 2 characters" });
      }
      
      const users = await dbStorage.searchUsers(search);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Error searching users" });
    }
  });

  app.post("/api/admin/users/:id/block", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle block status
      await dbStorage.updateUser(userId, { isBlocked: !user.isBlocked });
      res.json({ message: `User ${user.isBlocked ? 'unblocked' : 'blocked'} successfully` });
    } catch (error) {
      console.error("Error updating user block status:", error);
      res.status(500).json({ message: "Error updating user status" });
    }
  });

  app.post("/api/admin/users/:id/delete", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      await dbStorage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  app.post("/api/admin/users/:id/reset", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate a secure reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store reset token in database
      await db.insert(passwordResetTokens).values({
        userId: userId,
        token: resetToken,
        expiresAt: expiresAt,
        used: false
      });
      
      // In a real app, you would send an email here
      // For now, just log the reset link
      console.log(`Password reset link for ${user.email}: /reset-password/${resetToken}`);
      
      res.json({ message: "Password reset initiated. Reset link has been generated." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  });



  app.post("/api/admin/users/:id/reset", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.id);
      const newPassword = await dbStorage.resetUserPassword(userId);
      res.json({ message: "Password reset successfully", newPassword });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  app.post("/api/admin/users/:id/spikes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      await dbStorage.addSpikes(userId, amount, 'Admin grant');
      res.json({ message: `${amount} spikes added successfully` });
    } catch (error) {
      console.error("Error adding spikes:", error);
      res.status(500).json({ message: "Error adding spikes" });
    }
  });

  app.post("/api/admin/users/:id/subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.id);
      const { tier } = req.body;
      
      if (!tier || !['free', 'pro', 'star'].includes(tier)) {
        return res.status(400).json({ message: "Valid subscription tier is required" });
      }
      
      await dbStorage.updateUserSubscription(userId, tier);
      res.json({ message: `Subscription updated to ${tier} successfully` });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Error updating subscription" });
    }
  });

  // Sprinthia AI API Routes
  app.get("/api/sprinthia/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversations = await dbStorage.getSprinthiaConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/sprinthia/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { title } = req.body;
      const conversation = await dbStorage.createSprinthiaConversation({
        userId: req.user!.id,
        title: title || "New Conversation"
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/sprinthia/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await dbStorage.getSprinthiaMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/sprinthia/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      // Check if user has enough prompts
      const user = req.user!;
      if (user.sprinthiaPrompts <= 0) {
        return res.status(403).json({ error: "No prompts remaining. Purchase more to continue using Sprinthia." });
      }

      // Save user message
      const userMessage = await dbStorage.createSprinthiaMessage({
        conversationId,
        role: "user",
        content,
        promptCost: 1
      });

      // Generate AI response using OpenAI
      const { getChatCompletion } = await import("./openai");
      
      const sprinthiaPrompt = `You are Sprinthia, an expert AI coach specializing in track and field events (track events only - sprints, middle distance, and long distance running). You help athletes with workout creation, race planning and strategy, general training questions, rehabilitation advice, and nutrition guidance specifically for track athletes.

Keep your responses focused, practical, and encouraging. Provide specific, actionable advice based on current best practices in track and field training.

User message: ${content}`;

      const aiResponse = await getChatCompletion(sprinthiaPrompt);

      // Save AI response
      const assistantMessage = await dbStorage.createSprinthiaMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        promptCost: 0
      });

      // Deduct one prompt from user
      await dbStorage.updateUserPrompts(user.id, user.sprinthiaPrompts - 1);

      // Return both messages
      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.delete("/api/sprinthia/conversations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversationId = parseInt(req.params.id);
      await dbStorage.deleteSprinthiaConversation(conversationId, req.user!.id);
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Get user's conversation history
  app.get("/api/sprinthia/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversations = await dbStorage.getSprinthiaConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a specific conversation
  app.get("/api/sprinthia/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await dbStorage.getSprinthiaMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Simplified chat endpoint for the new interface
  app.post("/api/sprinthia/chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { message, conversationId } = req.body;
      const user = req.user!;
      
      // Check if user has enough prompts (Star users get unlimited)
      if (user.subscriptionTier !== 'star' && (!user.sprinthiaPrompts || user.sprinthiaPrompts <= 0)) {
        return res.status(403).json({ error: "No prompts remaining. Purchase more to continue using Sprinthia." });
      }

      let currentConversationId = conversationId;
      
      // Create new conversation if none exists
      if (!currentConversationId) {
        const conversation = await dbStorage.createSprinthiaConversation({
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : "")
        });
        currentConversationId = conversation.id;
      }

      // Save user message
      await dbStorage.createSprinthiaMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message,
        promptCost: 1
      });

      // Fetch user's program context for AI
      let programContext = "";
      try {
        const programs = await dbStorage.getPrograms(user.id);
        const assignedPrograms = await dbStorage.getAssignedPrograms(user.id);
        
        if (programs.length > 0 || assignedPrograms.length > 0) {
          programContext = "ATHLETE'S CURRENT PROGRAMS:\n";
          
          // Add owned programs
          for (const program of programs.slice(0, 2)) { // Limit to 2 most recent
            const sessions = await dbStorage.getProgramSessions(program.id);
            const recentSessions = sessions.slice(-5); // Last 5 sessions
            
            programContext += `\nProgram: ${program.title} (${program.category}, ${program.level})\n`;
            programContext += `Duration: ${program.duration} weeks, Total Sessions: ${program.totalSessions}\n`;
            if (program.description) programContext += `Description: ${program.description}\n`;
            
            if (recentSessions.length > 0) {
              programContext += "Recent Sessions:\n";
              recentSessions.forEach(session => {
                programContext += `- Day ${session.dayNumber}: ${session.title || 'Training Session'}\n`;
                if (session.shortDistanceWorkout) programContext += `  Sprint: ${session.shortDistanceWorkout}\n`;
                if (session.mediumDistanceWorkout) programContext += `  Mid-Distance: ${session.mediumDistanceWorkout}\n`;
                if (session.longDistanceWorkout) programContext += `  Distance: ${session.longDistanceWorkout}\n`;
                if (session.preActivation1 || session.preActivation2) {
                  programContext += `  Activation: ${[session.preActivation1, session.preActivation2].filter(Boolean).join(', ')}\n`;
                }
                if (session.extraSession) programContext += `  Extra: ${session.extraSession}\n`;
              });
            }
          }
          
          // Add assigned programs
          for (const assignment of assignedPrograms.slice(0, 2)) {
            const program = await dbStorage.getProgram(assignment.programId);
            if (program) {
              programContext += `\nAssigned Program: ${program.title} (by coach)\n`;
              programContext += `Category: ${program.category}, Level: ${program.level}\n`;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching program context:", error);
      }

      // Generate AI response using enhanced OpenAI integration
      const { getChatCompletion } = await import("./openai");
      
      const aiResponse = await getChatCompletion(message, programContext);

      // Save AI response
      await dbStorage.createSprinthiaMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: aiResponse,
        promptCost: 0
      });

      // Deduct prompt from user (unless they're Star tier)
      if (user.subscriptionTier !== 'star') {
        await dbStorage.updateUserPrompts(user.id, user.sprinthiaPrompts - 1);
      }

      res.json({ 
        conversationId: currentConversationId,
        response: aiResponse 
      });
    } catch (error) {
      console.error("Error in Sprinthia chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Spike purchase routes for Sprinthia prompts
  app.post("/api/purchase/prompts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { package: packageType } = req.body;
      const user = req.user!;
      
      let cost = 0;
      let prompts = 0;
      
      switch (packageType) {
        case "small":
          cost = 100; // 100 spikes for 10 prompts
          prompts = 10;
          break;
        case "medium":
          cost = 250; // 250 spikes for 30 prompts (better value)
          prompts = 30;
          break;
        case "large":
          cost = 500; // 500 spikes for 75 prompts (best value)
          prompts = 75;
          break;
        default:
          return res.status(400).json({ error: "Invalid package type" });
      }
      
      if (user.spikes < cost) {
        return res.status(403).json({ error: "Not enough spikes to purchase this package" });
      }
      
      // Deduct spikes and add prompts
      await dbStorage.deductSpikesFromUser(user.id, cost, 'prompt_purchase', null, `Purchased ${prompts} Sprinthia prompts`);
      await dbStorage.updateUserPrompts(user.id, user.sprinthiaPrompts + prompts);
      
      res.json({ message: `Successfully purchased ${prompts} prompts for ${cost} spikes` });
    } catch (error) {
      console.error("Error purchasing prompts:", error);
      res.status(500).json({ error: "Failed to purchase prompts" });
    }
  });

  // Workout Reactions API
  app.get("/api/sessions/:sessionId/reactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).send("Invalid session ID");
      }
      
      const reactions = await dbStorage.getSessionReactions(sessionId);
      const userReaction = await dbStorage.getWorkoutReaction(req.user!.id, sessionId);
      
      res.json({
        ...reactions,
        userReaction: userReaction?.reactionType || null
      });
    } catch (error) {
      console.error("Error fetching session reactions:", error);
      res.status(500).send("Error fetching session reactions");
    }
  });

  app.post("/api/sessions/:sessionId/react", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { reactionType } = req.body;
      
      if (isNaN(sessionId)) {
        return res.status(400).send("Invalid session ID");
      }
      
      if (!['like', 'dislike'].includes(reactionType)) {
        return res.status(400).send("Invalid reaction type");
      }
      
      const reaction = await dbStorage.createOrUpdateWorkoutReaction({
        userId: req.user!.id,
        sessionId,
        reactionType
      });
      
      res.json(reaction);
    } catch (error) {
      console.error("Error creating reaction:", error);
      res.status(500).send("Error creating reaction");
    }
  });

  app.delete("/api/sessions/:sessionId/react", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).send("Invalid session ID");
      }
      
      const success = await dbStorage.deleteWorkoutReaction(req.user!.id, sessionId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).send("Reaction not found");
      }
    } catch (error) {
      console.error("Error deleting reaction:", error);
      res.status(500).send("Error deleting reaction");
    }
  });

  // Notifications API
  app.get("/api/notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await dbStorage.getNotifications(req.user!.id, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).send("Error fetching notifications");
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notification = await dbStorage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).send("Error creating notification");
    }
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).send("Invalid notification ID");
      }
      
      // Direct SQL update with detailed logging
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, req.user.id]
      );
      console.log(`Updated notification ${notificationId} for user ${req.user.id}:`, result.rows);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).send("Error marking notification as read");
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const success = await dbStorage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).send("Error marking all notifications as read");
    }
  });

  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).send("Invalid notification ID");
      }
      
      const success = await dbStorage.deleteNotification(notificationId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).send("Notification not found");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).send("Error deleting notification");
    }
  });

  // Program assignment endpoint
  app.post("/api/assign-program", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { programId, assigneeId, notes } = req.body;
      const assignerId = req.user.id;

      // Validate required fields
      if (!programId || !assigneeId) {
        return res.status(400).json({ error: "Program ID and assignee ID are required" });
      }

      // Get program details
      const program = await dbStorage.getProgram(programId);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }

      // Check if user has permission to assign this program
      if (program.userId !== assignerId) {
        return res.status(403).json({ error: "You don't have permission to assign this program" });
      }

      // Create program assignment
      // Auto-accept if assigning to yourself
      const status = assigneeId === assignerId ? 'accepted' : 'pending';
      
      const assignment = await dbStorage.createProgramAssignment({
        programId,
        assigneeId,
        assignerId,
        notes,
        status
      });

      // Create notification for the assignee
      await dbStorage.createNotification({
        userId: assigneeId,
        type: "program_assigned",
        title: "New Program Assigned",
        message: `You have been assigned the program "${program.title}"`,
        actionUrl: "/programs?tab=purchased",
        isRead: false
      });

      res.json({ 
        success: true, 
        message: "Program assigned successfully",
        assignment
      });
    } catch (error) {
      console.error("Error assigning program:", error);
      res.status(500).json({ error: "Failed to assign program" });
    }
  });

  // Rehab API endpoints
  app.post("/api/rehab/assign-program", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { programType, programData } = req.body;
      const userId = req.user.id;

      // Create a notification for program assignment
      await dbStorage.createNotification({
        userId,
        type: "program_assigned",
        title: "Rehabilitation Program Assigned",
        message: `Your ${programData.title} has been assigned and will guide your recovery.`,
        actionUrl: "/assigned-programs",
        isRead: false
      });

      res.json({ 
        success: true, 
        message: "Rehab program assigned successfully",
        programType,
        title: programData.title
      });
    } catch (error) {
      console.error("Error assigning rehab program:", error);
      res.status(500).send("Error assigning rehab program");
    }
  });

  app.post("/api/rehab/ai-consultation", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { query } = req.body;
      const userId = req.user.id;
      const user = req.user;

      // Check if user has access (Star subscription or enough spikes)
      const isStarUser = user.isPremium; // Using existing premium field as proxy for Star
      const hasEnoughSpikes = (user.spikes || 0) >= 50;

      if (!isStarUser && !hasEnoughSpikes) {
        return res.status(403).json({ 
          error: "Insufficient access. Requires Star subscription or 50 Spikes." 
        });
      }

      // Deduct spikes if not Star user
      if (!isStarUser) {
        await dbStorage.updateUserSpikes(userId, (user.spikes || 0) - 50);
      }

      // Use OpenAI to generate personalized rehab guidance
      const { getChatCompletion } = await import("./openai");
      
      const aiPrompt = `You are a sports medicine expert and rehabilitation specialist. A track and field athlete has described their injury and symptoms as follows:

"${query}"

Please provide:
1. A brief assessment of the likely issue
2. Recommended immediate actions
3. A 4-week progressive rehabilitation plan with specific exercises
4. Warning signs to watch for
5. Return-to-sport criteria

Keep the response professional, evidence-based, and specific to track and field athletes. Always recommend consulting healthcare professionals for serious injuries.`;

      const aiResponse = await getChatCompletion(aiPrompt);

      // Create a notification about the AI consultation
      await dbStorage.createNotification({
        userId,
        type: "ai_consultation",
        title: "AI Rehabilitation Consultation Complete",
        message: "Your personalized rehab program has been generated and assigned.",
        actionUrl: "/rehab",
        isRead: false
      });

      // Schedule follow-up notifications for progress tracking
      setTimeout(async () => {
        await dbStorage.createNotification({
          userId,
          type: "rehab_checkin",
          title: "Rehabilitation Progress Check",
          message: "How is your recovery progressing? Tap to update your status.",
          actionUrl: "/rehab",
          isRead: false
        });
      }, 24 * 60 * 60 * 1000); // 24 hours later

      res.json({ 
        success: true, 
        consultation: aiResponse,
        spikesUsed: !isStarUser ? 50 : 0
      });
    } catch (error) {
      console.error("Error processing AI consultation:", error);
      res.status(500).send("Error processing consultation");
    }
  });
  
  // Coaching Request API
  app.post("/api/coaching-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const validatedData = insertCoachingRequestSchema.parse(req.body);
      
      // Check if there's already a pending request between these users
      const hasExisting = await dbStorage.hasExistingCoachingRequest(
        validatedData.fromUserId,
        validatedData.toUserId
      );
      
      if (hasExisting) {
        return res.status(400).json({ error: "A coaching request already exists between these users" });
      }
      
      const coachingRequest = await dbStorage.createCoachingRequest(validatedData);
      
      // Create notification for the recipient
      await dbStorage.createNotification({
        userId: validatedData.toUserId,
        type: "coaching_request",
        title: validatedData.type === 'coach_invite' ? "Coach Invitation" : "Coaching Request",
        message: validatedData.type === 'coach_invite' 
          ? "You've been invited to join as an athlete"
          : "Someone has requested your coaching",
        actionUrl: "/profile",
        isRead: false
      });
      
      res.json(coachingRequest);
    } catch (error) {
      console.error("Error creating coaching request:", error);
      res.status(500).send("Error creating coaching request");
    }
  });

  app.get("/api/coaching-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const received = await dbStorage.getCoachingRequests(req.user.id);
      const sent = await dbStorage.getSentCoachingRequests(req.user.id);
      
      res.json({ received, sent });
    } catch (error) {
      console.error("Error fetching coaching requests:", error);
      res.status(500).send("Error fetching coaching requests");
    }
  });

  app.post("/api/coaching-requests/:id/respond", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updatedRequest = await dbStorage.respondToCoachingRequest(requestId, status);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error responding to coaching request:", error);
      res.status(500).send("Error responding to coaching request");
    }
  });

  app.delete("/api/coaching-requests/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const requestId = parseInt(req.params.id);
      await dbStorage.deleteCoachingRequest(requestId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting coaching request:", error);
      res.status(500).send("Error deleting coaching request");
    }
  });

  // Get user by ID for direct messaging
  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const userId = parseInt(req.params.userId);
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send("Error fetching user");
    }
  });

  // Direct Messages API
  app.get("/api/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const conversations = await dbStorage.getUserConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).send("Error fetching conversations");
    }
  });

  app.get("/api/conversations/:conversationId/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const conversationId = parseInt(req.params.conversationId);
      const messages = await dbStorage.getConversationMessages(conversationId, req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Error fetching messages");
    }
  });

  // Get direct messages between current user and another user
  app.get("/api/direct-messages/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await dbStorage.getDirectMessagesBetweenUsers(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).send("Error fetching direct messages");
    }
  });

  // Send direct message
  app.post("/api/direct-messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { receiverId, content } = req.body;
      const message = await dbStorage.sendMessage({
        senderId: req.user.id,
        receiverId,
        content
      });
      res.json(message);
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).send("Error sending direct message");
    }
  });

  // Mark messages as read
  app.patch("/api/direct-messages/:userId/mark-read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const otherUserId = parseInt(req.params.userId);
      await dbStorage.markMessagesAsRead(req.user.id, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).send("Error marking messages as read");
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { participantId } = req.body;
      const conversation = await dbStorage.createOrGetConversation(req.user.id, participantId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).send("Error creating conversation");
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { conversationId, content } = req.body;
      const message = await dbStorage.sendMessage({
        conversationId,
        senderId: req.user.id,
        content
      });
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).send("Error sending message");
    }
  });

  // Following/Followers API
  app.post("/api/follow/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const receiverId = parseInt(req.params.userId);
      if (isNaN(receiverId)) return res.status(400).send("Invalid user ID");

      // Check if already following
      const followStatus = await dbStorage.getFollowStatus(req.user.id, receiverId);
      if (followStatus.isFollowing) {
        return res.status(400).send("Already following this user");
      }

      // Skip duplicate check for now to make friend requests work immediately
      // TODO: Add proper duplicate checking later

      // Send friend request notification
      await notificationSystem.sendFriendRequestNotification(
        receiverId, 
        req.user.id, 
        req.user.username
      );

      res.status(201).json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).send("Error sending friend request");
    }
  });

  // Accept friend request
  app.post("/api/friend-request/accept/:fromUserId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const fromUserId = parseInt(req.params.fromUserId);
      if (isNaN(fromUserId)) return res.status(400).send("Invalid user ID");

      // Create the mutual follow relationship
      await dbStorage.followUser(fromUserId, req.user.id);
      await dbStorage.followUser(req.user.id, fromUserId);

      // Remove the friend request notification
      await dbStorage.markNotificationAsRead(req.user.id, "friend_request", fromUserId);

      // Send acceptance notification to requester
      await dbStorage.createNotification({
        userId: fromUserId,
        type: "friend_accepted",
        title: "Friend Request Accepted",
        message: `${req.user.username} accepted your friend request`,
        data: JSON.stringify({ userId: req.user.id, username: req.user.username }),
        isRead: false
      });

      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).send("Error accepting friend request");
    }
  });

  // Decline friend request
  app.post("/api/friend-request/decline/:fromUserId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const fromUserId = parseInt(req.params.fromUserId);
      if (isNaN(fromUserId)) return res.status(400).send("Invalid user ID");

      // Remove the friend request notification
      await dbStorage.markNotificationAsRead(req.user.id, "friend_request", fromUserId);

      res.json({ message: "Friend request declined" });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).send("Error declining friend request");
    }
  });

  // Get pending friend requests
  app.get("/api/friend-requests/pending", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const pendingRequests = await dbStorage.getPendingFriendRequests(req.user.id);
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching pending friend requests:", error);
      res.status(500).send("Error fetching pending friend requests");
    }
  });

  // Get friends list (followers)
  app.get("/api/friends", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const friends = await dbStorage.getFriends(req.user.id);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).send("Error fetching friends");
    }
  });

  // Get following list (users this user follows)
  app.get("/api/following", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const following = await dbStorage.getFollowing(req.user.id);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).send("Error fetching following");
    }
  });

  // Accept friend request (new endpoint structure)
  app.post("/api/friend-requests/:requestId/accept", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) return res.status(400).send("Invalid request ID");

      await dbStorage.acceptFriendRequest(requestId, req.user.id);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).send("Error accepting friend request");
    }
  });

  // Decline friend request (new endpoint structure)
  app.post("/api/friend-requests/:requestId/decline", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) return res.status(400).send("Invalid request ID");

      await dbStorage.declineFriendRequest(requestId);
      res.json({ message: "Friend request declined" });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).send("Error declining friend request");
    }
  });

  // Remove friend
  app.delete("/api/friends/:friendId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const friendId = parseInt(req.params.friendId);
      if (isNaN(friendId)) return res.status(400).send("Invalid friend ID");

      await dbStorage.removeFriend(req.user.id, friendId);
      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).send("Error removing friend");
    }
  });

  // Trigger automatic friend requests from Lion Martinez
  app.post("/api/admin/send-automatic-friend-requests", async (req: Request, res: Response) => {
    try {
      console.log("Calling sendAutomaticFriendRequests...");
      await dbStorage.sendAutomaticFriendRequests();
      res.json({ message: "Automatic friend requests sent successfully" });
    } catch (error) {
      console.error("Error sending automatic friend requests:", error);
      res.status(500).send("Error sending automatic friend requests");
    }
  });

  app.delete("/api/follow/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const targetUserId = parseInt(req.params.userId);
      await dbStorage.unfollowUser(req.user.id, targetUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).send("Error unfollowing user");
    }
  });

  app.get("/api/users/:userId/follow-status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const targetUserId = parseInt(req.params.userId);
      const status = await dbStorage.getFollowStatus(req.user.id, targetUserId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching follow status:", error);
      res.status(500).send("Error fetching follow status");
    }
  });

  app.get("/api/users/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { search } = req.query;
      console.log("Fetching recent users for user:", req.user.id, "search:", search);
      const users = await dbStorage.getRecentUsers(req.user.id, search as string);
      console.log("Found users:", users.length);
      res.json(users);
    } catch (error) {
      console.error("Error fetching recent users:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ========== NOTIFICATION SYSTEM ENDPOINTS ==========

  // Admin broadcast notification endpoint
  app.post("/api/admin/broadcast-notification", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { title, message, targetUserIds } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }

      await notificationSystem.sendAdminBroadcast(title, message, targetUserIds);
      
      res.json({ 
        success: true, 
        message: `Broadcast sent to ${targetUserIds?.length || 'all'} users` 
      });
    } catch (error) {
      console.error("Error sending admin broadcast:", error);
      res.status(500).json({ error: "Failed to send broadcast notification" });
    }
  });

  // Manual trigger for automated notifications (admin only)
  app.post("/api/admin/trigger-notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      await notificationSystem.processAutomatedNotifications();
      res.json({ success: true, message: "Automated notifications processed" });
    } catch (error) {
      console.error("Error processing automated notifications:", error);
      res.status(500).json({ error: "Failed to process automated notifications" });
    }
  });

  // Generate weekly report for current user
  app.post("/api/notifications/weekly-report", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await notificationSystem.generateWeeklyReport(req.user.id);
      res.json({ success: true, message: "Weekly report generated" });
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ error: "Failed to generate weekly report" });
    }
  });

  // Coach-Athlete System Routes
  
  // Update user coach status
  app.patch("/api/user/coach-status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { isCoach } = req.body;
      const updatedUser = await dbStorage.updateUser(req.user.id, { isCoach });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating coach status:", error);
      res.status(500).json({ error: "Failed to update coach status" });
    }
  });

  // Update user privacy status
  app.patch("/api/user/privacy-status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { isPrivate } = req.body;
      const updatedUser = await dbStorage.updateUser(req.user.id, { isPrivate });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating privacy status:", error);
      res.status(500).json({ error: "Failed to update privacy status" });
    }
  });

  // Get coach's athletes
  app.get("/api/coach/athletes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const athletes = await dbStorage.getCoachAthletes(req.user.id);
      res.json(athletes);
    } catch (error) {
      console.error("Error getting coach athletes:", error);
      res.status(500).json({ error: "Failed to get athletes" });
    }
  });

  // Get athlete's coaches
  app.get("/api/athlete/coaches", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const coaches = await dbStorage.getAthleteCoaches(req.user.id);
      res.json(coaches);
    } catch (error) {
      console.error("Error getting athlete coaches:", error);
      res.status(500).json({ error: "Failed to get coaches" });
    }
  });

  // Add friend as athlete (for coaches)
  app.post("/api/coach/athletes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { athleteId } = req.body;
      
      // Check if user is a coach
      if (!req.user.isCoach) {
        return res.status(403).json({ error: "Only coaches can add athletes" });
      }

      // Check coach's athlete limit based on subscription
      const currentAthleteCount = await dbStorage.getCoachAthleteCount(req.user.id);
      const limits = { free: 5, pro: 20, star: Infinity };
      const userTier = req.user.subscriptionTier || 'free';
      const limit = limits[userTier as keyof typeof limits] || limits.free;

      if (currentAthleteCount >= limit) {
        return res.status(400).json({ 
          error: `Coach limit reached. ${userTier} tier allows ${limit === Infinity ? 'unlimited' : limit} athletes.` 
        });
      }

      // Verify they are friends first
      const followStatus = await dbStorage.getFollowStatus(req.user.id, athleteId);
      if (!followStatus.areFriends) {
        return res.status(400).json({ error: "Can only add friends as athletes" });
      }

      const relationship = await dbStorage.addCoachAthlete(req.user.id, athleteId);

      res.json(relationship);
    } catch (error) {
      console.error("Error adding athlete:", error);
      res.status(500).json({ error: "Failed to add athlete" });
    }
  });

  // Remove athlete from coach
  app.delete("/api/coach/athletes/:athleteId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const athleteId = parseInt(req.params.athleteId);
      const success = await dbStorage.removeCoachAthlete(req.user.id, athleteId);
      
      if (success) {
        res.json({ success: true, message: "Athlete removed successfully" });
      } else {
        res.status(404).json({ error: "Coach-athlete relationship not found" });
      }
    } catch (error) {
      console.error("Error removing athlete:", error);
      res.status(500).json({ error: "Failed to remove athlete" });
    }
  });

  // Get coach athlete count and limits
  app.get("/api/coach/limits", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const currentCount = await dbStorage.getCoachAthleteCount(req.user.id);
      const limits = { free: 5, pro: 20, star: Infinity };
      const userTier = req.user.subscriptionTier || 'free';
      const maxAthletes = limits[userTier as keyof typeof limits] || limits.free;

      res.json({
        currentAthletes: currentCount,
        maxAthletes: maxAthletes === Infinity ? 'unlimited' : maxAthletes,
        tier: userTier,
        canAddMore: currentCount < maxAthletes
      });
    } catch (error) {
      console.error("Error getting coach limits:", error);
      res.status(500).json({ error: "Failed to get coach limits" });
    }
  });

  // Group Chat API Routes

  // Get user's groups
  app.get("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userGroups = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          coachId: groups.ownerId,
          createdAt: groups.createdAt,
          coachName: users.name,
          coachUsername: users.username
        })
        .from(chatGroupMembers)
        .innerJoin(groups, eq(chatGroupMembers.groupId, groups.id))
        .innerJoin(users, eq(groups.ownerId, users.id))
        .where(eq(chatGroupMembers.userId, req.user.id));

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        userGroups.map(async (group) => {
          const memberCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(chatGroupMembers)
            .where(eq(chatGroupMembers.groupId, group.id));

          return {
            ...group,
            memberCount: memberCount[0]?.count || 0,
            coach: {
              name: group.coachName,
              username: group.coachUsername
            }
          };
        })
      );

      res.json(groupsWithCounts);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Create new group (coaches and star users only)
  app.post("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user;
    if (!user.isCoach && user.subscriptionTier !== 'star') {
      return res.status(403).json({ error: "Only coaches and Star subscribers can create groups" });
    }

    try {
      const { name, description } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }

      // Create the group
      const [newGroup] = await db
        .insert(groups)
        .values({
          name: name.trim(),
          description: description?.trim() || '',
          ownerId: user.id,
          clubId: null // For now, groups are not tied to clubs
        })
        .returning();

      // Add creator as a member
      await db
        .insert(chatGroupMembers)
        .values({
          groupId: newGroup.id,
          userId: user.id
        });

      res.status(201).json(newGroup);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // Get group messages
  app.get("/api/groups/:groupId/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).json({ error: "Invalid group ID" });

    try {
      // Verify user is a member of the group
      const membership = await db
        .select()
        .from(chatGroupMembers)
        .where(
          and(
            eq(chatGroupMembers.groupId, groupId),
            eq(chatGroupMembers.userId, req.user.id)
          )
        );

      if (membership.length === 0) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      const messages = await db
        .select({
          id: groupMessages.id,
          groupId: groupMessages.groupId,
          userId: groupMessages.senderId,
          content: groupMessages.message,
          createdAt: groupMessages.createdAt,
          user: {
            name: users.name,
            username: users.username,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(groupMessages)
        .innerJoin(users, eq(groupMessages.senderId, users.id))
        .where(eq(groupMessages.groupId, groupId))
        .orderBy(groupMessages.createdAt);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message to group
  app.post("/api/groups/:groupId/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).json({ error: "Invalid group ID" });

    try {
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Verify user is a member of the group
      const membership = await db
        .select()
        .from(chatGroupMembers)
        .where(
          and(
            eq(chatGroupMembers.groupId, groupId),
            eq(chatGroupMembers.userId, req.user.id)
          )
        );

      if (membership.length === 0) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      const [newMessage] = await db
        .insert(groupMessages)
        .values({
          groupId,
          senderId: req.user.id,
          message: content.trim()
        })
        .returning();

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get group members
  app.get("/api/groups/:groupId/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).json({ error: "Invalid group ID" });

    try {
      // Verify user is a member of the group
      const membership = await db
        .select()
        .from(chatGroupMembers)
        .where(
          and(
            eq(chatGroupMembers.groupId, groupId),
            eq(chatGroupMembers.userId, req.user.id)
          )
        );

      if (membership.length === 0) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      const members = await db
        .select({
          id: chatGroupMembers.id,
          groupId: chatGroupMembers.groupId,
          userId: chatGroupMembers.userId,
          joinedAt: chatGroupMembers.createdAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(chatGroupMembers)
        .innerJoin(users, eq(chatGroupMembers.userId, users.id))
        .where(eq(chatGroupMembers.groupId, groupId));

      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  const httpServer = createServer(app);

  // Start automated notification processing (runs every 6 hours)
  setInterval(async () => {
    try {
      console.log('🔄 Running scheduled notification processing...');
      await notificationSystem.processAutomatedNotifications();
    } catch (error) {
      console.error('Error in scheduled notification processing:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Password Reset Routes
  
  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        // Don't reveal whether email exists for security
        return res.json({ success: true, message: "If the email exists, a reset link has been sent" });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token in database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      });

      // In a real app, you would send an email here
      // For now, we'll just log the reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: ${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`);

      res.json({ 
        success: true, 
        message: "If the email exists, a reset link has been sent",
        // In development, include the token for testing
        ...(process.env.NODE_ENV === 'development' && { token: resetToken })
      });

    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.used, false)
          )
        );

      if (!resetToken || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      res.json({ valid: true });

    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find valid reset token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.used, false)
          )
        );

      if (!resetToken || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ success: true, message: "Password has been reset successfully" });

    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Connections API (for share functionality)
  app.get("/api/connections", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Get both friends and coach's athletes for sharing
      const friends = await dbStorage.getFriends(req.user.id);
      const coachAthletes = await dbStorage.getCoachAthletes(req.user.id);
      
      // Combine and deduplicate
      const connections = [...friends, ...coachAthletes.filter(athlete => 
        !friends.some(friend => friend.id === athlete.id)
      )];
      
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).send("Error fetching connections");
    }
  });

  // Exercise Library Share API
  app.post("/api/exercise-library/share", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { exerciseId, recipientIds, message } = req.body;
      
      // Verify exercise exists and user has access
      const exercise = await dbStorage.getExerciseLibraryItem(exerciseId, req.user.id);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Send messages to all recipients
      for (const recipientId of recipientIds) {
        // Create or get conversation
        const conversation = await dbStorage.createOrGetConversation(req.user.id, recipientId);
        
        // Prepare share message with structured data for video content
        const exerciseData = {
          type: 'exercise_share',
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          videoUrl: exercise.type === 'youtube' ? exercise.youtubeUrl : exercise.fileUrl,
          thumbnailUrl: exercise.thumbnailUrl,
          videoType: exercise.type,
          description: exercise.description
        };
        
        const shareContent = message 
          ? `${message}\n\n📹 ${exercise.name}\n${JSON.stringify(exerciseData)}`
          : `📹 Shared exercise: ${exercise.name}\n${JSON.stringify(exerciseData)}`;
        
        // Send the message
        await dbStorage.sendMessage({
          senderId: req.user.id,
          receiverId: recipientId,
          content: shareContent
        });

        // Create notification
        await dbStorage.createNotification({
          userId: recipientId,
          type: "exercise_shared",
          title: "Exercise Shared",
          message: `${req.user.username} shared an exercise with you`,
          actionUrl: `/messages/${conversation.id}`,
          isRead: false
        });
      }

      res.json({ success: true, message: "Exercise shared successfully" });
    } catch (error) {
      console.error("Error sharing exercise:", error);
      res.status(500).json({ error: "Failed to share exercise" });
    }
  });

  // Library Sharing Status API
  app.get("/api/exercise-library/sharing-status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = req.user;
      const libraryShares = await dbStorage.getLibraryShares(user.id);
      
      res.json({
        currentShares: libraryShares.length,
        sharedWith: libraryShares.map(share => share.recipientId),
        shares: libraryShares
      });
    } catch (error) {
      console.error("Error fetching library sharing status:", error);
      res.status(500).json({ error: "Failed to fetch sharing status" });
    }
  });

  // Share Full Library API
  app.post("/api/exercise-library/share-library", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { recipientIds, useSpikes = false } = req.body;
      const user = req.user;
      
      // Determine subscription tier
      const isStarUser = user.isPremium;
      const isProUser = user.isProUser;
      const isFreeUser = !isStarUser && !isProUser;
      
      // Check limits and permissions
      const currentShares = await dbStorage.getLibraryShares(user.id);
      const currentShareCount = currentShares.length;
      
      if (isFreeUser && !useSpikes) {
        return res.status(403).json({ error: "Free users must use Spikes to share library access" });
      }
      
      if (isFreeUser && useSpikes && (user.spikes || 0) < 100) {
        return res.status(403).json({ error: "Insufficient Spikes. Need 100 Spikes to share library access" });
      }
      
      if (isProUser && currentShareCount + recipientIds.length > 10) {
        return res.status(403).json({ error: "Pro plan allows sharing with up to 10 people. Upgrade to Star for unlimited sharing." });
      }
      
      // Process the library sharing
      for (const recipientId of recipientIds) {
        // Check if already shared
        const existingShare = currentShares.find(share => share.recipientId === recipientId);
        if (existingShare) continue;
        
        // Create library share record
        await dbStorage.createLibraryShare({
          sharerId: user.id,
          recipientId,
          sharedAt: new Date(),
          tier: isStarUser ? 'star' : isProUser ? 'pro' : 'free'
        });
        
        // Create or get conversation
        const conversation = await dbStorage.createOrGetConversation(user.id, recipientId);
        
        // Send notification message
        await dbStorage.sendMessage({
          conversationId: conversation.id,
          senderId: user.id,
          content: `${user.username} has shared their full Exercise Library with you! You now have access to all their training videos and exercises.`
        });
        
        // Create notification
        await dbStorage.createNotification({
          userId: recipientId,
          type: "library_shared",
          title: "Exercise Library Shared",
          message: `${user.username} shared their full exercise library with you`,
          actionUrl: "/tools/exercise-library",
          isRead: false
        });
      }
      
      // Deduct spikes for free users
      if (isFreeUser && useSpikes) {
        await dbStorage.deductSpikesFromUser(
          user.id, 
          100, 
          'library_sharing', 
          null, 
          `Shared library access with ${recipientIds.length} people`
        );
      }
      
      res.json({ 
        success: true, 
        message: "Library access shared successfully",
        spikesUsed: isFreeUser && useSpikes ? 100 : 0
      });
    } catch (error) {
      console.error("Error sharing library:", error);
      res.status(500).json({ error: "Failed to share library access" });
    }
  });

  // ============================================================
  // Video Analysis API Routes
  // ============================================================

  // Get user's uploaded videos
  app.get("/api/video-analysis", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const videos = await dbStorage.getVideoAnalysisByUserId(req.user.id);
      
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });



  // Analyze video with Sprinthia AI
  app.post("/api/video-analysis/:videoId/analyze", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const videoId = parseInt(req.params.videoId);
      const { promptId } = req.body;

      if (!promptId) {
        return res.status(400).json({ error: "Analysis type is required" });
      }

      // Get video details
      const video = await dbStorage.getVideoAnalysis(videoId);
      
      if (!video || video.userId !== req.user.id) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Check user's prompt limits
      const user = req.user;
      const subscriptionTier = user.subscriptionTier || "free";
      const currentPrompts = user.sprinthiaPrompts || 0;

      let canAnalyze = false;
      let promptCost = 0;

      if (subscriptionTier === "star") {
        canAnalyze = true;
      } else if (subscriptionTier === "pro") {
        canAnalyze = currentPrompts < 5;
        promptCost = 0;
      } else { // free tier
        canAnalyze = currentPrompts < 1;
        promptCost = 25; // Spikes cost for additional prompts
      }

      if (!canAnalyze) {
        return res.status(403).json({ 
          error: "Prompt limit reached",
          message: subscriptionTier === "pro" 
            ? "You've used all 5 prompts this week. Upgrade to Star for unlimited prompts."
            : "You've used your 1 free prompt this month. Upgrade your plan or buy more with Spikes."
        });
      }

      // Define analysis prompts
      const analysisPrompts: Record<string, string> = {
        "sprint-form": "Analyze the sprint form and running technique in this video. Focus on body posture, arm swing, leg drive, and overall biomechanics. Provide detailed feedback on what the athlete is doing well and specific areas for improvement.",
        "block-start": "Analyze the starting blocks technique in this sprint video. Examine the setup position, reaction time, first few steps, and acceleration phase. Provide technical feedback on starting mechanics and suggestions for improvement.",
        "stride-length": "Analyze the stride length patterns throughout this sprint video. Examine the relationship between stride length and speed phases, compare early acceleration vs. maximum velocity phases, and provide recommendations for optimal stride length.",
        "stride-frequency": "Analyze the stride frequency and cadence in this sprint video. Calculate approximate steps per second during different phases of the race, examine rhythm consistency, and provide feedback on optimal turnover rate.",
        "ground-contact": "Analyze the ground contact time and foot strike patterns in this sprint video. Examine how long the foot stays in contact with the ground during different phases, foot placement, and provide technical feedback on contact efficiency.",
        "flight-time": "Analyze the flight time and airborne phases between steps in this sprint video. Examine the relationship between ground contact and flight phases, overall stride efficiency, and provide recommendations for optimal flight mechanics."
      };

      const prompt = analysisPrompts[promptId];
      if (!prompt) {
        return res.status(400).json({ error: "Invalid analysis type" });
      }

      // Generate AI analysis using OpenAI with actual video content
      const { analyzeVideoWithPrompt } = await import('./openai');
      
      // Construct the full video file path
      const videoPath = video.fileUrl.startsWith('/') ? `.${video.fileUrl}` : video.fileUrl;
      
      try {
        const analysis = await analyzeVideoWithPrompt(
          video.name,
          video.description || "",
          promptId,
          videoPath
        );

        // Update user's prompt usage
        if (subscriptionTier !== "star") {
          await dbStorage.updateUser(user.id, { 
            sprinthiaPrompts: currentPrompts + 1
          });
        }

        // Save analysis to video record
        await dbStorage.updateVideoAnalysis(videoId, { 
          analysisData: analysis
        });

        res.json({ 
          analysis,
          promptsUsed: subscriptionTier !== "star" ? currentPrompts + 1 : "unlimited"
        });
      } catch (error) {
        // Return OpenAI's specific error message about video issues
        const errorMessage = error instanceof Error ? error.message : "Video analysis failed";
        console.error("Video analysis error:", errorMessage);
        res.json({ 
          analysis: errorMessage,
          promptsUsed: subscriptionTier !== "star" ? currentPrompts : currentPrompts
        });
      }

    } catch (error) {
      console.error("Error analyzing video:", error);
      res.status(500).json({ error: "Failed to analyze video" });
    }
  });

  // Buy additional prompts with Spikes
  app.post("/api/video-analysis/buy-prompts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { quantity = 1 } = req.body;
      const spikeCostPerPrompt = 25;
      const totalCost = quantity * spikeCostPerPrompt;

      const user = req.user;
      const currentSpikes = user.spikes || 0;

      if (currentSpikes < totalCost) {
        return res.status(400).json({ 
          error: "Insufficient Spikes",
          required: totalCost,
          current: currentSpikes
        });
      }

      // Reset prompt count (buying resets the monthly/weekly limit)
      const newPromptCount = 0;

      // Deduct spikes and reset prompts
      await dbStorage.updateUser(user.id, { 
        spikes: currentSpikes - totalCost,
        sprinthiaPrompts: newPromptCount
      });

      res.json({ 
        success: true,
        spikesUsed: totalCost,
        remainingSpikes: currentSpikes - totalCost,
        promptsAvailable: user.subscriptionTier === "pro" ? 5 : 1
      });

    } catch (error) {
      console.error("Error buying prompts:", error);
      res.status(500).json({ error: "Failed to purchase prompts" });
    }
  });

  // ============================================================
  // Competition Calendar API Routes
  // ============================================================

  // Get competitions from World Athletics
  app.get("/api/competitions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { name, upcoming, major, startDate, endDate, page = '1', limit = '20', sort = 'asc' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const sortOrder = sort as string;
      
      console.log('Competition API request:', { name, upcoming, major, startDate, endDate, page, limit, sort });
      
      // Fetch all available competitions from World Athletics API without date restrictions
      // We'll filter by date after getting the data to ensure we don't miss competitions
      let competitions = await worldAthleticsService.searchCompetitions();
      
      console.log(`Fetched ${competitions.length} competitions from World Athletics API`);
      
      // Log available date range for debugging
      if (competitions.length > 0) {
        const dates = competitions.map(c => c.start).sort();
        console.log(`Available competition dates range from ${dates[0]} to ${dates[dates.length - 1]}`);
        console.log(`Sample competitions:`, competitions.slice(0, 3).map(c => ({ name: c.name, start: c.start })));
      }
      
      // Handle empty results gracefully
      if (competitions.length === 0) {
        console.log('No competitions found for the specified criteria');
        return res.json({
          competitions: [],
          total: 0,
          page: pageNum,
          totalPages: 0
        });
      }
      
      // Apply date filtering first (always apply user-specified date range)
      const now = new Date();
      
      // Always apply date filtering based on user input or defaults
      if (startDate && startDate !== 'no-start') {
        const filterStartDate = new Date(startDate as string);
        competitions = competitions.filter(comp => {
          const compStart = new Date(comp.start);
          return compStart >= filterStartDate;
        });
        console.log(`Filtered to ${competitions.length} competitions after start date filter (${startDate})`);
      }
      
      if (endDate && endDate !== 'no-end') {
        const filterEndDate = new Date(endDate as string);
        competitions = competitions.filter(comp => {
          const compStart = new Date(comp.start);
          return compStart <= filterEndDate;
        });
        console.log(`Filtered to ${competitions.length} competitions after end date filter (${endDate})`);
      }
      
      // Apply tab-specific filtering
      if (upcoming === 'upcoming') {
        // For upcoming tab, show only future competitions
        competitions = competitions.filter(comp => new Date(comp.start) >= now);
      } else if (major === 'major') {
        // For major tab, show major competitions (past and future)
        competitions = competitions.filter(comp => 
          comp.rankingCategory?.toLowerCase().includes('a') || 
          comp.rankingCategory?.toLowerCase().includes('b') ||
          comp.competitionGroup?.toLowerCase().includes('world athletics') ||
          comp.competitionGroup?.toLowerCase().includes('diamond league') ||
          comp.competitionGroup?.toLowerCase().includes('continental tour') ||
          comp.name.toLowerCase().includes('championship') ||
          comp.name.toLowerCase().includes('games') ||
          comp.name.toLowerCase().includes('diamond league') ||
          comp.name.toLowerCase().includes('world athletics')
        );
      }
      // For "all" tab, show all competitions without additional filtering
      
      // Apply search filter
      if (name && name !== 'all') {
        competitions = competitions.filter(comp => 
          comp.name.toLowerCase().includes((name as string).toLowerCase()) ||
          comp.location.city?.toLowerCase().includes((name as string).toLowerCase()) ||
          comp.location.country.toLowerCase().includes((name as string).toLowerCase())
        );
      }
      
      // Store new competitions in our database
      for (const comp of competitions) {
        try {
          await db.insert(competitionsTable).values({
            externalId: comp.id,
            name: comp.name,
            location: `${comp.location.city || ''}, ${comp.location.country}`.replace(/^, /, ''),
            country: comp.location.country,
            city: comp.location.city || null,
            rankingCategory: comp.rankingCategory,
            disciplines: comp.disciplines,
            startDate: comp.start,
            endDate: comp.end,
            competitionGroup: comp.competitionGroup || null,
            competitionSubgroup: comp.competitionSubgroup || null,
            hasResults: comp.hasResults,
            hasStartlist: comp.hasStartlist,
            hasCompetitionInformation: comp.hasCompetitionInformation
          }).onConflictDoNothing();
        } catch (insertError) {
          // Competition might already exist, which is fine
        }
      }
      
      // Apply sorting by date
      competitions.sort((a, b) => {
        const dateA = new Date(a.start);
        const dateB = new Date(b.start);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
      
      // Apply pagination with increased limit for better user experience
      const total = competitions.length;
      const effectiveLimit = Math.max(limitNum, 50); // Minimum 50 results per page
      const startIndex = (pageNum - 1) * effectiveLimit;
      const endIndex = startIndex + effectiveLimit;
      const paginatedCompetitions = competitions.slice(startIndex, endIndex);
      
      // Prevent caching to ensure fresh data for date filtering
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json({
        competitions: paginatedCompetitions,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / effectiveLimit)
      });
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).send("Error fetching competitions");
    }
  });

  // Get competition results
  app.get("/api/competitions/:id/results", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const competitionId = parseInt(req.params.id);
      const { eventId, day } = req.query;
      
      const results = await worldAthleticsService.getCompetitionResults(
        competitionId,
        eventId ? parseInt(eventId as string) : undefined,
        day ? parseInt(day as string) : undefined
      );
      
      // Store results in our database
      const dbCompetition = await db.select().from(competitionsTable)
        .where(eq(competitionsTable.externalId, competitionId)).limit(1);
      
      if (dbCompetition.length > 0) {
        const localCompId = dbCompetition[0].id;
        
        for (const event of results) {
          // Insert event
          const [insertedEvent] = await db.insert(competitionEventsTable).values({
            competitionId: localCompId,
            externalEventId: event.eventId,
            eventName: event.eventName || null,
            disciplineName: event.disciplineName,
            disciplineCode: event.disciplineCode,
            category: event.category,
            sex: event.sex
          }).onConflictDoNothing().returning();
          
          // Insert results for each race
          for (const race of event.races) {
            for (const result of race.results) {
              for (const athlete of result.athletes) {
                await db.insert(athleteCompetitionResultsTable).values({
                  competitionId: localCompId,
                  eventId: insertedEvent?.id || null,
                  athleteName: athlete.name,
                  athleteId: athlete.id,
                  country: result.country,
                  place: result.place,
                  performance: result.performance.mark,
                  performanceValue: worldAthleticsService.convertPerformanceToValue(
                    result.performance.mark, 
                    event.disciplineCode
                  ),
                  wind: result.performance.wind || null,
                  raceNumber: race.raceNumber,
                  raceName: race.race,
                  date: race.date || null
                }).onConflictDoNothing();
              }
            }
          }
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error fetching competition results:", error);
      res.status(500).send("Error fetching competition results");
    }
  });

  // Get competition organizer info
  app.get("/api/competitions/:id/info", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const competitionId = parseInt(req.params.id);
      const info = await worldAthleticsService.getCompetitionInfo(competitionId);
      res.json(info);
    } catch (error) {
      console.error("Error fetching competition info:", error);
      res.status(500).send("Error fetching competition info");
    }
  });

  // Add competition to user favorites
  app.post("/api/competitions/:id/favorite", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const externalCompId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Find local competition record
      const dbCompetition = await db.select().from(competitionsTable)
        .where(eq(competitionsTable.externalId, externalCompId)).limit(1);
      
      if (dbCompetition.length === 0) {
        return res.status(404).send("Competition not found");
      }
      
      const competitionId = dbCompetition[0].id;
      
      // Check if already favorited
      const existing = await db.select().from(userFavoriteCompetitionsTable)
        .where(and(
          eq(userFavoriteCompetitionsTable.userId, userId),
          eq(userFavoriteCompetitionsTable.competitionId, competitionId)
        )).limit(1);
      
      if (existing.length > 0) {
        return res.status(400).send("Competition already in favorites");
      }
      
      const favorite = await db.insert(userFavoriteCompetitionsTable).values({
        userId,
        competitionId
      }).returning();
      
      res.json(favorite[0]);
    } catch (error) {
      console.error("Error adding competition to favorites:", error);
      res.status(500).send("Error adding to favorites");
    }
  });

  // Remove competition from user favorites
  app.delete("/api/competitions/:id/favorite", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const externalCompId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Find local competition record
      const dbCompetition = await db.select().from(competitionsTable)
        .where(eq(competitionsTable.externalId, externalCompId)).limit(1);
      
      if (dbCompetition.length === 0) {
        return res.status(404).send("Competition not found");
      }
      
      const competitionId = dbCompetition[0].id;
      
      await db.delete(userFavoriteCompetitionsTable)
        .where(and(
          eq(userFavoriteCompetitionsTable.userId, userId),
          eq(userFavoriteCompetitionsTable.competitionId, competitionId)
        ));
      
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing competition from favorites:", error);
      res.status(500).send("Error removing from favorites");
    }
  });

  // Get user's favorite competitions
  app.get("/api/competitions/favorites", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      const favorites = await db.select({
        id: competitionsTable.externalId,
        name: competitionsTable.name,
        location: competitionsTable.location,
        country: competitionsTable.country,
        city: competitionsTable.city,
        rankingCategory: competitionsTable.rankingCategory,
        disciplines: competitionsTable.disciplines,
        startDate: competitionsTable.startDate,
        endDate: competitionsTable.endDate,
        hasResults: competitionsTable.hasResults,
        favoriteId: userFavoriteCompetitionsTable.id,
        favoritedAt: userFavoriteCompetitionsTable.createdAt
      })
      .from(userFavoriteCompetitionsTable)
      .innerJoin(competitionsTable, eq(userFavoriteCompetitionsTable.competitionId, competitionsTable.id))
      .where(eq(userFavoriteCompetitionsTable.userId, userId))
      .orderBy(competitionsTable.startDate);
      
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorite competitions:", error);
      res.status(500).send("Error fetching favorites");
    }
  });

  // Video Analysis Routes
  const videoAnalysisUpload = multer({
    dest: "uploads/video-analysis/",
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow video files only - check both extension and MIME type
      const allowedExtensions = /\.(mp4|mov|avi|webm)$/i;
      const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi'];
      
      const extname = allowedExtensions.test(file.originalname);
      const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/');
      
      if (extname || mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    }
  });

  // Upload video for analysis
  app.post("/api/video-analysis/upload", videoAnalysisUpload.single('file'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      const { name, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      if (!name || !name.trim()) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Video name is required" });
      }
      
      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const finalPath = path.join("uploads/video-analysis", uniqueFilename);
      
      // Move file to final location
      fs.renameSync(req.file.path, finalPath);
      
      // Create video analysis entry
      const videoData = {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        fileUrl: `/uploads/video-analysis/${uniqueFilename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'completed' as const // For now, mark as completed immediately
      };
      
      const newVideo = await dbStorage.createVideoAnalysis(videoData);
      
      res.status(201).json({
        id: newVideo.id,
        name: newVideo.name,
        description: newVideo.description,
        fileUrl: newVideo.fileUrl,
        status: newVideo.status,
        createdAt: newVideo.createdAt
      });
    } catch (error) {
      console.error("Error uploading video for analysis:", error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: "Failed to upload video for analysis" });
    }
  });

  // Get user's video analysis uploads
  app.get("/api/video-analysis", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const videos = await dbStorage.getVideoAnalysisByUserId(req.user!.id);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching video analysis:", error);
      res.status(500).json({ error: "Failed to fetch video analysis" });
    }
  });

  // Get specific video analysis
  app.get("/api/video-analysis/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const videoId = parseInt(req.params.id);
      const video = await dbStorage.getVideoAnalysis(videoId);
      
      if (!video) {
        return res.status(404).json({ error: "Video analysis not found" });
      }
      
      // Check if user owns the video
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Error fetching video analysis:", error);
      res.status(500).json({ error: "Failed to fetch video analysis" });
    }
  });

  // Coaches API Routes
  app.get("/api/coaches/athletes", getCoachAthletes);
  app.get("/api/coaches/mood-stats", getAthleteMoodStats);
  app.get("/api/coaches/journal-entries", getAthleteJournalEntries);
  app.get("/api/journal/:journalId/comments", getJournalComments);
  app.post("/api/journal/:journalId/comments", addJournalComment);
  app.post("/api/mood-entries", recordMoodEntry);

  return httpServer;
}
