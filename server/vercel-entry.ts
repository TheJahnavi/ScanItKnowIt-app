import express, { Express, Request, Response } from 'express'; // Explicitly import types
import path from 'node:path';
import { registerRoutes } from './routes'; // Import route setup function

// Explicitly type the Express app
const app: Express = express();

// Add JSON middleware (required for req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve client static files (verify path to client/dist)
const clientDist = path.join(__dirname, '../client/dist'); // Adjust if client is nested deeper
app.use(express.static(clientDist));

// Catch-all route to serve client's index.html (type req/res explicitly)
app.get('*', (req: Request, res: Response) => {
  // Ensure clientDist/index.html exists
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Attach routes to the Express app (pass the typed app)
registerRoutes(app);

// Export the app for Vercel (required)
export default app;