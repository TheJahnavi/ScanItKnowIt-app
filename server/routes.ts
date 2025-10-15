import express, { Application, Request, Response } from 'express'; // Import types directly
import { storage } from './storage.js';
import { 
  identifyProductAndExtractText, 
  analyzeIngredients, 
  analyzeNutrition, 
  generateChatResponse 
} from './services/openai.js';
import { searchRedditReviews } from './services/reddit.js';
import multer from 'multer';

// Extend Express.Request (not express.Request) to include Multer's file property
interface MulterRequest extends Request {
  file?: Express.Multer.File; // Use Express.Multer.File type
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simplified function that only registers routes and doesn't deal with server creation
export async function registerRoutes(app: Application): Promise<void> {
  // Upload and analyze product image
  app.post("/api/analyze-product", upload.single('image'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const base64Image = req.file.buffer.toString('base64');
      
      const analysisResult = await identifyProductAndExtractText(base64Image);
      const productAnalysis = await storage.createProductAnalysis({
        productName: analysisResult.productName,
        productSummary: analysisResult.summary,
        extractedText: analysisResult.extractedText,
        imageUrl: null,
        ingredientsData: null,
        nutritionData: null,
        redditData: null,
      });
      res.json({
        analysisId: productAnalysis.id,
        productName: productAnalysis.productName,
        summary: productAnalysis.productSummary,
        extractedText: productAnalysis.extractedText
      });
    } catch (error) {
      console.error("Error analyzing product:", error);
      res.status(500).json({ error: "Failed to analyze product" });
    }
  });

  // Get ingredients analysis (use Request/Response types directly)
  app.post("/api/analyze-ingredients/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params; // req.params is recognized via Request type
      const { extractedText } = req.body; // req.body is recognized via Request type (thanks to express.json() middleware)
      const ingredientsData = await analyzeIngredients(extractedText);
      res.json(ingredientsData);
    } catch (error) {
      console.error("Error analyzing ingredients:", error);
      res.status(500).json({ error: "Failed to analyze ingredients" });
    }
  });

  // Get nutrition analysis
  app.post("/api/analyze-nutrition/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params;
      const { extractedText } = req.body;
      const nutritionData = await analyzeNutrition(extractedText);
      res.json(nutritionData);
    } catch (error) {
      console.error("Error analyzing nutrition:", error);
      res.status(500).json({ error: "Failed to analyze nutrition" });
    }
  });

  // Get Reddit reviews
  app.post("/api/analyze-reddit/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params;
      const { productName } = req.body;
      const redditData = await searchRedditReviews(productName);
      res.json(redditData);
    } catch (error) {
      console.error("Error analyzing Reddit reviews:", error);
      res.status(500).json({ error: "Failed to analyze Reddit reviews" });
    }
  });

  // Chat with AI about product
  app.post("/api/chat/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params;
      const { message, productData } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const aiResponse = await generateChatResponse(message, productData);
      res.json({
        message: message,
        response: aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat history (returns empty array since we're not storing data)
  app.get("/api/chat/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params;
      const messages = await storage.getChatMessages(analysisId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // In Vercel environment, we don't need to create or return a server
  // The function simply registers routes and returns void
}