import OpenAI from "openai";
import { retryWithBackoff, CircuitBreaker } from "../utils/retry.js";
import { logger } from "../utils/logger.js";

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "demo"
});

// Create circuit breaker for OpenAI API calls
const openaiCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30 second timeout

/**
 * Extract text from image using OpenRouter's vision capabilities
 * @param base64Image Base64 encoded image data
 * @returns Promise resolving to extracted text and structured data
 */
export async function extractTextFromImage(base64Image: string): Promise<any> {
  try {
    logger.info("Starting text extraction from image");
    const startTime = Date.now();
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this product image and extract all visible text. Structure your response as a JSON object with the following fields:
- productName: The product name
- brand: The brand name
- ingredients: Complete ingredient list as a string
- nutrition: Nutritional information as a string
- servingSize: Serving size information
- calories: Calorie count per serving (number)
- productType: Type of product (e.g., "Granola Bar", "Cereal", etc.)
- barcode: Barcode/UPC number if visible
- otherText: Any other relevant text from the packaging

If any information is not visible, leave the field empty or null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const content = response.choices[0].message.content || "{}";
    const duration = Date.now() - startTime;
    logger.info("Text extraction from image completed", { duration });
    
    return JSON.parse(content);
  } catch (error) {
    logger.error("Error extracting text from image", { error: (error as Error).message });
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Extract product name using the 4-condition prompt
 * @param extractedData Data extracted from the image
 * @returns Promise resolving to the product name
 */
export async function extractProductName(extractedData: any): Promise<string> {
  try {
    logger.info("Starting product name extraction");
    const startTime = Date.now();
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a product identification expert. Extract the most accurate product name from the provided text using these conditions:
1. If there's an explicit "Product Name:" or "Item:" field, use that exact value
2. If there's a clear brand name followed by a product descriptor, combine them (e.g., "Nature Valley Granola Bars")
3. If there's a prominent headline or title text, use that
4. As a last resort, construct a descriptive name from the most relevant keywords

Respond with ONLY the product name, nothing else.`
          },
          {
            role: "user",
            content: `Extract the product name from this text: ${JSON.stringify(extractedData)}`
          }
        ]
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const duration = Date.now() - startTime;
    logger.info("Product name extraction completed", { duration });
    
    return response.choices[0].message.content?.trim() || "Unknown Product";
  } catch (error) {
    logger.error("Error extracting product name", { error: (error as Error).message });
    return "Unknown Product";
  }
}

/**
 * Generate a 5-line product summary
 * @param productName Name of the product
 * @param extractedData Data extracted from the image
 * @returns Promise resolving to the product summary
 */
export async function generateProductSummary(productName: string, extractedData: any): Promise<string> {
  try {
    logger.info("Starting product summary generation");
    const startTime = Date.now();
    
    const response = await retryWithBackoff(
      () => openaiCircuitBreaker.call(() => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Create a 5-line summary of this product. Each line should be a concise bullet point starting with "•" that covers:
1. Product category/type
2. Primary use case or benefit
3. Key ingredients or features
4. Target audience or lifestyle
5. Important caveat or note`
          },
          {
            role: "user",
            content: `Product: ${productName}\nData: ${JSON.stringify(extractedData)}`
          }
        ]
      })),
      3, // 3 retries
      1000, // 1 second initial delay
      2 // exponential factor
    );

    const duration = Date.now() - startTime;
    logger.info("Product summary generation completed", { duration });
    
    return response.choices[0].message.content || "No summary available.";
  } catch (error) {
    logger.error("Error generating product summary", { error: (error as Error).message });
    return "No summary available.";
  }
}