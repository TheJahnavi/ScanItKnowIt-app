import express, { Express, Request, Response } from 'express'; // Explicitly import types
import path from 'node:path';
import { registerRoutes } from './routes'; // Import route setup function (using registerRoutes)

// Explicitly type the Express app
const app: Express = express();

// Add middleware (now recognized by TypeScript)
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses form data

// Serve client static files (verify path)
const clientDist = path.join(__dirname, '../../client/dist'); // Adjust path for Vercel environment
console.log('Client dist path:', clientDist); // Log to validate during deployment
app.use(express.static(clientDist));

// Catch-all route to serve client's index.html (explicit typing)
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath); // Verify indexPath exists in logs
});

// Attach routes to the Express app
registerRoutes(app);

// Export the app for Vercel (CRITICAL for serverless deployment)
export default app;