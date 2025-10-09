import express from 'express';
import path from 'node:path';
import { registerRoutes } from './routes';

// Explicitly type app using express.Application
const app: express.Application = express();

// Middleware (now recognized by TypeScript)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve client static files
const clientDist = path.join(__dirname, '../../client/dist');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath); // Now recognized (express.Response includes sendFile)
});

// Attach routes
registerRoutes(app);

// Export the app for serverless deployment
export default app;