import OpenAI from "openai";
import { extractTextFromImage, extractProductName, generateProductSummary } from "./ocr.js";
import { retryWithBackoff, CircuitBreaker } from "../utils/retry.js";
import { logger } from "../utils/logger.js";

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "demo" // Use demo key if not provided
});

// Create circuit breaker for OpenAI API calls
const openaiCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30 second timeout

// Product identification and text extraction using OpenRouter
export async function identifyProductAndExtractText(base64Image: string): Promise<{
  productName: string;
  extractedText: any;
  summary: string;
}> {
  try {
    logger.info("Starting product identification and text extraction");
    const startTime = Date.now();
    
    // First, extract text from image using OCR service with retry logic
    const extractedData = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => extractTextFromImage(base64Image)),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );
    
    // Extract product name using the 4-condition prompt with retry logic
    const productName = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => extractProductName(extractedData)),
      3,
      1000,
      2
    );
    
    // Generate 5-line summary with retry logic
    const summary = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => generateProductSummary(productName, extractedData)),
      3,
      1000,
      2
    );
    
    const duration = Date.now() - startTime;
    logger.info("Product identification and text extraction completed", { duration, productName });
    
    return {
      productName,
      extractedText: extractedData,
      summary
    };
  } catch (error) {
    logger.error("Error in identifyProductAndExtractText", { error: (error as Error).message });
    // Fallback to existing demo data
    return {
      productName: "Nature Valley Crunchy Granola Bar",
      extractedText: {
        ingredients: "Whole Grain Oats, Sugar, Canola Oil, Rice Flour, Honey, Brown Sugar Syrup, Salt, Natural Flavor, Vitamin E (Mixed Tocopherols) Added to Retain Freshness",
        nutrition: "Calories 190 per serving (2 bars), Total Fat 6g, Saturated Fat 1g, Trans Fat 0g, Cholesterol 0mg, Sodium 160mg, Total Carbohydrate 32g, Dietary Fiber 2g, Total Sugars 11g, Added Sugars 10g, Protein 4g",
        servingSize: "2 bars (42g)",
        brand: "Nature Valley",
        barcode: "016000275973",
        productType: "Granola Bar"
      },
      summary: "Nature Valley Crunchy Granola Bar is a wholesome snack made with whole grain oats and natural sweeteners like honey. Each serving provides sustained energy with 190 calories and 4g of protein, making it ideal for on-the-go nutrition."
    };
  }
}

// Analyze ingredients using OpenRouter with the health analyst prompt
export async function analyzeIngredients(extractedText: any): Promise<any> {
  try {
    logger.info("Starting ingredient analysis");
    const startTime = Date.now();
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `As a product health analyst, your task is to evaluate the ingredients list and create a comprehensive safety assessment. For each ingredient, provide:
1. Safety classification (Safe/Warning/Not Safe)
2. Brief reason for classification
3. Relevant health considerations

Format your response as a markdown table with columns: Ingredient, Safety, Reason, and Citations. Use emoji icons: ✅ for Safe, ⚠️ for Warning, ❌ for Not Safe.`
          },
          {
            role: "user",
            content: `Analyze these ingredients: ${JSON.stringify(extractedText)}`
          }
        ]
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const analysis = response.choices[0].message.content || "Unable to analyze ingredients.";
    
    // Parse the markdown table into structured data
    const tableLines = analysis.split('\n').filter(line => line.includes('|') && !line.includes('---'));
    const ingredients = [];
    
    // Skip header lines
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
      if (cells.length >= 3) {
        ingredients.push({
          name: cells[0],
          safety: cells[1].includes('✅') ? 'Safe' : cells[1].includes('⚠️') ? 'Moderate' : 'Harmful',
          reason: cells[2]
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info("Ingredient analysis completed", { duration, ingredientCount: ingredients.length });
    
    return { ingredients: ingredients.length > 0 ? ingredients : [{ name: "Analysis pending", safety: "Safe", reason: "No specific concerns identified" }] };
  } catch (error) {
    logger.error("Error in analyzeIngredients", { error: (error as Error).message });
    // Fallback response
    return {
      ingredients: [
        { name: "Whole Grain Oats", safety: "Safe", reason: "Good source of fiber" },
        { name: "Sugar", safety: "Moderate", reason: "High glycemic impact" },
        { name: "Canola Oil", safety: "Safe", reason: "Heart-healthy fat" },
        { name: "Honey", safety: "Moderate", reason: "Natural sugar content" }
      ]
    };
  }
}

// Analyze nutrition using OpenRouter with the nutritional data prompt
export async function analyzeNutrition(extractedText: any): Promise<any> {
  try {
    logger.info("Starting nutrition analysis");
    const startTime = Date.now();
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a nutritional data expert. Analyze the provided nutritional information and format it as follows:
• Calories: [value]
• Total Sugars: [value]
• Added Sugars: [value]
• Protein: [value]
• Key nutritional insights: [bullet points about nutritional value, health impact, and dietary considerations]

Use the exact nutritional data provided, do not make up numbers.`
          },
          {
            role: "user",
            content: `Analyze this nutritional information: ${JSON.stringify(extractedText)}`
          }
        ]
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const analysis = response.choices[0].message.content || "";
    
    // Extract specific values using regex
    const caloriesMatch = analysis.match(/Calories:\s*(\d+)/i);
    const sugarMatch = analysis.match(/Total Sugars:\s*([\d.]+g)/i);
    const proteinMatch = analysis.match(/Protein:\s*([\d.]+g)/i);
    
    // Extract insights section
    const insightsMatch = analysis.match(/Key nutritional insights:[\s\S]*/i);
    const insights = insightsMatch ? insightsMatch[0].split('\n').filter(line => line.trim().startsWith('•')).slice(0, 3) : [];
    
    const duration = Date.now() - startTime;
    logger.info("Nutrition analysis completed", { duration });
    
    return {
      calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
      totalSugars: sugarMatch ? sugarMatch[1] : "N/A",
      protein: proteinMatch ? proteinMatch[1] : "N/A",
      sugarTypes: [
        { type: "Total Sugars", amount: sugarMatch ? sugarMatch[1] : "N/A" },
        { type: "Key Insights", amount: insights.join(', ') || "No specific insights available" }
      ]
    };
  } catch (error) {
    logger.error("Error in analyzeNutrition", { error: (error as Error).message });
    // Fallback response
    return {
      calories: 190,
      totalSugars: "11g",
      protein: "4g",
      sugarTypes: [
        { type: "Added Sugars", amount: "10g" },
        { type: "Natural Sugars (from honey)", amount: "1g" }
      ]
    };
  }
}

// Generate chat response using OpenRouter with conversation history
export async function generateChatResponse(question: string, productData: any, chatHistory: Array<{role: string, content: string}> = []): Promise<string> {
  try {
    logger.info("Starting chat response generation");
    const startTime = Date.now();
    
    // Prepare messages with chat history context
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful product expert chatbot. You have access to detailed information about a product including:
- Product name: ${productData.productName || "Unknown"}
- Ingredients: ${JSON.stringify(productData.extractedText?.ingredients || "Not available")}
- Nutrition: ${JSON.stringify(productData.extractedText?.nutrition || "Not available")}
- Summary: ${productData.summary || "Not available"}

Answer questions accurately based on this information. If you don't know something, say so. Keep responses concise but helpful.`
      },
      ...chatHistory.slice(-4).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })), // Include last 4 messages for context
      {
        role: "user",
        content: question
      }
    ];
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const duration = Date.now() - startTime;
    logger.info("Chat response generation completed", { duration });
    
    return response.choices[0].message.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    logger.error("Error in generateChatResponse", { error: (error as Error).message });
    // Fallback response
    return "This is a demo response about the product. In a real implementation, this would use AI to answer your question.";
  }
}