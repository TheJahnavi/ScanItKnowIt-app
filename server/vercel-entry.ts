import express, { Application, Request, Response } from 'express'; // Import types directly
import path from 'node:path';
import { registerRoutes } from './routes';

// Explicitly type the app as Express.Application
const app: Application = express();

// Middleware (now recognized by TypeScript)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve client static files
const clientDist = path.join(__dirname, '../../client/dist');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));

// Catch-all route to serve index.html (with explicit types)
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath); // TypeScript now recognizes sendFile on Response
});

// Attach routes
registerRoutes(app);

// Export the app for serverless deployment
export default app;