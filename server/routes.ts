import express, { Application, Request, Response } from 'express';
import { storage } from './storage.js';
import { 
  identifyProductAndExtractText, 
  analyzeIngredients, 
  analyzeNutrition, 
  generateChatResponse 
} from './services/openai.js';
import { searchRedditReviews } from './services/reddit.js';
import { authenticate, optionalAuth } from './middleware/auth.js';
import { generalRateLimiter, authRateLimiter, analysisRateLimiter } from './middleware/rateLimit.js';
import { logger } from './utils/logger.js';
import multer from 'multer';

// Extend Express.Request to include Multer's file property and user
interface AuthenticatedRequest extends Request {
  file?: Express.Multer.File;
  user?: any;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simplified function that only registers routes and doesn't deal with server creation
export async function registerRoutes(app: Application): Promise<void> {
  // Apply general rate limiting to all API routes
  app.use('/api/', generalRateLimiter);

  // User registration with stricter rate limiting
  app.post("/api/register", authRateLimiter, async (req: Request, res: Response) => {
    try {
      logger.info("User registration attempt");
      const { username, password } = req.body;
      if (!username || !password) {
        logger.warn("Registration failed: Missing username or password");
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Import auth service here to avoid circular dependencies
      const { registerUser } = await import('./services/auth.js');
      const result = await registerUser({ username, password });
      logger.info("User registration successful", { username });
      res.json(result);
    } catch (error: any) {
      logger.error("Error registering user", { error: error.message });
      res.status(400).json({ error: error.message || "Failed to register user" });
    }
  });

  // User login with stricter rate limiting
  app.post("/api/login", authRateLimiter, async (req: Request, res: Response) => {
    try {
      logger.info("User login attempt");
      const { username, password } = req.body;
      if (!username || !password) {
        logger.warn("Login failed: Missing username or password");
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Import auth service here to avoid circular dependencies
      const { loginUser } = await import('./services/auth.js');
      const result = await loginUser({ username, password });
      logger.info("User login successful", { username });
      res.json(result);
    } catch (error: any) {
      logger.error("Error logging in user", { error: error.message });
      res.status(400).json({ error: error.message || "Failed to login user" });
    }
  });

  // Upload and analyze product image (requires authentication) with analysis rate limiting
  app.post("/api/analyze-product", analysisRateLimiter, authenticate, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Product analysis request");
      
      if (!req.file) {
        logger.warn("Analysis failed: No image file provided");
        return res.status(400).json({ error: "No image file provided" });
      }
      
      if (!req.user) {
        logger.warn("Analysis failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const base64Image = req.file.buffer.toString('base64');
      
      // Use OpenRouter for real analysis
      const analysisResult = await identifyProductAndExtractText(base64Image);
      
      const productAnalysis = await storage.createProductAnalysis({
        userId: req.user.id,
        productName: analysisResult.productName,
        productSummary: analysisResult.summary,
        extractedText: analysisResult.extractedText,
        imageUrl: null,
        ingredientsData: null,
        nutritionData: null,
        redditData: null,
      });
      
      logger.info("Product analysis completed", { analysisId: productAnalysis.id, productName: productAnalysis.productName });
      
      res.json({
        analysisId: productAnalysis.id,
        productName: productAnalysis.productName,
        summary: productAnalysis.productSummary,
        extractedText: productAnalysis.extractedText
      });
    } catch (error) {
      logger.error("Error analyzing product", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to analyze product" });
    }
  });

  // Get ingredients analysis (requires authentication) with analysis rate limiting
  app.post("/api/analyze-ingredients/:analysisId", analysisRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Ingredients analysis request");
      
      if (!req.user) {
        logger.warn("Ingredients analysis failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { analysisId } = req.params;
      const { extractedText } = req.body;
      
      // Verify that the analysis belongs to the user
      const analysis = await storage.getProductAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        logger.warn("Ingredients analysis failed: Access denied", { userId: req.user.id, analysisId });
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use OpenRouter for real analysis
      const ingredientsData = await analyzeIngredients(extractedText);
      
      // Update analysis with ingredients data
      await storage.updateProductAnalysis(analysisId, { ingredientsData });
      
      logger.info("Ingredients analysis completed", { analysisId });
      res.json(ingredientsData);
    } catch (error) {
      logger.error("Error analyzing ingredients", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to analyze ingredients" });
    }
  });

  // Get nutrition analysis (requires authentication) with analysis rate limiting
  app.post("/api/analyze-nutrition/:analysisId", analysisRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Nutrition analysis request");
      
      if (!req.user) {
        logger.warn("Nutrition analysis failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { analysisId } = req.params;
      const { extractedText } = req.body;
      
      // Verify that the analysis belongs to the user
      const analysis = await storage.getProductAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        logger.warn("Nutrition analysis failed: Access denied", { userId: req.user.id, analysisId });
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use OpenRouter for real analysis
      const nutritionData = await analyzeNutrition(extractedText);
      
      // Update analysis with nutrition data
      await storage.updateProductAnalysis(analysisId, { nutritionData });
      
      logger.info("Nutrition analysis completed", { analysisId });
      res.json(nutritionData);
    } catch (error) {
      logger.error("Error analyzing nutrition", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to analyze nutrition" });
    }
  });

  // Get Reddit reviews (requires authentication) with analysis rate limiting
  app.post("/api/analyze-reddit/:analysisId", analysisRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Reddit reviews analysis request");
      
      if (!req.user) {
        logger.warn("Reddit reviews analysis failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { analysisId } = req.params;
      const { productName } = req.body;
      
      // Verify that the analysis belongs to the user
      const analysis = await storage.getProductAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        logger.warn("Reddit reviews analysis failed: Access denied", { userId: req.user.id, analysisId });
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use Reddit API + OpenRouter for real analysis
      const redditData = await searchRedditReviews(productName);
      
      // Update analysis with reddit data
      await storage.updateProductAnalysis(analysisId, { redditData });
      
      logger.info("Reddit reviews analysis completed", { analysisId });
      res.json(redditData);
    } catch (error) {
      logger.error("Error analyzing Reddit reviews", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to analyze Reddit reviews" });
    }
  });

  // Chat with AI about product (requires authentication) with analysis rate limiting
  app.post("/api/chat/:analysisId", analysisRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Chat request");
      
      if (!req.user) {
        logger.warn("Chat failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { analysisId } = req.params;
      const { message, productData, chatHistory } = req.body;
      
      if (!message) {
        logger.warn("Chat failed: Message is required");
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Verify that the analysis belongs to the user
      const analysis = await storage.getProductAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        logger.warn("Chat failed: Access denied", { userId: req.user.id, analysisId });
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use OpenRouter for real chat with conversation history
      const aiResponse = await generateChatResponse(message, productData, chatHistory);
      
      // Save chat message
      const chatMessage = await storage.createChatMessage({
        analysisId,
        userId: req.user.id,
        message,
        response: aiResponse
      });
      
      logger.info("Chat response generated", { analysisId });
      
      res.json({
        message: message,
        response: aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Error processing chat", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat history (requires authentication)
  app.get("/api/chat/:analysisId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Chat history request");
      
      if (!req.user) {
        logger.warn("Chat history failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { analysisId } = req.params;
      
      // Verify that the analysis belongs to the user
      const analysis = await storage.getProductAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        logger.warn("Chat history failed: Access denied", { userId: req.user.id, analysisId });
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getChatMessages(analysisId);
      
      logger.info("Chat history retrieved", { analysisId, messageCount: messages.length });
      res.json(messages);
    } catch (error) {
      logger.error("Error getting chat history", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  // Get user's analysis history (requires authentication)
  app.get("/api/user/analyses", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("User analyses history request");
      
      if (!req.user) {
        logger.warn("User analyses history failed: Authentication required");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const analyses = await storage.getUserAnalyses(req.user.id);
      
      logger.info("User analyses history retrieved", { userId: req.user.id, analysisCount: analyses.length });
      res.json(analyses);
    } catch (error) {
      logger.error("Error getting user analyses", { error: (error as Error).message });
      res.status(500).json({ error: "Failed to get user analyses" });
    }
  });

  // Enhanced health check endpoint with dependency checks
  app.get("/api/health", async (req: Request, res: Response) => {
    logger.info("Health check request");
    
    const healthStatus: any = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        server: {
          status: "ok",
          timestamp: new Date().toISOString()
        }
      }
    };
    
    let isHealthy = true;
    
    try {
      // Check database connectivity
      try {
        // Import storage to avoid circular dependencies
        const { storage } = await import('./storage.js');
        
        // Perform a simple database operation to check connectivity
        const testUser = await storage.getUserByUsername('health-check-test');
        healthStatus.checks.database = {
          status: "ok",
          timestamp: new Date().toISOString()
        };
      } catch (dbError) {
        healthStatus.checks.database = {
          status: "error",
          error: (dbError as Error).message,
          timestamp: new Date().toISOString()
        };
        isHealthy = false;
      }
      
      // Check OpenRouter/OpenAI API connectivity
      try {
        // Import OpenAI service
        const { default: OpenAI } = await import('openai');
        
        // Initialize a minimal OpenAI client for health check
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: process.env.OPENROUTER_API_KEY || "demo"
        });
        
        // Perform a simple API call to check connectivity
        await openai.models.list();
        healthStatus.checks.openai = {
          status: "ok",
          timestamp: new Date().toISOString()
        };
      } catch (apiError) {
        healthStatus.checks.openai = {
          status: "error",
          error: (apiError as Error).message,
          timestamp: new Date().toISOString()
        };
        isHealthy = false;
      }
      
      // Check Reddit API connectivity (if credentials are provided)
      if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
        try {
          const redditUrl = 'https://www.reddit.com/api/v1/me';
          const redditResponse = await fetch(redditUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'ScanItKnowIt/1.0'
            }
          });
          
          if (redditResponse.ok) {
            healthStatus.checks.reddit = {
              status: "ok",
              timestamp: new Date().toISOString()
            };
          } else {
            healthStatus.checks.reddit = {
              status: "error",
              error: `Reddit API returned status ${redditResponse.status}`,
              timestamp: new Date().toISOString()
            };
            isHealthy = false;
          }
        } catch (redditError) {
          healthStatus.checks.reddit = {
            status: "error",
            error: (redditError as Error).message,
            timestamp: new Date().toISOString()
          };
          isHealthy = false;
        }
      } else {
        healthStatus.checks.reddit = {
          status: "skipped",
          reason: "Reddit credentials not configured",
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      logger.error("Health check failed", { error: (error as Error).message });
      isHealthy = false;
      healthStatus.status = "unhealthy";
      healthStatus.error = (error as Error).message;
    }
    
    res.status(isHealthy ? 200 : 503).json(healthStatus);
  });

  // In Vercel environment, we don't need to create or return a server
  // The function simply registers routes and returns void
}