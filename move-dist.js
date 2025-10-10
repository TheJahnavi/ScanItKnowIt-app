import fs from 'fs';
import path from 'path';

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
  fs.rmdirSync(src);
  console.log(`Removed empty directory ${src}`);
}

// Move dist files from server to root
const serverDist = path.join(process.cwd(), 'dist');
const rootDist = path.join(process.cwd(), '..', 'dist');

console.log(`Moving files from ${serverDist} to ${rootDist}`);
moveFiles(serverDist, rootDist);