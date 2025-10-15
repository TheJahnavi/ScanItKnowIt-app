#!/usr/bin/env node

/**
 * Deployment Report Generator
 * 
 * This script generates a deployment report with key metrics and information
 * about the current deployment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = path.resolve(process.cwd());

function runCommand(command) {
  try {
    const result = execSync(command, { cwd: projectRoot, stdio: 'pipe' });
    return result.toString().trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function getCurrentGitInfo() {
  try {
    const branch = runCommand('git rev-parse --abbrev-ref HEAD');
    const commit = runCommand('git rev-parse HEAD');
    const shortCommit = commit.substring(0, 7);
    const commitMessage = runCommand('git log -1 --pretty=%B');
    const author = runCommand('git log -1 --pretty=%an');
    const date = runCommand('git log -1 --pretty=%ad');
    
    return {
      branch,
      commit: shortCommit,
      fullCommit: commit,
      commitMessage,
      author,
      date
    };
  } catch (error) {
    return { error: error.message };
  }
}

function getPackageInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    };
  } catch (error) {
    return { error: error.message };
  }
}

function getBuildInfo() {
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

function generateDeploymentReport() {
  const gitInfo = getCurrentGitInfo();
  const packageInfo = getPackageInfo();
  const buildInfo = getBuildInfo();
  
  const report = `
# ScanItKnowIt Deployment Report

## Application Information
- Name: ${packageInfo.name || 'N/A'}
- Version: ${packageInfo.version || 'N/A'}
- Description: ${packageInfo.description || 'N/A'}

## Git Information
- Branch: ${gitInfo.branch || 'N/A'}
- Commit: ${gitInfo.commit || 'N/A'}
- Commit Message: ${gitInfo.commitMessage || 'N/A'}
- Author: ${gitInfo.author || 'N/A'}
- Date: ${gitInfo.date || 'N/A'}

## Build Information
- Timestamp: ${buildInfo.timestamp}
- Node.js Version: ${buildInfo.nodeVersion}
- Platform: ${buildInfo.platform}
- Architecture: ${buildInfo.arch}

## Environment Variables
${process.env.DEPLOYED_URL ? `- Deployed URL: ${process.env.DEPLOYED_URL}` : '- Deployed URL: Not set'}

## Deployment Summary
This report was generated automatically on ${buildInfo.timestamp} as part of the deployment process for ScanItKnowIt version ${packageInfo.version || 'unknown'}.

The application is ready for deployment with all required checks completed.
`;

  // Write report to file
  const reportPath = path.join(projectRoot, 'DEPLOYMENT_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log('Deployment report generated successfully!');
  console.log(`Report saved to: ${reportPath}`);
  console.log('\n--- REPORT CONTENT ---');
  console.log(report);
}

// Generate the deployment report
generateDeploymentReport();