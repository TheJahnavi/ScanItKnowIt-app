#!/usr/bin/env node
import { db } from './database.js';

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await db.initialize();
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