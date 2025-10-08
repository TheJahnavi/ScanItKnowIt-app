import express, { Express, Request, Response } from 'express';
import path from 'node:path';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Add JSON middleware (required for req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correct path to client's dist directory (adjust based on your project structure)
const clientDist = path.join(__dirname, '../client/dist'); // Example: If server is in project-root/server, client is in project-root/client
console.log('Client dist path:', clientDist); // Log to validate during server startup
app.use(express.static(clientDist)); // Serve client static files

// Catch-all route to serve client's index.html (type req/res explicitly)
app.get('*', (req: Request, res: Response) => {
  // Ensure index.html exists in clientDist
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Export the app for Vercel (required)
export default app;