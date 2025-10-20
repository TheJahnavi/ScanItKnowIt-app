#!/usr/bin/env node

/**
 * Deployment script for ScanItKnowIt application
 * 
 * This script automates the deployment process to Vercel
 * It assumes you have:
 * 1. Vercel CLI installed (npm install -g vercel)
 * 2. Logged in to Vercel (vercel login)
 * 3. Environment variables set up in Vercel
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`ERROR: ${message}`, colors.red);
}

function success(message) {
  log(`SUCCESS: ${message}`, colors.green);
}

function warning(message) {
  log(`WARNING: ${message}`, colors.yellow);
}

function info(message) {
  log(`INFO: ${message}`, colors.blue);
}

async function deploy() {
  try {
    log('Starting deployment process...', colors.blue);
    
    // Check if we're in the right directory
    const serverDir = join(process.cwd(), 'server');
    if (!existsSync(serverDir)) {
      error('Server directory not found. Please run this script from the project root.');
      process.exit(1);
    }
    
    process.chdir(serverDir);
    info('Changed to server directory');
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      info('Vercel CLI is installed');
    } catch (err) {
      error('Vercel CLI is not installed. Please install it with: npm install -g vercel');
      process.exit(1);
    }
    
    // Check if we're logged in to Vercel
    try {
      const user = execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' });
      info(`Logged in to Vercel as: ${user.trim()}`);
    } catch (err) {
      warning('Not logged in to Vercel. Please run: vercel login');
      const answer = await question('Would you like to continue anyway? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
    }
    
    // Run TypeScript build
    log('Building TypeScript files...', colors.blue);
    try {
      execSync('npm run build', { stdio: 'inherit' });
      success('Build completed successfully');
    } catch (err) {
      error('Build failed. Please check for TypeScript errors.');
      process.exit(1);
    }
    
    // Check environment variables
    log('Checking environment variables...', colors.blue);
    const requiredEnvVars = ['JWT_SECRET', 'OPENROUTER_API_KEY'];
    const missingEnvVars = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingEnvVars.push(envVar);
      }
    }
    
    if (missingEnvVars.length > 0) {
      warning(`The following required environment variables are not set locally: ${missingEnvVars.join(', ')}`);
      warning('Make sure they are set in Vercel environment variables.');
    } else {
      success('All required environment variables are set locally');
    }
    
    // Deploy to Vercel
    log('Deploying to Vercel...', colors.blue);
    try {
      const deployOutput = execSync('vercel --prod --confirm', { encoding: 'utf8' });
      console.log(deployOutput);
      success('Deployment completed successfully!');
      
      // Extract deployment URL
      const urlMatch = deployOutput.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        log(`Deployment URL: ${urlMatch[0]}`, colors.green);
      }
    } catch (err) {
      error('Deployment failed.');
      console.error(err.message);
      process.exit(1);
    }
    
  } catch (err) {
    error('Deployment process failed with an unexpected error.');
    console.error(err);
    process.exit(1);
  }
}

// Simple function to ask user questions (synchronous)
function question(query) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run deployment
if (require.main === module) {
  deploy();
}

export default deploy;