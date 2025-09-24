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

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Simple debug route will be added after registerRoutes

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

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

  // Schedule initial refresh to run in background after server starts
  // This ensures the server is responsive immediately while data processing happens asynchronously
  setImmediate(() => {
    console.log('Running initial Google Sheets data refresh in background...');
    refreshAllGoogleSheetPrograms()
      .then(() => console.log('Initial Google Sheets data refresh completed'))
      .catch(error => console.error('Error during initial Google Sheets refresh:', error));
  });

  // Initialize video cleanup service
  console.log('Initializing video cleanup service...');
  VideoCleanupService.schedulePeriodicCleanup();

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
