import app from "../index.js";

// Vercel requires a default export for serverless functions
export default app;

// Export individual HTTP methods for Vercel serverless functions
export const GET = app;
export const POST = app;
export const PUT = app;
export const DELETE = app;
export const PATCH = app;