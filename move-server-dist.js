import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to move files recursively
function moveFiles(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory ${src} does not exist`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      // Recursively move subdirectories
      moveFiles(srcPath, destPath);
    } else {
      // Move file
      fs.renameSync(srcPath, destPath);
      console.log(`Moved ${srcPath} to ${destPath}`);
    }
  });

  // Remove empty source directory
  try {
    fs.rmSync(src, { recursive: true, force: true });
    console.log(`Removed empty directory ${src}`);
  } catch (err) {
    console.log(`Could not remove directory ${src}: ${err.message}`);
  }
}

// Use explicit paths - script is in root, so we need to look for server/dist
const serverDist = path.join(__dirname, 'server', 'dist');
const rootDist = path.join(__dirname, 'dist');

console.log(`Moving files from ${serverDist} to ${rootDist}`);
moveFiles(serverDist, rootDist);

// Delete the full server file, as it is only needed for local dev, not Vercel deployment
const indexPath = path.join(rootDist, 'index.js');
if (fs.existsSync(indexPath)) {
  fs.unlinkSync(indexPath);
  console.log(`Deleted extraneous full server file: ${indexPath} to prevent Vercel routing conflict.`);
}

// **DELETE the incorrect API file that was moved from server/dist/api/index.js**
const incorrectApiPath = path.join(rootDist, 'api', 'index.js');
if (fs.existsSync(incorrectApiPath)) {
  fs.unlinkSync(incorrectApiPath);
  console.log(`Deleted incorrect API file: ${incorrectApiPath}`);
}

// Create the api/index.js file directly with correct import paths
console.log(`Creating dist/api/index.js with correct import paths`);
const apiDestDir = path.join(rootDist, 'api');
const apiDest = path.join(apiDestDir, 'index.js');

// Create the api directory in dist if it doesn't exist
if (!fs.existsSync(apiDestDir)) {
  fs.mkdirSync(apiDestDir, { recursive: true });
}

// Create the api/index.js file with simplified content for Vercel serverless functions
const apiJsContent = `import express from 'express';
import { registerRoutes } from '../routes.js';

const app = express();

// Middleware (Keep only necessary server middleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register ONLY the API routes
registerRoutes(app);

// NOTE: Add your global error handler here if you have one.
// app.use((err, req, res, next) => { ... });

// Export the app for Vercel serverless deployment
export default app;
`;

fs.writeFileSync(apiDest, apiJsContent);
console.log(`Created ${apiDest} with correct import paths`);