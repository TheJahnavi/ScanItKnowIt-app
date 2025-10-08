import express, { Application, Request, Response } from 'express';
import * as path from 'path';
import { registerRoutes } from './routes';

// Use Application type instead of Express
const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const clientDist = path.join(__dirname, '../../client/dist');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));

app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath);
});

registerRoutes(app);
export default app;