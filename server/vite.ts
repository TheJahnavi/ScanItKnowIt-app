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
  const distPath = path.resolve(__dirname, "..", "client", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
