import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { logger } from "./utils/logger.js";
import path from "path";

const app: Express = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
      logger.logApiRequest(req.method, requestPath, res.statusCode, duration);
    }
  });

  next();
});

// Register routes
registerRoutes(app);

// Serve static files in production (but not in Vercel serverless environment)
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
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
  
  logger.error("Unhandled error", { error: err, status, message });

  res.status(status).json({ message });
  throw err;
});

// For Vercel, we need to export the app
export default app;

// Add server listener for local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3002; // Changed to 3002 to avoid conflicts
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
