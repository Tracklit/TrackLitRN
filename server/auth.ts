import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AppleStrategy from "passport-apple";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import { User, User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail, generatePasswordResetToken, generatePasswordResetEmail } from "./utils/email";
import { getBaseUrl, getOAuthCallbackUrl } from "./utils/url-helper";

// Age calculation utility
function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Validate date
    if (isNaN(birthDate.getTime())) return null;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "track-meet-jwt-secret-key";
const JWT_EXPIRES_IN = "30d"; // 30 days to match session expiry

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_MOBILE_AUDIENCES = [
  process.env.APPLE_IOS_BUNDLE_ID,
  "com.tracklit.app",
  "com.tracklit.mobile",
].filter((value): value is string => Boolean(value));

// Generate JWT token for a user
function generateToken(user: SelectUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token and return user id
function verifyToken(token: string): { id: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded;
  } catch (error) {
    return null;
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

async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string | string[] = APPLE_MOBILE_AUDIENCES,
) {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
  });
  return payload;
}

function buildDisplayName(fullName?: { givenName?: string | null; familyName?: string | null }) {
  const given = fullName?.givenName?.trim() ?? "";
  const family = fullName?.familyName?.trim() ?? "";
  const combined = `${given} ${family}`.trim();
  return combined || "TrackLit Athlete";
}

async function buildUniqueUsername(base: string) {
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  let candidate = normalized || `apple_${randomBytes(4).toString("hex")}`;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await storage.getUserByUsername(candidate);
    if (!existing) {
      return candidate;
    }
    candidate = `${candidate}_${Math.floor(Math.random() * 1000)}`;
    attempts += 1;
  }
  return `${normalized || "apple"}_${randomBytes(4).toString("hex")}`;
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

  // JWT Authentication Middleware - checks for Bearer token in Authorization header
  // Works alongside session auth - if session auth fails, tries JWT
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Some routes still rely on passport's req.isAuthenticated() checks.
    // For mobile clients using JWT, we set req.user but passport does not mark the
    // request as authenticated. We patch req.isAuthenticated() to also treat a
    // JWT-populated req.user as authenticated.
    const originalIsAuthenticated = req.isAuthenticated?.bind(req);
    if (originalIsAuthenticated) {
      (req as any).isAuthenticated = () => originalIsAuthenticated() || !!req.user;
    }

    // Skip if already authenticated via session
    if (req.isAuthenticated()) {
      return next();
    }

    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    if (decoded && decoded.id) {
      try {
        const user = await storage.getUser(decoded.id);
        if (user) {
          // Set user on request for downstream handlers
          req.user = user;
          console.log(`JWT auth successful for user ${user.id}`);
        }
      } catch (error) {
        console.error('JWT auth error:', error);
      }
    }
    
    next();
  });

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
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: getOAuthCallbackUrl("google"),
          scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists by email
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email found in Google profile'), undefined);
            }

            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user from Google profile
              const username = profile.emails[0].value.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
              user = await storage.createUser({
                username,
                email,
                name: profile.displayName || profile.emails[0].value,
                password: await hashPassword(randomBytes(32).toString('hex')), // Random password for OAuth users
              });
              console.log(`[GOOGLE-AUTH] Created new user from Google: `);
            } else {
              console.log(`[GOOGLE-AUTH] Existing user logged in: `);
            }

            return done(null, user);
          } catch (error) {
            console.error('[GOOGLE-AUTH] Error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );
    console.log('[GOOGLE-AUTH] Google OAuth strategy configured');
  } else {
    console.warn('[GOOGLE-AUTH] Google OAuth not configured - missing credentials');
  }

  // Apple OAuth Strategy (Sign in with Apple)
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          callbackURL: getOAuthCallbackUrl("apple"),
          scope: ['name', 'email'],
          passReqToCallback: false
        },
        async (
          accessToken: string,
          refreshToken: string,
          idToken: any,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            // Apple provides email only on first sign-in, so we store the Apple ID
            const appleId = idToken.sub;
            const email = idToken.email || profile?.email;
            const name = profile?.name 
              ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
              : null;

            console.log('[APPLE-AUTH] Processing auth:', { appleId, email, hasName: !!name });

            // First, try to find user by Apple ID (stored in a field)
            let user = await storage.getUserByAppleId?.(appleId);

            if (!user && email) {
              // If not found by Apple ID, try by email
              user = await storage.getUserByEmail(email);
              
              if (user) {
                // Link Apple ID to existing account
                await storage.updateUser(user.id, { appleId });
                console.log(`[APPLE-AUTH] Linked Apple ID to existing user: ${user.id}`);
              }
            }

            if (!user) {
              // Create new user from Apple profile
              if (!email) {
                return done(new Error('Email is required for new account creation. Please allow email access.'), undefined);
              }

              const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
              user = await storage.createUser({
                username,
                email,
                name: name || email.split('@')[0],
                password: await hashPassword(randomBytes(32).toString('hex')), // Random password for OAuth users
                appleId,
              });
              console.log(`[APPLE-AUTH] Created new user from Apple: ${user.id}`);
            } else {
              console.log(`[APPLE-AUTH] Existing user logged in: ${user.id}`);
            }

            return done(null, user);
          } catch (error) {
            console.error('[APPLE-AUTH] Error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );
    console.log('[APPLE-AUTH] Apple OAuth strategy configured');
  } else {
    console.warn('[APPLE-AUTH] Apple Sign-In not configured - missing credentials');
  }


  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Native Google Sign-In (mobile) - exchange Google ID token for TrackLit JWT.
  app.post("/api/auth/google/mobile", async (req, res) => {
    try {
      const { idToken } = req.body ?? {};

      if (!idToken) {
        return res.status(400).json({ error: "Google ID token is required" });
      }

      // Accept tokens minted for any of our registered OAuth clients.
      const audiences = [
        process.env.GOOGLE_CLIENT_ID, // Web client id (also used by server-side OAuth flow)
        process.env.GOOGLE_IOS_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
      ].filter((value): value is string => Boolean(value));

      if (audiences.length === 0) {
        console.error("[GOOGLE-AUTH] Mobile auth misconfigured: no client IDs configured");
        return res.status(500).json({ error: "Google sign-in is not configured" });
      }

      let payload: any;
      try {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
          idToken,
          audience: audiences,
        });
        payload = ticket.getPayload();
      } catch (error) {
        const errorInfo = {
          message: error instanceof Error ? error.message : String(error),
          audiences,
          token_length: typeof idToken === "string" ? idToken.length : undefined,
        };
        console.error("[GOOGLE-AUTH] Mobile ID token invalid:", errorInfo);
        return res.status(401).json({
          error: "Google ID token invalid",
          ...(isProduction ? {} : { details: errorInfo }),
        });
      }

      if (!payload) {
        return res.status(401).json({ error: "Google ID token invalid" });
      }

      const email = typeof payload.email === "string" ? payload.email : undefined;
      const name = typeof payload.name === "string" ? payload.name : undefined;

      // Optional hard check: if Google says email isn't verified, treat as invalid.
      if (payload.email_verified === false) {
        return res.status(401).json({ error: "Google email is not verified" });
      }

      if (!email) {
        return res.status(400).json({ error: "Email is required from Google" });
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        const base = email.split("@")[0] || `google_${randomBytes(4).toString("hex")}`;
        const username = await buildUniqueUsername(base);
        const password = await hashPassword(randomBytes(32).toString("hex"));
        user = await storage.createUser({
          username,
          email,
          name: name || base,
          password,
        });
      }

      const token = generateToken(user);
      const { password: _password, ...safeUser } = user as any;
      return res.status(200).json({ user: safeUser, token });
    } catch (error) {
      const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        claim: (error as any)?.claim,
        reason: (error as any)?.reason,
      };
      console.error("[GOOGLE-AUTH] Mobile auth error:", errorInfo);
      return res.status(500).json({ error: "Google sign in failed" });
    }
  });

  app.post("/api/auth/apple/mobile", async (req, res) => {
    try {
      const { identityToken, fullName, email } = req.body;

      if (!identityToken) {
        return res.status(400).json({ error: "Apple identity token is required" });
      }

      let payload: any;
      try {
        payload = await verifyAppleIdentityToken(identityToken);
      } catch (error) {
        const errorInfo = {
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          claim: (error as any)?.claim,
          reason: (error as any)?.reason,
          audiences: APPLE_MOBILE_AUDIENCES,
          token_length: identityToken?.length,
        };
        console.error("[APPLE-AUTH] Mobile identity token invalid:", errorInfo);
        return res.status(401).json({
          error: "Apple identity token invalid",
          ...(isProduction ? {} : { details: errorInfo }),
        });
      }
      const appleSub = typeof payload.sub === "string" ? payload.sub : undefined;
      const emailFromToken = typeof payload.email === "string" ? payload.email : undefined;
      const resolvedEmail = email || emailFromToken;

      if (!appleSub) {
        return res.status(400).json({ error: "Apple identity token is missing subject" });
      }

      let user = await storage.getUserByAppleSub(appleSub);

      if (!user && resolvedEmail) {
        const emailUser = await storage.getUserByEmail(resolvedEmail);
        if (emailUser?.appleSub && emailUser.appleSub !== appleSub) {
          return res.status(409).json({ error: "Apple account already linked to a different user." });
        }

        if (emailUser) {
          const updates: Partial<User> = {};
          if (!emailUser.appleSub) {
            updates.appleSub = appleSub;
          }
          if (!emailUser.name) {
            updates.name = buildDisplayName(fullName);
          }
          if (Object.keys(updates).length > 0) {
            user = await storage.updateUser(emailUser.id, updates);
          } else {
            user = emailUser;
          }
        }
      }

      if (!user) {
        if (!resolvedEmail) {
          return res.status(400).json({ error: "Apple account email is required on first sign-in." });
        }
        const username = await buildUniqueUsername(resolvedEmail.split("@")[0] || `apple_${appleSub.slice(0, 8)}`);
        const name = buildDisplayName(fullName);
        const password = await hashPassword(randomBytes(32).toString("hex"));
        user = await storage.createUser({
          username,
          email: resolvedEmail,
          name,
          password,
          appleSub,
        });
      }

      const token = generateToken(user);
      const { password: _password, ...safeUser } = user as any;

      res.status(200).json({ user: safeUser, token });
    } catch (error) {
      const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        claim: (error as any)?.claim,
        reason: (error as any)?.reason,
      };
      console.error("[APPLE-AUTH] Mobile auth error:", errorInfo);
      res.status(500).json({ error: "Apple sign in failed" });
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
        
        // Generate JWT token for mobile clients
        const token = generateToken(user);
        
        res.status(201).json({
          user: { ...user, token },
          token,
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
        // Generate JWT token for mobile clients
        try {
          const token = generateToken(user as SelectUser);
          console.log(`[AUTH] Login successful for user ${(user as any).id}, token generated: ${token ? 'yes' : 'no'}`);
          // Return user data with token, excluding password hash
          const { password, ...userWithoutPassword } = user as any;
          res.status(200).json({ ...userWithoutPassword, token });
        } catch (tokenError) {
          console.error('[AUTH] Error generating token:', tokenError);
          // Still return user data even if token generation fails
          const { password, ...userWithoutPassword } = user as any;
          res.status(200).json(userWithoutPassword);
        }
      });
    })(req, res, next);
  });

  // Dedicated mobile login endpoint with explicit token generation
  app.post("/api/mobile/login", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const identifier = username || email;
      
      if (!identifier || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      let user = null;
      if (email || (identifier && identifier.includes('@'))) {
        user = await storage.getUserByEmail(identifier);
      }
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Verify password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Generate JWT token
      const token = generateToken(user);
      console.log(`[AUTH] Mobile login successful for user ${user.id}, token: ${token.substring(0, 20)}...`);

      // Return user data with token, excluding password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error('[AUTH] Mobile login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
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
      const baseUrl = getBaseUrl();
      
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
    // DEV BYPASS: Auto-login as admin user when no auth is present
    const hasUser = !!req.user;
    
    try {
      let userId: number;
      if (hasUser) {
        userId = req.user!.id;
      } else {
        // Auto-login as admin (id=2) for development
        const adminUser = await storage.getUserByUsername('admin');
        if (adminUser) {
          userId = adminUser.id;
          req.login(adminUser as any, () => {});
        } else {
          return res.status(401).json({ error: 'Not authenticated' });
        }
      }
      
      const freshUser = await storage.getUser(userId);
      if (!freshUser) {
        return res.status(401).json({ error: 'User not found' });
      }
      const { password: _password, ...safeUser } = freshUser as any;
      res.setHeader('Cache-Control', 'no-store');
      res.json(safeUser);
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
  app.get('/api/health', async (req, res) => {
    // Import here to avoid circular dependencies
    const { checkDatabaseConnection } = await import('./db');
    
    let dbHealthy = false;
    try {
      dbHealthy = await checkDatabaseConnection();
    } catch (error) {
      console.error('Health check DB error:', error);
    }
    
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      authenticated: !!req.user,
      session: !!req.sessionID,
      database: dbHealthy ? 'connected' : 'disconnected'
    });
  });
}
