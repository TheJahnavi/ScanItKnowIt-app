import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Define Paths ---
// Source: The compiled server code inside the server directory (e.g., /server/dist)
const serverDist = path.join(__dirname, 'server', 'dist');
// Destination: The final serverless function location Vercel expects (e.g., /dist/server)
const finalDestination = path.join(__dirname, 'dist', 'server');

console.log(`Starting robust file move: ${serverDist} -> ${finalDestination}`);

try {
  // 1. Ensure the destination path's parent directory exists (e.g., ensures /dist exists)
  if (!fs.existsSync(path.dirname(finalDestination))) {
    fs.mkdirSync(path.dirname(finalDestination), { recursive: true });
  }

  // 2. Use the single, robust fs.cpSync function to copy the directory recursively.
  // This replaces the entire manual moveFiles function.
  fs.cpSync(serverDist, finalDestination, { recursive: true, force: true });
  console.log(`Successfully copied contents from ${serverDist} to ${finalDestination}`);

  // 3. Clean up the source directory
  if (fs.existsSync(serverDist)) {
    // fs.rmSync is the most reliable way to remove a directory recursively
    fs.rmSync(serverDist, { recursive: true, force: true });
    console.log(`Successfully removed source directory ${serverDist}`);
  }

  console.log('Server files moved successfully.');
} catch (error) {
  console.error('FATAL ERROR DURING FILE MOVE:', error.message);
  // Re-throw the error to ensure Vercel sees the exit code 1 clearly
  throw error;
}