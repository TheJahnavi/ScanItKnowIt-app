import { db as sqliteDb } from './database.js';
import { db as firestoreDb } from './firebase.js';
import { logger } from './utils/logger.js';

/**
 * Migration script to transfer data from SQLite to Firestore
 * 
 * This script should be run once to migrate existing data from SQLite to Firestore
 * 
 * Usage:
 * 1. Make sure both SQLite and Firestore are configured
 * 2. Run: npx tsx migrate-to-firestore.ts
 */

async function migrateUsers() {
  try {
    logger.info("Starting users migration");
    
    // Get all users from SQLite
    const sqliteUsers = await sqliteDb.getAllUsers();
    
    for (const user of sqliteUsers) {
      // Check if user already exists in Firestore
      const userDoc = await firestoreDb.collection('users').doc(user.id).get();
      
      if (!userDoc.exists) {
        // Create user in Firestore
        await firestoreDb.collection('users').doc(user.id).set({
          username: user.username,
          password: user.password,
          createdAt: user.createdAt
        });
        logger.info("Migrated user", { userId: user.id, username: user.username });
      } else {
        logger.debug("User already exists in Firestore", { userId: user.id });
      }
    }
    
    logger.info("Users migration completed", { count: sqliteUsers.length });
  } catch (error) {
    logger.error("Users migration failed", { error: (error as Error).message });
    throw error;
  }
}

async function migrateProductAnalyses() {
  try {
    logger.info("Starting product analyses migration");
    
    // Get all analyses from SQLite
    const sqliteAnalyses = await sqliteDb.getAllProductAnalyses();
    
    for (const analysis of sqliteAnalyses) {
      // Check if analysis already exists in Firestore
      const analysisDoc = await firestoreDb.collection('product_analyses').doc(analysis.id).get();
      
      if (!analysisDoc.exists) {
        // Create analysis in Firestore
        await firestoreDb.collection('product_analyses').doc(analysis.id).set({
          userId: analysis.userId,
          productName: analysis.productName,
          productSummary: analysis.productSummary,
          extractedText: analysis.extractedText ? JSON.stringify(analysis.extractedText) : null,
          imageUrl: analysis.imageUrl,
          ingredientsData: analysis.ingredientsData ? JSON.stringify(analysis.ingredientsData) : null,
          nutritionData: analysis.nutritionData ? JSON.stringify(analysis.nutritionData) : null,
          redditData: analysis.redditData ? JSON.stringify(analysis.redditData) : null,
          createdAt: analysis.createdAt
        });
        logger.info("Migrated product analysis", { analysisId: analysis.id, userId: analysis.userId });
      } else {
        logger.debug("Product analysis already exists in Firestore", { analysisId: analysis.id });
      }
    }
    
    logger.info("Product analyses migration completed", { count: sqliteAnalyses.length });
  } catch (error) {
    logger.error("Product analyses migration failed", { error: (error as Error).message });
    throw error;
  }
}

async function migrateChatMessages() {
  try {
    logger.info("Starting chat messages migration");
    
    // Get all messages from SQLite
    const sqliteMessages = await sqliteDb.getAllChatMessages();
    
    for (const message of sqliteMessages) {
      // Check if message already exists in Firestore
      const messageDoc = await firestoreDb.collection('chat_messages').doc(message.id).get();
      
      if (!messageDoc.exists) {
        // Create message in Firestore
        await firestoreDb.collection('chat_messages').doc(message.id).set({
          analysisId: message.analysisId,
          userId: message.userId,
          message: message.message,
          response: message.response,
          createdAt: message.createdAt
        });
        logger.info("Migrated chat message", { messageId: message.id, analysisId: message.analysisId });
      } else {
        logger.debug("Chat message already exists in Firestore", { messageId: message.id });
      }
    }
    
    logger.info("Chat messages migration completed", { count: sqliteMessages.length });
  } catch (error) {
    logger.error("Chat messages migration failed", { error: (error as Error).message });
    throw error;
  }
}

async function runMigration() {
  try {
    logger.info("Starting database migration from SQLite to Firestore");
    
    // Initialize SQLite database
    await sqliteDb.initialize();
    
    // Run migrations
    await migrateUsers();
    await migrateProductAnalyses();
    await migrateChatMessages();
    
    logger.info("Database migration completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database migration failed", { error: (error as Error).message });
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}