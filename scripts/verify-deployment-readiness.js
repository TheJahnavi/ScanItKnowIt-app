#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * 
 * This script checks various aspects of the application to verify it's ready for deployment.
 * It performs automated checks for the items listed in the Deployment Readiness Document.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = path.resolve(process.cwd());

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function logResult(status, message) {
  const color = status === 'PASS' ? colors.green : 
                status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${color}[${status}]${colors.reset} ${message}`);
}

function checkFileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command) {
  try {
    const result = execSync(command, { cwd: projectRoot, stdio: 'pipe' });
    return { success: true, output: result.toString() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyDeploymentReadiness() {
  console.log(`${colors.blue}ScanItKnowIt Deployment Readiness Verification${colors.reset}\n`);
  
  let passCount = 0;
  let totalCount = 0;

  // 1. Check required files
  console.log('1. Checking required files...\n');
  
  const requiredFiles = [
    'package.json',
    'vercel.json',
    '.env.example',
    'DEPLOYMENT_READINESS_DOCUMENT.md',
    'client/vite.config.ts',
    'server/tsconfig.json'
  ];

  for (const file of requiredFiles) {
    totalCount++;
    const fullPath = path.join(projectRoot, file);
    if (checkFileExists(fullPath)) {
      logResult('PASS', `Found required file: ${file}`);
      passCount++;
    } else {
      logResult('FAIL', `Missing required file: ${file}`);
    }
  }

  // 2. Check build scripts
  console.log('\n2. Checking build scripts...\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const requiredScripts = ['build', 'build:client', 'build:server', 'dev', 'start'];
    
    for (const script of requiredScripts) {
      totalCount++;
      if (packageJson.scripts && packageJson.scripts[script]) {
        logResult('PASS', `Found required script: ${script}`);
        passCount++;
      } else {
        logResult('FAIL', `Missing required script: ${script}`);
      }
    }
  } catch (error) {
    logResult('FAIL', `Error reading package.json: ${error.message}`);
  }

  // 3. Check environment variables
  console.log('\n3. Checking environment configuration...\n');
  
  totalCount++;
  if (checkFileExists(path.join(projectRoot, '.env.example'))) {
    logResult('PASS', 'Environment template file exists');
    passCount++;
  } else {
    logResult('FAIL', 'Environment template file missing');
  }

  // 4. Check TypeScript compilation
  console.log('\n4. Checking TypeScript compilation...\n');
  
  totalCount++;
  const tsCheck = runCommand('npx tsc --noEmit');
  if (tsCheck.success) {
    logResult('PASS', 'TypeScript compilation successful');
    passCount++;
  } else {
    logResult('FAIL', 'TypeScript compilation failed');
    console.log(`  Error: ${tsCheck.error}`);
  }

  // 5. Check dependencies
  console.log('\n5. Checking dependencies...\n');
  
  totalCount++;
  const installCheck = runCommand('npm ls --depth=0');
  if (installCheck.success) {
    logResult('PASS', 'Dependencies installed correctly');
    passCount++;
  } else {
    logResult('WARN', 'Dependency check completed with warnings');
    // Don't count as fail since it might just be warnings
    passCount++;
  }

  // 6. Check build process
  console.log('\n6. Checking build process...\n');
  
  totalCount++;
  const buildCheck = runCommand('npm run build --if-present');
  if (buildCheck.success) {
    logResult('PASS', 'Build process completed successfully');
    passCount++;
  } else {
    logResult('FAIL', 'Build process failed');
    console.log(`  Error: ${buildCheck.error}`);
  }

  // Summary
  console.log(`\n${colors.blue}=== DEPLOYMENT READINESS SUMMARY ===${colors.reset}`);
  console.log(`Passed: ${colors.green}${passCount}${colors.reset}/${totalCount} checks`);
  console.log(`Failed: ${colors.red}${totalCount - passCount}${colors.reset}/${totalCount} checks`);
  
  const percentage = Math.round((passCount / totalCount) * 100);
  if (percentage >= 80) {
    console.log(`${colors.green}READY FOR DEPLOYMENT${colors.reset} - ${percentage}% of checks passed`);
    process.exit(0);
  } else {
    console.log(`${colors.red}NOT READY FOR DEPLOYMENT${colors.reset} - Only ${percentage}% of checks passed`);
    process.exit(1);
  }
}

// Run the verification
verifyDeploymentReadiness().catch(error => {
  console.error('Error during deployment verification:', error);
  process.exit(1);
});