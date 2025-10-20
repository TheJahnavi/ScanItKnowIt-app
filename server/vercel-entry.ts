import app from './index.js';

// For Vercel serverless functions, we only need to export the app instance
// Do not start the server with app.listen() as this will cause timeouts
export default app;