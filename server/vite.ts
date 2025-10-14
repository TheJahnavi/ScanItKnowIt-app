import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Remove vite imports that are causing issues
// We'll use a simpler approach for static file serving

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Simplified setupVite function
export async function setupVite(app: Express, server: Server) {
  // In a production Vercel environment, we don't need vite
  if (process.env.VERCEL) {
    return;
  }
  
  // For local development, we can add vite middleware here if needed
  // But for now, we'll keep it simple
  console.log("Vite setup would go here in development");
}

// Simplified serveStatic function
export function serveStatic(app: Express) {
  // Updated to match the client's dist directory
  const distPath = path.resolve(__dirname, "..", "client", "dist");

  // In Vercel environment, we might not have access to the file system in the same way
  // so we should handle this more gracefully
  try {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));

      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // In Vercel environment, static files are served differently
      // so we just log a warning and continue
      console.warn(`Client dist directory not found at ${distPath}, skipping static file serving`);
    }
  } catch (error) {
    // Handle any file system errors gracefully
    console.warn(`Error accessing client dist directory at ${distPath}:`, error);
  }
}