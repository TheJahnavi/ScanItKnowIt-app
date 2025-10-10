import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from './routes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const clientDist = path.join(__dirname, '../client/dist');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));
registerRoutes(app);
app.get('*', (req, res) => {
    const indexPath = path.join(clientDist, 'index.html');
    res.sendFile(indexPath);
});
export default app;
