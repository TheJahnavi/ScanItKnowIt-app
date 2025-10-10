import { createServer } from 'http';
import { storage } from './storage.js';
import { identifyProductAndExtractText, analyzeIngredients, analyzeNutrition, generateChatResponse } from './services/openai.js';
import { searchRedditReviews } from './services/reddit.js';
import multer from 'multer';
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});
export async function registerRoutes(app) {
    app.post("/api/analyze-product", upload.single('image'), async (req, res) => {
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
        }
        catch (error) {
            console.error("Error analyzing product:", error);
            res.status(500).json({ error: "Failed to analyze product" });
        }
    });
    app.post("/api/analyze-ingredients/:analysisId", async (req, res) => {
        try {
            const { analysisId } = req.params;
            const { extractedText } = req.body;
            const ingredientsData = await analyzeIngredients(extractedText);
            res.json(ingredientsData);
        }
        catch (error) {
            console.error("Error analyzing ingredients:", error);
            res.status(500).json({ error: "Failed to analyze ingredients" });
        }
    });
    app.post("/api/analyze-nutrition/:analysisId", async (req, res) => {
        try {
            const { analysisId } = req.params;
            const { extractedText } = req.body;
            const nutritionData = await analyzeNutrition(extractedText);
            res.json(nutritionData);
        }
        catch (error) {
            console.error("Error analyzing nutrition:", error);
            res.status(500).json({ error: "Failed to analyze nutrition" });
        }
    });
    app.post("/api/analyze-reddit/:analysisId", async (req, res) => {
        try {
            const { analysisId } = req.params;
            const { productName } = req.body;
            const redditData = await searchRedditReviews(productName);
            res.json(redditData);
        }
        catch (error) {
            console.error("Error analyzing Reddit reviews:", error);
            res.status(500).json({ error: "Failed to analyze Reddit reviews" });
        }
    });
    app.post("/api/chat/:analysisId", async (req, res) => {
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
        }
        catch (error) {
            console.error("Error processing chat:", error);
            res.status(500).json({ error: "Failed to process chat message" });
        }
    });
    app.get("/api/chat/:analysisId", async (req, res) => {
        try {
            const { analysisId } = req.params;
            const messages = await storage.getChatMessages(analysisId);
            res.json(messages);
        }
        catch (error) {
            console.error("Error getting chat history:", error);
            res.status(500).json({ error: "Failed to get chat history" });
        }
    });
    if (process.env.VERCEL) {
        return undefined;
    }
    const httpServer = createServer(app);
    return httpServer;
}
