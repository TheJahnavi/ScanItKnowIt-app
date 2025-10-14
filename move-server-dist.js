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
const apiDist = path.join(__dirname, 'api');
const rootDist = path.join(__dirname, 'dist');

console.log(`Moving files from ${serverDist} to ${rootDist}`);
moveFiles(serverDist, rootDist);

// Fix the import path in dist/index.js
const indexPath = path.join(rootDist, 'index.js');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  // Replace the import path in the index.js file
  indexContent = indexContent.replace(
    'import { registerRoutes } from "./routes.js";',
    'import { registerRoutes } from "../routes.js";'
  );
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Fixed import path in ${indexPath}`);
}

// Create the api/index.js file directly with correct import paths
console.log(`Creating dist/api/index.js with correct import paths`);
const apiDestDir = path.join(rootDist, 'api');
const apiDest = path.join(apiDestDir, 'index.js');

// Create the api directory in dist if it doesn't exist
if (!fs.existsSync(apiDestDir)) {
  fs.mkdirSync(apiDestDir, { recursive: true });
}

// Create the api/index.js file with correct import paths
const apiJsContent = `import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerRoutes } from '../routes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes should come before the catch-all route
registerRoutes(app);

// Serve client static files - corrected path for Vercel
const clientDist = path.join(__dirname, '../client');
console.log('Client dist path:', clientDist);
app.use(express.static(clientDist));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath);
});

// Export the app for serverless deployment
export default app;
`;

fs.writeFileSync(apiDest, apiJsContent);
console.log(`Created ${apiDest} with correct import paths`);