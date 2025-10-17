#!/usr/bin/env node

// Simple deployment script for the backend
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting backend deployment...');

try {
  // Check if we're in the right directory
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run this script from the project root directory.');
  }

  // Parse package.json to get project info
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  console.log(`📦 Project: ${packageJson.name} v${packageJson.version}`);

  // Check Node.js version
  const nodeVersion = process.version;
  const requiredVersion = packageJson.engines?.node || '20.x';
  console.log(`🟢 Node.js version: ${nodeVersion} (required: ${requiredVersion})`);

  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the project
  console.log('🏗️ Building the project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Initialize database
  console.log('🗄️ Initializing database...');
  execSync('npm run init-db', { stdio: 'inherit' });

  // Check environment variables
  console.log('🔐 Checking environment variables...');
  const requiredEnvVars = [
    'OPENROUTER_API_KEY'
  ];

  const optionalEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'JWT_SECRET'
  ];

  const missingRequired = [];
  const missingOptional = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingRequired.push(envVar);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      missingOptional.push(envVar);
    }
  }

  if (missingRequired.length > 0) {
    console.warn('⚠️ Missing required environment variables:');
    missingRequired.forEach(envVar => console.warn(`   - ${envVar}`));
    console.warn('Please set these environment variables before starting the server.');
  }

  if (missingOptional.length > 0) {
    console.log('💡 Missing optional environment variables:');
    missingOptional.forEach(envVar => console.log(`   - ${envVar} (optional)`));
  }

  if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are set.');
  }

  // Show deployment options
  console.log('\n📋 Deployment options:');
  console.log('1. Vercel: vercel --prod');
  console.log('2. Render: git push origin main (with auto-deploy)');
  console.log('3. Heroku: git push heroku main');
  console.log('4. Local testing: npm start');

  console.log('\n✅ Backend deployment preparation completed!');
  console.log('Next steps:');
  console.log('1. Set up environment variables');
  console.log('2. Choose your deployment platform');
  console.log('3. Deploy using the appropriate method');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}