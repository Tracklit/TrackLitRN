import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { VideoCleanupService } from "./video-cleanup";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint for Replit
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint for external access verification
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Debug endpoint to test authentication status
app.get('/debug-auth', (req, res) => {
  res.status(200).json({
    message: 'Debug endpoint reached',
    authenticated: !!req.user,
    userId: req.user?.id || null,
    sessionId: req.sessionID || null,
    timestamp: new Date().toISOString()
  });
});

// Add cache-busting middleware for development
app.use((req, res, next) => {
  // Prevent caching of JS, CSS, and HTML files during development
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.endsWith('.html') || req.url === '/') {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Simple debug route will be added after registerRoutes

// Simplified logging middleware for better performance
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      // Only log slow requests or errors to reduce overhead
      if (duration > 100 || res.statusCode >= 400) {
        log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
  }
  next();
});

(async () => {
  // Import scheduler utilities
  const { refreshAllGoogleSheetPrograms } = await import('./utils/scheduler');
  
  // Set up a daily refresh of Google Sheets data at midnight UTC
  setInterval(() => {
    const now = new Date();
    // Check if it's close to midnight (between 12:00 AM and 12:05 AM)
    if (now.getUTCHours() === 0 && now.getUTCMinutes() < 5) {
      console.log('Starting scheduled daily refresh of Google Sheets data...');
      refreshAllGoogleSheetPrograms()
        .then(() => console.log('Google Sheets data refresh completed successfully'))
        .catch(error => console.error('Error refreshing Google Sheets data:', error));
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Schedule initial refresh to run 30 seconds after server starts (non-blocking)
  setTimeout(() => {
    console.log('Running initial Google Sheets data refresh in background...');
    refreshAllGoogleSheetPrograms()
      .then(() => console.log('Initial Google Sheets data refresh completed'))
      .catch(error => console.error('Error during initial Google Sheets refresh:', error));
  }, 30000); // Wait 30 seconds after server starts

  // Initialize video cleanup service
  // Schedule video cleanup to run 60 seconds after server starts (non-blocking)
  setTimeout(() => {
    console.log('Initializing video cleanup service...');
    VideoCleanupService.schedulePeriodicCleanup();
  }, 60000); // Wait 60 seconds after server starts

  const server = await registerRoutes(app);

  // Add debug route after registerRoutes but before Vite
  app.get('/simple-test', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Simple Test</title></head>
      <body>
        <h1 style="color: green;">Simple Server Test Working!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <script>
          console.log("Basic JavaScript working");
          document.body.style.backgroundColor = "#001100";
        </script>
      </body>
      </html>
    `);
  });

  // Add health check endpoint for deployments
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = "0.0.0.0";
  
  // Add error handling for server startup
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      log(`Server error: ${err.message}`);
    }
  });

  server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
    console.log(`External URL: https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`);
    console.log('REPLIT_SERVER_READY');
  });
})();
