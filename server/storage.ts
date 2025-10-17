import { db, User, ProductAnalysis, ChatMessage } from './database.js';
import { logger } from './utils/logger.js';

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string }): Promise<User>;
  
  createProductAnalysis(analysis: any): Promise<ProductAnalysis>;
  getProductAnalysis(id: string): Promise<ProductAnalysis | undefined>;
  updateProductAnalysis(id: string, updates: any): Promise<void>;
  
  createChatMessage(message: any): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
  
  // Add getUserAnalyses method
  getUserAnalyses(userId: string): Promise<ProductAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      logger.debug("Storage: Getting user by ID", { userId: id });
      return await db.getUser(id);
    } catch (error) {
      logger.error("Storage: Failed to get user by ID", { error: (error as Error).message, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      logger.debug("Storage: Getting user by username", { username });
      return await db.getUserByUsername(username);
    } catch (error) {
      logger.error("Storage: Failed to get user by username", { error: (error as Error).message, username });
      throw error;
    }
  }

  async createUser(userData: { username: string; password: string }): Promise<User> {
    try {
      logger.info("Storage: Creating user", { username: userData.username });
      return await db.createUser(userData.username, userData.password);
    } catch (error) {
      logger.error("Storage: Failed to create user", { error: (error as Error).message, username: userData.username });
      throw error;
    }
  }

  async createProductAnalysis(analysis: any): Promise<ProductAnalysis> {
    try {
      logger.info("Storage: Creating product analysis", { userId: analysis.userId });
      return await db.createProductAnalysis(analysis);
    } catch (error) {
      logger.error("Storage: Failed to create product analysis", { error: (error as Error).message, userId: analysis.userId });
      throw error;
    }
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    try {
      logger.debug("Storage: Getting product analysis", { analysisId: id });
      return await db.getProductAnalysis(id);
    } catch (error) {
      logger.error("Storage: Failed to get product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async updateProductAnalysis(id: string, updates: any): Promise<void> {
    try {
      logger.info("Storage: Updating product analysis", { analysisId: id });
      return await db.updateProductAnalysis(id, updates);
    } catch (error) {
      logger.error("Storage: Failed to update product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async createChatMessage(message: any): Promise<ChatMessage> {
    try {
      logger.info("Storage: Creating chat message", { analysisId: message.analysisId });
      return await db.createChatMessage(message);
    } catch (error) {
      logger.error("Storage: Failed to create chat message", { error: (error as Error).message, analysisId: message.analysisId });
      throw error;
    }
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    try {
      logger.debug("Storage: Getting chat messages", { analysisId });
      return await db.getChatMessages(analysisId);
    } catch (error) {
      logger.error("Storage: Failed to get chat messages", { error: (error as Error).message, analysisId });
      throw error;
    }
  }
  
  // Add getUserAnalyses method
  async getUserAnalyses(userId: string): Promise<ProductAnalysis[]> {
    try {
      logger.debug("Storage: Getting user analyses", { userId });
      return await db.getUserAnalyses(userId);
    } catch (error) {
      logger.error("Storage: Failed to get user analyses", { error: (error as Error).message, userId });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();