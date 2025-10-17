import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { nanoid } from 'nanoid';
import path from 'path';
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

export class DatabaseService {
  private db: Database | null = null;

  async initialize() {
    try {
      logger.info("Initializing database");
      
      // Open database (creates file if it doesn't exist)
      this.db = await open({
        filename: path.join(process.cwd(), 'scanitknowit.db'),
        driver: sqlite3.Database
      });

      // Create tables if they don't exist
      await this.createTables();
      
      logger.info("Database initialization completed");
    } catch (error) {
      logger.error("Database initialization failed", { error: (error as Error).message });
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      logger.info("Creating database tables");
      
      // Users table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Product analyses table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS product_analyses (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          productName TEXT NOT NULL,
          productSummary TEXT,
          extractedText TEXT,
          imageUrl TEXT,
          ingredientsData TEXT,
          nutritionData TEXT,
          redditData TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id)
        )
      `);

      // Chat messages table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          analysisId TEXT NOT NULL,
          userId TEXT NOT NULL,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (analysisId) REFERENCES product_analyses (id),
          FOREIGN KEY (userId) REFERENCES users (id)
        )
      `);
      
      logger.info("Database tables created successfully");
    } catch (error) {
      logger.error("Failed to create database tables", { error: (error as Error).message });
      throw error;
    }
  }

  // User operations
  async createUser(username: string, password: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const id = nanoid();
      const createdAt = new Date();
      
      await this.db.run(
        'INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)',
        [id, username, password, createdAt.toISOString()]
      );
      
      const duration = Date.now() - startTime;
      logger.info("User created", { userId: id, username, duration });
      
      return { id, username, password, createdAt };
    } catch (error) {
      logger.error("Failed to create user", { error: (error as Error).message, username });
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const row = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
      
      const duration = Date.now() - startTime;
      logger.debug("User retrieved by ID", { userId: id, found: !!row, duration });
      
      if (!row) return undefined;
      
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.createdAt)
      };
    } catch (error) {
      logger.error("Failed to get user by ID", { error: (error as Error).message, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const row = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
      
      const duration = Date.now() - startTime;
      logger.debug("User retrieved by username", { username, found: !!row, duration });
      
      if (!row) return undefined;
      
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.createdAt)
      };
    } catch (error) {
      logger.error("Failed to get user by username", { error: (error as Error).message, username });
      throw error;
    }
  }

  // Product analysis operations
  async createProductAnalysis(analysis: Omit<ProductAnalysis, 'id' | 'createdAt'>): Promise<ProductAnalysis> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const id = nanoid();
      const createdAt = new Date();
      
      await this.db.run(
        `INSERT INTO product_analyses 
         (id, userId, productName, productSummary, extractedText, imageUrl, ingredientsData, nutritionData, redditData, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          analysis.userId,
          analysis.productName,
          analysis.productSummary,
          JSON.stringify(analysis.extractedText),
          analysis.imageUrl,
          JSON.stringify(analysis.ingredientsData),
          JSON.stringify(analysis.nutritionData),
          JSON.stringify(analysis.redditData),
          createdAt.toISOString()
        ]
      );
      
      const duration = Date.now() - startTime;
      logger.info("Product analysis created", { analysisId: id, userId: analysis.userId, duration });
      
      return { ...analysis, id, createdAt };
    } catch (error) {
      logger.error("Failed to create product analysis", { error: (error as Error).message, userId: analysis.userId });
      throw error;
    }
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const row = await this.db.get('SELECT * FROM product_analyses WHERE id = ?', [id]);
      
      const duration = Date.now() - startTime;
      logger.debug("Product analysis retrieved", { analysisId: id, found: !!row, duration });
      
      if (!row) return undefined;
      
      return {
        id: row.id,
        userId: row.userId,
        productName: row.productName,
        productSummary: row.productSummary,
        extractedText: row.extractedText ? JSON.parse(row.extractedText) : null,
        imageUrl: row.imageUrl,
        ingredientsData: row.ingredientsData ? JSON.parse(row.ingredientsData) : null,
        nutritionData: row.nutritionData ? JSON.parse(row.nutritionData) : null,
        redditData: row.redditData ? JSON.parse(row.redditData) : null,
        createdAt: new Date(row.createdAt)
      };
    } catch (error) {
      logger.error("Failed to get product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async updateProductAnalysis(id: string, updates: Partial<Omit<ProductAnalysis, 'id' | 'createdAt'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.productName !== undefined) {
        fields.push('productName = ?');
        values.push(updates.productName);
      }
      
      if (updates.productSummary !== undefined) {
        fields.push('productSummary = ?');
        values.push(updates.productSummary);
      }
      
      if (updates.extractedText !== undefined) {
        fields.push('extractedText = ?');
        values.push(JSON.stringify(updates.extractedText));
      }
      
      if (updates.imageUrl !== undefined) {
        fields.push('imageUrl = ?');
        values.push(updates.imageUrl);
      }
      
      if (updates.ingredientsData !== undefined) {
        fields.push('ingredientsData = ?');
        values.push(JSON.stringify(updates.ingredientsData));
      }
      
      if (updates.nutritionData !== undefined) {
        fields.push('nutritionData = ?');
        values.push(JSON.stringify(updates.nutritionData));
      }
      
      if (updates.redditData !== undefined) {
        fields.push('redditData = ?');
        values.push(JSON.stringify(updates.redditData));
      }
      
      if (fields.length === 0) return;
      
      values.push(id);
      
      await this.db.run(
        `UPDATE product_analyses SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      const duration = Date.now() - startTime;
      logger.info("Product analysis updated", { analysisId: id, updatedFields: fields.length, duration });
    } catch (error) {
      logger.error("Failed to update product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  // Chat message operations
  async createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const id = nanoid();
      const createdAt = new Date();
      
      await this.db.run(
        'INSERT INTO chat_messages (id, analysisId, userId, message, response, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, message.analysisId, message.userId, message.message, message.response, createdAt.toISOString()]
      );
      
      const duration = Date.now() - startTime;
      logger.info("Chat message created", { messageId: id, analysisId: message.analysisId, duration });
      
      return { ...message, id, createdAt };
    } catch (error) {
      logger.error("Failed to create chat message", { error: (error as Error).message, analysisId: message.analysisId });
      throw error;
    }
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const rows = await this.db.all('SELECT * FROM chat_messages WHERE analysisId = ? ORDER BY createdAt ASC', [analysisId]);
      
      const duration = Date.now() - startTime;
      logger.debug("Chat messages retrieved", { analysisId, messageCount: rows.length, duration });
      
      return rows.map(row => ({
        id: row.id,
        analysisId: row.analysisId,
        userId: row.userId,
        message: row.message,
        response: row.response,
        createdAt: new Date(row.createdAt)
      }));
    } catch (error) {
      logger.error("Failed to get chat messages", { error: (error as Error).message, analysisId });
      throw error;
    }
  }

  // Get user's analysis history
  async getUserAnalyses(userId: string): Promise<ProductAnalysis[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const startTime = Date.now();
      const rows = await this.db.all('SELECT * FROM product_analyses WHERE userId = ? ORDER BY createdAt DESC', [userId]);
      
      const duration = Date.now() - startTime;
      logger.debug("User analyses retrieved", { userId, analysisCount: rows.length, duration });
      
      return rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        productName: row.productName,
        productSummary: row.productSummary,
        extractedText: row.extractedText ? JSON.parse(row.extractedText) : null,
        imageUrl: row.imageUrl,
        ingredientsData: row.ingredientsData ? JSON.parse(row.ingredientsData) : null,
        nutritionData: row.nutritionData ? JSON.parse(row.nutritionData) : null,
        redditData: row.redditData ? JSON.parse(row.redditData) : null,
        createdAt: new Date(row.createdAt)
      }));
    } catch (error) {
      logger.error("Failed to get user analyses", { error: (error as Error).message, userId });
      throw error;
    }
  }

  // Add methods for migration
  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const rows = await this.db.all('SELECT * FROM users ORDER BY createdAt ASC');
      
      return rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.createdAt)
      }));
    } catch (error) {
      logger.error("Failed to get all users", { error: (error as Error).message });
      throw error;
    }
  }

  async getAllProductAnalyses(): Promise<ProductAnalysis[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const rows = await this.db.all('SELECT * FROM product_analyses ORDER BY createdAt ASC');
      
      return rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        productName: row.productName,
        productSummary: row.productSummary,
        extractedText: row.extractedText ? JSON.parse(row.extractedText) : null,
        imageUrl: row.imageUrl,
        ingredientsData: row.ingredientsData ? JSON.parse(row.ingredientsData) : null,
        nutritionData: row.nutritionData ? JSON.parse(row.nutritionData) : null,
        redditData: row.redditData ? JSON.parse(row.redditData) : null,
        createdAt: new Date(row.createdAt)
      }));
    } catch (error) {
      logger.error("Failed to get all product analyses", { error: (error as Error).message });
      throw error;
    }
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const rows = await this.db.all('SELECT * FROM chat_messages ORDER BY createdAt ASC');
      
      return rows.map((row: any) => ({
        id: row.id,
        analysisId: row.analysisId,
        userId: row.userId,
        message: row.message,
        response: row.response,
        createdAt: new Date(row.createdAt)
      }));
    } catch (error) {
      logger.error("Failed to get all chat messages", { error: (error as Error).message });
      throw error;
    }
  }
}

// Export a singleton instance
export const db = new DatabaseService();