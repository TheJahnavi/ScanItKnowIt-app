// Vercel serverless entry point.
// @vercel/node wraps the exported Express app as a serverless function.
// All /api/* rewrites in vercel.json land here.
import app from "../server/index.js";
export default app;
