import express, { type Express } from "express";
import { registerRoutes } from "./routes";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
registerRoutes(app);

// Export the app for Vercel
export default app;
export const config = {
  api: {
    bodyParser: true,
  },
};