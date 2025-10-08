// Remove all DB-related imports and dependencies
// This file now provides in-memory storage that doesn't persist data

export interface IStorage {
  // These methods are kept for interface compatibility but won't persist data
  getUser(id: string): Promise<undefined>;
  getUserByUsername(username: string): Promise<undefined>;
  createUser(user: any): Promise<any>;
  
  createProductAnalysis(analysis: any): Promise<any>;
  getProductAnalysis(id: string): Promise<undefined>;
  updateProductAnalysis(id: string, updates: any): Promise<undefined>;
  
  createChatMessage(message: any): Promise<any>;
  getChatMessages(analysisId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  async getUser(id: string): Promise<undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<undefined> {
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // Return a mock user object without storing it
    return { id: 'mock-user-id', ...insertUser };
  }

  async createProductAnalysis(analysis: any): Promise<any> {
    // Return the analysis object with a mock ID without storing it
    return { 
      id: 'mock-analysis-id',
      createdAt: new Date(),
      imageUrl: analysis.imageUrl || null,
      ingredientsData: analysis.ingredientsData || null,
      nutritionData: analysis.nutritionData || null,
      redditData: analysis.redditData || null,
      ...analysis
    };
  }

  async getProductAnalysis(id: string): Promise<undefined> {
    return undefined;
  }

  async updateProductAnalysis(id: string, updates: any): Promise<undefined> {
    return undefined;
  }

  async createChatMessage(message: any): Promise<any> {
    // Return the message object with a mock ID without storing it
    return { 
      id: 'mock-message-id',
      createdAt: new Date(),
      ...message
    };
  }

  async getChatMessages(analysisId: string): Promise<any[]> {
    // Return an empty array since we're not storing messages
    return [];
  }
}

export const storage = new MemStorage();