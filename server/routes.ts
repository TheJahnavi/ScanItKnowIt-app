import express, { Application, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { identifyProductAndExtractText, analyzeIngredients, analyzeNutrition, generateChatResponse } from "./services/openai";
import { searchRedditReviews } from "./services/reddit";
import multer from "multer";

// Extend Express Request type to include multer properties
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Application): Promise<Server | void> {
  
  // Upload and analyze product image
  app.post("/api/analyze-product", upload.single('image'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const base64Image = req.file.buffer.toString('base64');
      
      // Initial AI processing
      const analysisResult = await identifyProductAndExtractText(base64Image);
      
      // Create product analysis record (in-memory only)
      const productAnalysis = await storage.createProductAnalysis({
        productName: analysisResult.productName,
        productSummary: analysisResult.summary,
        extractedText: analysisResult.extractedText,
        imageUrl: null, // Could implement image storage later
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

  // Get ingredients analysis
  app.post("/api/analyze-ingredients/:analysisId", async (req: Request, res: Response) => {
    try {
      const { analysisId } = req.params;
      
      // Since we're not storing data, we need to get the analysis from the request body
      // In a real implementation, the client would send the extracted text
      const { extractedText } = req.body;

      // Analyze ingredients with AI
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
      
      // Since we're not storing data, we need to get the analysis from the request body
      const { extractedText } = req.body;

      // Analyze nutrition with AI
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
      
      // Since we're not storing data, we need to get the product name from the request body
      const { productName } = req.body;

      // Search Reddit for reviews
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

      // Generate AI response
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

  // For Vercel deployment, we don't need to create an HTTP server
  if (process.env.VERCEL) {
    return Promise.resolve(undefined);
  }

  const httpServer = createServer(app);
  return Promise.resolve(httpServer);
}