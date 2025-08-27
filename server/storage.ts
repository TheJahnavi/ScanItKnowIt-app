import { type User, type InsertUser, type ProductAnalysis, type InsertProductAnalysis, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createProductAnalysis(analysis: InsertProductAnalysis): Promise<ProductAnalysis>;
  getProductAnalysis(id: string): Promise<ProductAnalysis | undefined>;
  updateProductAnalysis(id: string, updates: Partial<ProductAnalysis>): Promise<ProductAnalysis | undefined>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private productAnalyses: Map<string, ProductAnalysis>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.productAnalyses = new Map();
    this.chatMessages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProductAnalysis(analysis: InsertProductAnalysis): Promise<ProductAnalysis> {
    const id = randomUUID();
    const productAnalysis: ProductAnalysis = {
      ...analysis,
      id,
      createdAt: new Date(),
      imageUrl: analysis.imageUrl || null,
      ingredientsData: analysis.ingredientsData || null,
      nutritionData: analysis.nutritionData || null,
      redditData: analysis.redditData || null,
    };
    this.productAnalyses.set(id, productAnalysis);
    return productAnalysis;
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    return this.productAnalyses.get(id);
  }

  async updateProductAnalysis(id: string, updates: Partial<ProductAnalysis>): Promise<ProductAnalysis | undefined> {
    const existing = this.productAnalyses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.productAnalyses.set(id, updated);
    return updated;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.analysisId === analysisId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();
