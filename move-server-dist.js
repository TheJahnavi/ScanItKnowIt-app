import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// Copy the api directory to dist
console.log(`Copying files from ${apiDist} to ${rootDist}`);
// Create the api directory in dist if it doesn't exist
const distApiDir = path.join(rootDist, 'api');
if (!fs.existsSync(distApiDir)) {
  fs.mkdirSync(distApiDir, { recursive: true });
}

// Copy the api/index.ts file to dist/api/index.ts
const apiSource = path.join(apiDist, 'index.ts');
const apiDest = path.join(distApiDir, 'index.ts');
if (fs.existsSync(apiSource)) {
  fs.copyFileSync(apiSource, apiDest);
  console.log(`Copied ${apiSource} to ${apiDest}`);
}