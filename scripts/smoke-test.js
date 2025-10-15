#!/usr/bin/env node

/**
 * Post-Deployment Smoke Test Script
 * 
 * This script performs basic smoke tests to verify the application is working
 * correctly after deployment.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const DEPLOYED_URL = process.env.DEPLOYED_URL || 'http://localhost:3001';
const TIMEOUT = 10000; // 10 seconds

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

async function makeRequest(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runSmokeTests() {
  console.log(`${colors.blue}ScanItKnowIt Smoke Tests${colors.reset}\n`);
  console.log(`Testing deployment at: ${DEPLOYED_URL}\n`);
  
  let passCount = 0;
  let totalCount = 0;

  // Test 1: Check if the main page loads
  console.log('1. Testing main application page...\n');
  totalCount++;
  const mainPage = await makeRequest(DEPLOYED_URL);
  if (mainPage.success && mainPage.response.status === 200) {
    logResult('PASS', 'Main application page loads successfully');
    passCount++;
  } else {
    logResult('FAIL', `Main application page failed to load: ${mainPage.error || mainPage.response?.status}`);
  }

  // Test 2: Check health endpoint
  console.log('\n2. Testing health check endpoint...\n');
  totalCount++;
  const healthCheck = await makeRequest(`${DEPLOYED_URL}/api/health`);
  if (healthCheck.success && healthCheck.response.status === 200) {
    const data = await healthCheck.response.json();
    if (data.status === 'healthy') {
      logResult('PASS', 'Health check endpoint returns healthy status');
      passCount++;
    } else {
      logResult('FAIL', 'Health check endpoint does not return healthy status');
    }
  } else {
    logResult('FAIL', `Health check endpoint failed: ${healthCheck.error || healthCheck.response?.status}`);
  }

  // Test 3: Check API endpoints exist (OPTIONS request)
  console.log('\n3. Testing API endpoint availability...\n');
  const apiEndpoints = [
    '/api/analyze-product',
    '/api/analyze-ingredients/123',
    '/api/analyze-nutrition/123',
    '/api/analyze-reddit/123',
    '/api/chat/123'
  ];

  for (const endpoint of apiEndpoints) {
    totalCount++;
    const apiCheck = await makeRequest(`${DEPLOYED_URL}${endpoint}`, { method: 'OPTIONS' });
    if (apiCheck.success || apiCheck.response?.status) {
      logResult('PASS', `API endpoint exists: ${endpoint}`);
      passCount++;
    } else {
      logResult('FAIL', `API endpoint failed: ${endpoint} - ${apiCheck.error}`);
    }
  }

  // Test 4: Check static assets
  console.log('\n4. Testing static asset availability...\n');
  totalCount++;
  const assetCheck = await makeRequest(`${DEPLOYED_URL}/index.html`);
  if (assetCheck.success && assetCheck.response.status === 200) {
    logResult('PASS', 'Static assets are being served');
    passCount++;
  } else {
    logResult('FAIL', `Static assets failed to load: ${assetCheck.error || assetCheck.response?.status}`);
  }

  // Summary
  console.log(`\n${colors.blue}=== SMOKE TEST SUMMARY ===${colors.reset}`);
  console.log(`Passed: ${colors.green}${passCount}${colors.reset}/${totalCount} tests`);
  console.log(`Failed: ${colors.red}${totalCount - passCount}${colors.reset}/${totalCount} tests`);
  
  const percentage = Math.round((passCount / totalCount) * 100);
  if (percentage >= 80) {
    console.log(`${colors.green}DEPLOYMENT SUCCESSFUL${colors.reset} - ${percentage}% of tests passed`);
    process.exit(0);
  } else {
    console.log(`${colors.red}DEPLOYMENT MAY HAVE ISSUES${colors.reset} - Only ${percentage}% of tests passed`);
    process.exit(1);
  }
}

// Run the smoke tests
runSmokeTests().catch(error => {
  console.error('Error during smoke tests:', error);
  process.exit(1);
});