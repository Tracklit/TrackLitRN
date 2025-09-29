import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  // Cache the template and only reload when needed for better performance
  let cachedTemplate: string | null = null;
  let templateModTime: number = 0;
  
  const getTemplate = async () => {
    const clientTemplate = path.resolve(
      import.meta.dirname,
      "..",
      "client",
      "index.html",
    );
    
    const stat = await fs.promises.stat(clientTemplate);
    if (!cachedTemplate || stat.mtimeMs > templateModTime) {
      cachedTemplate = await fs.promises.readFile(clientTemplate, "utf-8");
      templateModTime = stat.mtimeMs;
    }
    return cachedTemplate;
  };

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template = await getTemplate();
      
      // Only add cache busting in development, and use a less expensive method
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Date.now()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  console.log(`Setting up static file serving from: ${distPath}`);

  // Serve assets directory with explicit middleware 
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    setHeaders: (res, filePath) => {
      console.log(`Serving asset: ${filePath}`);
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));

  // Serve other static files (images, manifest, etc.)
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist (but skip /assets/ requests)
  app.use("*", (req, res, next) => {
    // Don't serve index.html for asset requests - let them 404 instead
    if (req.originalUrl.startsWith('/assets/')) {
      console.log(`Skipping index.html fallback for asset request: ${req.originalUrl}`);
      return res.status(404).send('Asset not found');
    }
    
    console.log(`Serving index.html fallback for: ${req.originalUrl}`);
    // Ensure HTML is never cached to prevent stale app issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
