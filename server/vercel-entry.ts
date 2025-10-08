import express, { type Express, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app: Express = express();

// Middleware for JSON parsing
app.use(express.json()); // Parses JSON payloads (enables req.body)
app.use(express.urlencoded({ extended: true })); // Parses form data

// Register all routes
registerRoutes(app);

// Serve static files in production (for Vercel)
if (process.env.NODE_ENV === "production") {
  // Use path.resolve with __dirname to get the correct path
  const distPath = path.resolve(__dirname, "..", "client", "dist");
  
  // Serve static files
  app.use(express.static(distPath));
  
  // Catch-all route to serve index.html for client-side routing
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Export the app for Vercel
export default app;
export const config = {
  api: {
    bodyParser: true,
  },
};