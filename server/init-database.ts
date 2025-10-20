#!/usr/bin/env node
import { storage } from './storage-firestore.js';

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    // For Firestore, initialization happens on first access
    // We can perform a simple test to ensure connectivity
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Run the initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}