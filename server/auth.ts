import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User, User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail, generatePasswordResetToken, generatePasswordResetEmail } from "./utils/email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if it's a bcrypt hash (production format)
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      return await bcrypt.compare(supplied, stored);
    }
    
    // Otherwise use scrypt format (legacy format)
    const [hashed, salt] = stored.split(".");
    if (!salt) {
      console.error("Invalid password format - no salt found");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Helper function to determine if user needs onboarding
async function requiresOnboarding(user: User): Promise<boolean> {
  // User needs onboarding if they're missing essential data
  return !user.username || !user.name;
}

export function setupAuth(app: Express) {
  // Robust environment detection - check multiple indicators
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPL_DEPLOYMENT === 'production' ||
                      process.env.REPLIT_DEPLOYMENT === 'true' ||
                      !!process.env.REPL_SLUG;
  const isHttps = !!(process.env.REPL_SLUG || process.env.REPLIT_DB_URL || isProduction || process.env.HTTPS);
  
  console.log('Auth setup:', { 
    NODE_ENV: process.env.NODE_ENV, 
    isProduction, 
    isHttps, 
    REPL_SLUG: !!process.env.REPL_SLUG 
  });

  // More robust sameSite configuration for production reliability
  // Use 'none' for iframe/preview environments, 'lax' for others
  // In production, be more permissive to avoid cookie issues
  const sameSiteSetting = isProduction ? 'lax' : (isHttps ? 'none' : 'lax');

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "track-meet-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isHttps, // Use HTTPS in production and Replit environments
      sameSite: sameSiteSetting // Configured for environment compatibility
    }
  };

  // Configure proxy trust for different environments
  if (isProduction || process.env.REPL_SLUG) {
    app.set("trust proxy", true); // Trust all proxies in production/Replit
  } else {
    app.set("trust proxy", 1); // Trust first proxy in development
  }
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false);
        }
        
        // Just use regular password comparison for all users
        if (await comparePasswords(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body with zod schema
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Hash password and create user
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // TODO: Send automatic friend request from Lion Martinez to new user
      // Note: sendAutomaticFriendRequests method needs to be implemented

      // Log the user in
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Check if user needs onboarding
        const needsOnboarding = await requiresOnboarding(user);
        
        res.status(201).json({
          user,
          requiresOnboarding: needsOnboarding
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).send("Invalid username or password");
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, you will receive a password reset email." });
      }

      // Clean up old tokens for this user
      await storage.deletePasswordResetTokensForUser(user.id);

      // Generate reset token
      const token = generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // Send email
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://tracklit.app' 
        : `http://localhost:${process.env.PORT || 3000}`;
      
      const emailContent = generatePasswordResetEmail(email, token, baseUrl);
      const emailSent = await sendEmail(emailContent);

      if (!emailSent) {
        console.error('Failed to send password reset email');
        // Still return success to not reveal email existence
      }

      res.json({ message: "If an account with that email exists, you will receive a password reset email." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Get the user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset confirmation error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset token", valid: false });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ error: "Failed to verify token", valid: false });
    }
  });

  app.get("/api/user", async (req, res) => {
    // Enhanced authentication check with detailed logging
    const isAuth = req.isAuthenticated();
    const hasUser = !!req.user;
    const sessionId = req.sessionID;
    
    console.log(`/api/user request: authenticated=${isAuth}, hasUser=${hasUser}, sessionId=${sessionId}`);
    
    if (!isAuth || !req.user) {
      console.log('User not authenticated, returning 401');
      return res.status(401).json({ 
        error: 'Not authenticated',
        debug: { isAuth, hasUser, sessionId }
      });
    }
    
    // Get fresh user data from database to ensure role is current
    try {
      const freshUser = await storage.getUser(req.user.id);
      if (!freshUser) {
        console.log(`User ${req.user.id} not found in database`);
        return res.status(401).json({ error: 'User not found' });
      }
      res.json(freshUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Debug endpoint to test authentication status (after auth setup)
  app.get('/debug-auth', (req, res) => {
    res.status(200).json({
      message: 'Debug endpoint reached',
      authenticated: !!req.user,
      userId: req.user?.id || null,
      sessionId: req.sessionID || null,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        isHttps,
        sameSite: sameSiteSetting,
        trustProxy: app.get('trust proxy'),
        sessionSecret: !!process.env.SESSION_SECRET
      },
      headers: {
        userAgent: req.get('User-Agent'),
        host: req.get('Host'),
        origin: req.get('Origin'),
        referer: req.get('Referer')
      }
    });
  });
  
  // Emergency endpoint for production debugging
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      authenticated: !!req.user,
      session: !!req.sessionID
    });
  });
}
