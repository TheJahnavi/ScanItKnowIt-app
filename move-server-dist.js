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