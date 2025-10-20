import express, { Application } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from '../server/routes.js'; // Import from server directory

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes should come before the catch-all route
// Using type assertion to resolve type mismatch between root and server directories
registerRoutes(app as any);

// Serve client static files - corrected path for Vercel
const clientDist = path.join(__dirname, '../client');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath);
});

// Export the app for serverless deployment
export default app;

// Export individual HTTP methods for Vercel serverless functions
export const GET = app;
export const POST = app;
export const PUT = app;
export const DELETE = app;
export const PATCH = app;