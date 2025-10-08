// Remove all DB-related imports and dependencies
// This file now provides type definitions without database schema

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface ProductAnalysis {
  id: string;
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
  message: string;
  response: string;
  createdAt: Date;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface InsertProductAnalysis {
  productName: string;
  productSummary: string;
  extractedText: any;
  imageUrl?: string | null;
  ingredientsData?: any | null;
  nutritionData?: any | null;
  redditData?: any | null;
}

export interface InsertChatMessage {
  analysisId: string;
  message: string;
  response: string;
}

// Type guards
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string' && typeof obj.password === 'string';
}

export function isProductAnalysis(obj: any): obj is ProductAnalysis {
  return obj && typeof obj.id === 'string' && typeof obj.productName === 'string' && typeof obj.productSummary === 'string';
}

export function isChatMessage(obj: any): obj is ChatMessage {
  return obj && typeof obj.id === 'string' && typeof obj.analysisId === 'string' && typeof obj.message === 'string' && typeof obj.response === 'string';
}