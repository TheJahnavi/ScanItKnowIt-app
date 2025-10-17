import { FirestoreStorage } from './storage-firestore.js';

/**
 * Simple test script to verify Firestore storage implementation
 * 
 * This script tests the basic functionality of the Firestore storage implementation
 * 
 * Usage:
 * 1. Make sure Firebase is configured with environment variables
 * 2. Run: npx tsx test-firestore.ts
 */

async function testFirestoreStorage() {
  try {
    console.log("Testing Firestore storage implementation...");
    
    const storage = new FirestoreStorage();
    
    // Test user creation
    console.log("Creating test user...");
    const user = await storage.createUser({
      username: 'testuser',
      password: 'testpassword'
    });
    console.log("User created:", user);
    
    // Test getting user by ID
    console.log("Getting user by ID...");
    const retrievedUser = await storage.getUser(user.id);
    console.log("User retrieved by ID:", retrievedUser);
    
    // Test getting user by username
    console.log("Getting user by username...");
    const retrievedUserByUsername = await storage.getUserByUsername('testuser');
    console.log("User retrieved by username:", retrievedUserByUsername);
    
    // Test product analysis creation
    console.log("Creating product analysis...");
    const analysis = await storage.createProductAnalysis({
      userId: user.id,
      productName: 'Test Product',
      productSummary: 'This is a test product',
      extractedText: { text: 'Extracted text' },
      imageUrl: null,
      ingredientsData: null,
      nutritionData: null,
      redditData: null
    });
    console.log("Product analysis created:", analysis);
    
    // Test getting product analysis
    console.log("Getting product analysis...");
    const retrievedAnalysis = await storage.getProductAnalysis(analysis.id);
    console.log("Product analysis retrieved:", retrievedAnalysis);
    
    // Test updating product analysis
    console.log("Updating product analysis...");
    await storage.updateProductAnalysis(analysis.id, {
      productSummary: 'Updated test product summary'
    });
    console.log("Product analysis updated");
    
    // Verify update
    const updatedAnalysis = await storage.getProductAnalysis(analysis.id);
    console.log("Updated product analysis:", updatedAnalysis);
    
    // Test chat message creation
    console.log("Creating chat message...");
    const chatMessage = await storage.createChatMessage({
      analysisId: analysis.id,
      userId: user.id,
      message: 'Test message',
      response: 'Test response'
    });
    console.log("Chat message created:", chatMessage);
    
    // Test getting chat messages
    console.log("Getting chat messages...");
    const chatMessages = await storage.getChatMessages(analysis.id);
    console.log("Chat messages retrieved:", chatMessages);
    
    // Test getting user analyses
    console.log("Getting user analyses...");
    const userAnalyses = await storage.getUserAnalyses(user.id);
    console.log("User analyses retrieved:", userAnalyses.length);
    
    console.log("All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirestoreStorage();
}