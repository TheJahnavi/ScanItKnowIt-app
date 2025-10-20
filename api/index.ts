import serverApp from '../server/dist/index.js'; // Import the fully configured Express application from server's compiled output

// Export the app for serverless deployment
export default serverApp;

// Export individual HTTP methods for Vercel serverless functions
export const GET = serverApp;
export const POST = serverApp;
export const PUT = serverApp;
export const DELETE = serverApp;
export const PATCH = serverApp;