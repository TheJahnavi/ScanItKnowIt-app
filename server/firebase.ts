import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from './utils/logger.js';

// Initialize Firebase Admin SDK
let app;
let db;

try {
  // Check if Firebase environment variables are set
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // In production, you would use environment variables for these values
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    logger.info("Firebase Admin SDK initialized successfully with credentials");
  } else {
    // For local development without Firebase credentials, don't initialize Firebase at all
    logger.warn("Firebase credentials not found, skipping Firebase initialization for local development");
    app = null;
    db = null;
  }
} catch (error) {
  logger.error("Failed to initialize Firebase Admin SDK", { error: (error as Error).message });
  // Don't initialize Firebase for local development
  app = null;
  db = null;
}

// Initialize Firestore only if app is initialized
if (app) {
  db = getFirestore(app);
}

export { db };