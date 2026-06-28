import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes, IMG_DIR } from "./routes";
import dotenv from "dotenv";
import { logger } from "./logger";

// Load environment variables
dotenv.config();

export const app = express();

// CORS — required when the frontend (GitHub Pages) and this API (Vercel) are on
// different origins. Has no effect in local dev because Vite's proxy forwards
// /api/* server-to-server, so the browser never sees a cross-origin request.
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://scanitknowit.com",
  credentials: true,
}));

// Serve saved product images. Must be registered before registerRoutes so the
// static handler takes priority over the Vite catch-all in development.
app.use("/api/images", express.static(IMG_DIR, { maxAge: "1d", etag: true }));

// Increase payload limits for image base64 strings
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

logger.info("=".repeat(60));
logger.info("Server starting — NODE_ENV:", process.env.NODE_ENV);
logger.info("GROQ_API_KEY present:        ", !!process.env.GROQ_API_KEY);
logger.info("GEMINI_API_KEY present:      ", !!process.env.GEMINI_API_KEY);
logger.info("OCR_API_KEY present:         ", !!process.env.OCR_API_KEY);
logger.info("USDA_API_KEY present:        ", !!process.env.USDA_API_KEY);
logger.info("Log file →", logger.filePath());
logger.info("=".repeat(60));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedBody: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedBody = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const ms = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      logger.api(req.method, reqPath, res.statusCode, ms,
        res.statusCode >= 400 ? capturedBody : undefined);
      const logLine = `${req.method} ${reqPath} ${res.statusCode} in ${ms}ms`;
      logger.info(logLine.length > 80 ? logLine.slice(0, 79) + "…" : logLine);
    }
  });

  next();
});

// Top-level await: module is ESM ("type":"module"). Routes must be registered
// before any request arrives — this guarantees that on both local dev and Vercel
// cold starts, the app is fully initialised before the export is consumed.
const server = await registerRoutes(app);

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  logger.error(`Unhandled error on ${req.method} ${req.path}:`, message, err.stack ?? "");
  res.status(status).json({ message });
});

// On Vercel, the runtime handles the HTTP server — skip setupVite, serveStatic,
// and listen. Vite is dynamically imported so its module graph (vite.config.ts,
// Replit plugins, etc.) is never pulled in during a Vercel cold start.
if (!process.env.VERCEL) {
  const { setupVite, serveStatic, log } = await import("./vite.js");

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "10000", 10);
  const host = "0.0.0.0";
  server.listen(port, host, () => {
    log(`[express] serving on ${host}:${port}`);
  });
}

export default app;
