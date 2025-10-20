import { logger } from './utils/logger.js';

// Define interfaces for our data models
export interface User {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  createdAt: Date;
}

export interface ProductAnalysis {
  id: string;
  userId: string; // Associate with user
  productName: string;
  productSummary: string;
  extractedText: any;
  imageUrl: string | null;
  ingredientsData: any | null;
  nutritionData: any | null;
  redditData: any | null;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  analysisId: string;
  userId: string; // Associate with user
  message: string;
  response: string;
  createdAt: Date;
}

// Mock database for local development
const mockDb = {
  users: new Map<string, any>(),
  analyses: new Map<string, any>(),
  messages: new Map<string, any>(),
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => {
        if (name === 'users') {
          return {
            exists: mockDb.users.has(id),
            data: () => mockDb.users.get(id)
          };
        } else if (name === 'product_analyses') {
          return {
            exists: mockDb.analyses.has(id),
            data: () => mockDb.analyses.get(id)
          };
        } else if (name === 'chat_messages') {
          return {
            exists: mockDb.messages.has(id),
            data: () => mockDb.messages.get(id)
          };
        }
      },
      update: async (data: any) => {
        if (name === 'users') {
          mockDb.users.set(id, { ...mockDb.users.get(id), ...data });
        } else if (name === 'product_analyses') {
          mockDb.analyses.set(id, { ...mockDb.analyses.get(id), ...data });
        } else if (name === 'chat_messages') {
          mockDb.messages.set(id, { ...mockDb.messages.get(id), ...data });
        }
      }
    }),
    add: async (data: any) => {
      const id = `mock-id-${Date.now()}`;
      if (name === 'users') {
        mockDb.users.set(id, data);
      } else if (name === 'product_analyses') {
        mockDb.analyses.set(id, data);
      } else if (name === 'chat_messages') {
        mockDb.messages.set(id, data);
      }
      return {
        id,
        get: async () => ({
          data: () => data
        })
      };
    },
    where: (field: string, operator: string, value: any) => ({
      limit: () => ({
        get: async () => {
          const results: any[] = [];
          if (name === 'users') {
            mockDb.users.forEach((doc, docId) => {
              if (doc[field] === value) {
                results.push({
                  id: docId,
                  data: () => doc
                });
              }
            });
          } else if (name === 'product_analyses') {
            mockDb.analyses.forEach((doc, docId) => {
              if (doc[field] === value) {
                results.push({
                  id: docId,
                  data: () => doc
                });
              }
            });
          } else if (name === 'chat_messages') {
            mockDb.messages.forEach((doc, docId) => {
              if (doc[field] === value) {
                results.push({
                  id: docId,
                  data: () => doc
                });
              }
            });
          }
          return {
            empty: results.length === 0,
            docs: results
          };
        }
      })
    }),
    orderBy: (field: string, direction: string = 'asc') => ({
      get: async () => {
        const results: any[] = [];
        if (name === 'users') {
          mockDb.users.forEach((doc, docId) => {
            results.push({
              id: docId,
              data: () => doc
            });
          });
        } else if (name === 'product_analyses') {
          mockDb.analyses.forEach((doc, docId) => {
            results.push({
              id: docId,
              data: () => doc
            });
          });
        } else if (name === 'chat_messages') {
          mockDb.messages.forEach((doc, docId) => {
            results.push({
              id: docId,
              data: () => doc
            });
          });
        }
        return {
          forEach: (callback: any) => {
            results.sort((a, b) => {
              if (direction === 'asc') {
                return a.data()[field] < b.data()[field] ? -1 : 1;
              } else {
                return a.data()[field] > b.data()[field] ? -1 : 1;
              }
            });
            results.forEach(callback);
          }
        };
      }
    })
  })
};

// Function to initialize database connection
async function initializeDb() {
  // Try to import Firebase, but provide fallback for local development
  let db: any;
  let firebase: any;

  try {
    firebase = await import('./firebase.js');
    // Check if Firebase was initialized
    if (firebase.db) {
      db = firebase.db;
      logger.info("Using Firebase Firestore for storage");
    } else {
      // Firebase not initialized, use mock storage
      db = mockDb;
      logger.info("Firebase not initialized, using mock storage for local development");
    }
  } catch (error) {
    db = mockDb;
    logger.warn("Firebase not available, using mock storage for local development", { error: (error as Error).message });
  }
  
  return db;
}

// Initialize the database connection
const dbPromise = initializeDb();

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string }): Promise<User>;
  
  createProductAnalysis(analysis: any): Promise<ProductAnalysis>;
  getProductAnalysis(id: string): Promise<ProductAnalysis | undefined>;
  updateProductAnalysis(id: string, updates: any): Promise<void>;
  
  createChatMessage(message: any): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
  
  getUserAnalyses(userId: string): Promise<ProductAnalysis[]>;
}

export class FirestoreStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const db = await dbPromise;
      logger.debug("Firestore Storage: Getting user by ID", { userId: id });
      const userDoc = await db.collection('users').doc(id).get();
      
      if (!userDoc.exists) {
        logger.debug("Firestore Storage: User not found", { userId: id });
        return undefined;
      }
      
      const userData = userDoc.data();
      if (!userData) return undefined;
      
      return {
        id: userDoc.id,
        username: userData.username,
        password: userData.password,
        createdAt: userData.createdAt.toDate ? userData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to get user by ID", { error: (error as Error).message, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = await dbPromise;
      logger.debug("Firestore Storage: Getting user by username", { username });
      const userQuery = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();
      
      if (userQuery.empty) {
        logger.debug("Firestore Storage: User not found by username", { username });
        return undefined;
      }
      
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();
      
      return {
        id: userDoc.id,
        username: userData.username,
        password: userData.password,
        createdAt: userData.createdAt.toDate ? userData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to get user by username", { error: (error as Error).message, username });
      throw error;
    }
  }

  async createUser(userData: { username: string; password: string }): Promise<User> {
    try {
      const db = await dbPromise;
      logger.info("Firestore Storage: Creating user", { username: userData.username });
      
      const newUser = {
        username: userData.username,
        password: userData.password,
        createdAt: new Date()
      };
      
      const userRef = await db.collection('users').add(newUser);
      const createdUser = await userRef.get();
      const createdUserData = createdUser.data();
      
      if (!createdUserData) {
        throw new Error('Failed to create user');
      }
      
      logger.info("Firestore Storage: User created successfully", { userId: userRef.id, username: userData.username });
      
      return {
        id: userRef.id,
        username: createdUserData.username,
        password: createdUserData.password,
        createdAt: createdUserData.createdAt.toDate ? createdUserData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to create user", { error: (error as Error).message, username: userData.username });
      throw error;
    }
  }

  async createProductAnalysis(analysis: any): Promise<ProductAnalysis> {
    try {
      const db = await dbPromise;
      logger.info("Firestore Storage: Creating product analysis", { userId: analysis.userId });
      
      // Convert data to Firestore-compatible format
      const analysisData = {
        ...analysis,
        createdAt: new Date(),
        extractedText: analysis.extractedText ? JSON.stringify(analysis.extractedText) : null,
        ingredientsData: analysis.ingredientsData ? JSON.stringify(analysis.ingredientsData) : null,
        nutritionData: analysis.nutritionData ? JSON.stringify(analysis.nutritionData) : null,
        redditData: analysis.redditData ? JSON.stringify(analysis.redditData) : null
      };
      
      const analysisRef = await db.collection('product_analyses').add(analysisData);
      const createdAnalysis = await analysisRef.get();
      const createdAnalysisData = createdAnalysis.data();
      
      if (!createdAnalysisData) {
        throw new Error('Failed to create product analysis');
      }
      
      logger.info("Firestore Storage: Product analysis created successfully", { analysisId: analysisRef.id, userId: analysis.userId });
      
      return {
        id: analysisRef.id,
        userId: createdAnalysisData.userId,
        productName: createdAnalysisData.productName,
        productSummary: createdAnalysisData.productSummary,
        extractedText: createdAnalysisData.extractedText ? JSON.parse(createdAnalysisData.extractedText) : null,
        imageUrl: createdAnalysisData.imageUrl,
        ingredientsData: createdAnalysisData.ingredientsData ? JSON.parse(createdAnalysisData.ingredientsData) : null,
        nutritionData: createdAnalysisData.nutritionData ? JSON.parse(createdAnalysisData.nutritionData) : null,
        redditData: createdAnalysisData.redditData ? JSON.parse(createdAnalysisData.redditData) : null,
        createdAt: createdAnalysisData.createdAt.toDate ? createdAnalysisData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to create product analysis", { error: (error as Error).message, userId: analysis.userId });
      throw error;
    }
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    try {
      const db = await dbPromise;
      logger.debug("Firestore Storage: Getting product analysis", { analysisId: id });
      const analysisDoc = await db.collection('product_analyses').doc(id).get();
      
      if (!analysisDoc.exists) {
        logger.debug("Firestore Storage: Product analysis not found", { analysisId: id });
        return undefined;
      }
      
      const analysisData = analysisDoc.data();
      if (!analysisData) return undefined;
      
      return {
        id: analysisDoc.id,
        userId: analysisData.userId,
        productName: analysisData.productName,
        productSummary: analysisData.productSummary,
        extractedText: analysisData.extractedText ? JSON.parse(analysisData.extractedText) : null,
        imageUrl: analysisData.imageUrl,
        ingredientsData: analysisData.ingredientsData ? JSON.parse(analysisData.ingredientsData) : null,
        nutritionData: analysisData.nutritionData ? JSON.parse(analysisData.nutritionData) : null,
        redditData: analysisData.redditData ? JSON.parse(analysisData.redditData) : null,
        createdAt: analysisData.createdAt.toDate ? analysisData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to get product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async updateProductAnalysis(id: string, updates: any): Promise<void> {
    try {
      const db = await dbPromise;
      logger.info("Firestore Storage: Updating product analysis", { analysisId: id });
      
      // Convert data to Firestore-compatible format
      const updateData: any = { ...updates };
      
      if (updates.extractedText !== undefined) {
        updateData.extractedText = updates.extractedText ? JSON.stringify(updates.extractedText) : null;
      }
      
      if (updates.ingredientsData !== undefined) {
        updateData.ingredientsData = updates.ingredientsData ? JSON.stringify(updates.ingredientsData) : null;
      }
      
      if (updates.nutritionData !== undefined) {
        updateData.nutritionData = updates.nutritionData ? JSON.stringify(updates.nutritionData) : null;
      }
      
      if (updates.redditData !== undefined) {
        updateData.redditData = updates.redditData ? JSON.stringify(updates.redditData) : null;
      }
      
      await db.collection('product_analyses').doc(id).update(updateData);
      logger.info("Firestore Storage: Product analysis updated successfully", { analysisId: id });
    } catch (error) {
      logger.error("Firestore Storage: Failed to update product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async createChatMessage(message: any): Promise<ChatMessage> {
    try {
      const db = await dbPromise;
      logger.info("Firestore Storage: Creating chat message", { analysisId: message.analysisId });
      
      const messageData = {
        ...message,
        createdAt: new Date()
      };
      
      const messageRef = await db.collection('chat_messages').add(messageData);
      const createdMessage = await messageRef.get();
      const createdMessageData = createdMessage.data();
      
      if (!createdMessageData) {
        throw new Error('Failed to create chat message');
      }
      
      logger.info("Firestore Storage: Chat message created successfully", { messageId: messageRef.id, analysisId: message.analysisId });
      
      return {
        id: messageRef.id,
        analysisId: createdMessageData.analysisId,
        userId: createdMessageData.userId,
        message: createdMessageData.message,
        response: createdMessageData.response,
        createdAt: createdMessageData.createdAt.toDate ? createdMessageData.createdAt.toDate() : new Date()
      };
    } catch (error) {
      logger.error("Firestore Storage: Failed to create chat message", { error: (error as Error).message, analysisId: message.analysisId });
      throw error;
    }
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    try {
      const db = await dbPromise;
      logger.debug("Firestore Storage: Getting chat messages", { analysisId });
      
      const messagesQuery = await db.collection('chat_messages')
        .where('analysisId', '==', analysisId)
        .orderBy('createdAt', 'asc')
        .get();
      
      const messages: ChatMessage[] = [];
      messagesQuery.forEach((doc: any) => {
        const messageData = doc.data();
        messages.push({
          id: doc.id,
          analysisId: messageData.analysisId,
          userId: messageData.userId,
          message: messageData.message,
          response: messageData.response,
          createdAt: messageData.createdAt.toDate ? messageData.createdAt.toDate() : new Date()
        });
      });
      
      logger.debug("Firestore Storage: Retrieved chat messages", { analysisId, count: messages.length });
      return messages;
    } catch (error) {
      logger.error("Firestore Storage: Failed to get chat messages", { error: (error as Error).message, analysisId });
      throw error;
    }
  }

  async getUserAnalyses(userId: string): Promise<ProductAnalysis[]> {
    try {
      const db = await dbPromise;
      logger.debug("Firestore Storage: Getting user analyses", { userId });
      
      const analysesQuery = await db.collection('product_analyses')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const analyses: ProductAnalysis[] = [];
      analysesQuery.forEach((doc: any) => {
        const analysisData = doc.data();
        analyses.push({
          id: doc.id,
          userId: analysisData.userId,
          productName: analysisData.productName,
          productSummary: analysisData.productSummary,
          extractedText: analysisData.extractedText ? JSON.parse(analysisData.extractedText) : null,
          imageUrl: analysisData.imageUrl,
          ingredientsData: analysisData.ingredientsData ? JSON.parse(analysisData.ingredientsData) : null,
          nutritionData: analysisData.nutritionData ? JSON.parse(analysisData.nutritionData) : null,
          redditData: analysisData.redditData ? JSON.parse(analysisData.redditData) : null,
          createdAt: analysisData.createdAt.toDate ? analysisData.createdAt.toDate() : new Date()
        });
      });
      
      logger.debug("Firestore Storage: Retrieved user analyses", { userId, count: analyses.length });
      return analyses;
    } catch (error) {
      logger.error("Firestore Storage: Failed to get user analyses", { error: (error as Error).message, userId });
      throw error;
    }
  }
}

// Export an instance of the storage class
export const storage = new FirestoreStorage();