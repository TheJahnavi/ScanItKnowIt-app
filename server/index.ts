import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;  // Renamed from 'path' to 'requestPath' to avoid shadowing the imported 'path' module
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {  // Use the renamed variable
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;  // Use the renamed variable
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

// Register routes
registerRoutes(app);

// Serve static files in production or when deployed to Vercel
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  // Use path.resolve with __dirname to get the correct path
  const distPath = path.resolve(__dirname, "..", "client", "dist");
  
  // Serve static files
  app.use(express.static(distPath));
  
  // Catch-all route to serve index.html for client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// For Vercel, we need to export the app
export default app;