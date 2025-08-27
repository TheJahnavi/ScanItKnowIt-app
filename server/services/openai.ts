import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function identifyProductAndExtractText(base64Image: string): Promise<{
  productName: string;
  extractedText: any;
  summary: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a product identification expert. Analyze the image to identify the product and extract all visible text. Respond with JSON in this format: { 'productName': string, 'extractedText': object, 'summary': string }"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the product in this image, extract all visible text, and provide a 5-line summary as a product analyst focusing on what it is for and how to use it. Keep the response short and to the point but don't miss main details."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      productName: result.productName || "Unknown Product",
      extractedText: result.extractedText || {},
      summary: result.summary || "Unable to analyze product"
    };
  } catch (error) {
    console.error("Error identifying product:", error);
    throw new Error("Failed to identify product and extract text");
  }
}

export async function analyzeIngredients(extractedText: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a food scientist. From the following product label, list all of the ingredients, exactly as they are written. Do not add extra commentary. As a product health analyst, identify if the following extracted ingredient list is considered harmful. Base your answer on widely accepted health standards from organizations like the FDA, CPSC, and EU health agencies. For each ingredient, provide a specific, 3-4 word reason for its harmfulness, or simply state 'Safe' if it's not harmful. Respond with JSON in this format: { 'ingredients': [{ 'name': string, 'safety': string, 'reason': string }] }"
        },
        {
          role: "user",
          content: `Analyze the ingredients from this product data: ${JSON.stringify(extractedText)}`
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    throw new Error("Failed to analyze ingredients");
  }
}

export async function analyzeNutrition(extractedText: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "From the provided nutritional information, extract the total calories and sugar content with types of sugars from the extracted information from the images. Provide only the numbers and their units. Do not include any other text or commentary. Respond with JSON in this format: { 'calories': number, 'totalSugars': string, 'sugarTypes': [{ 'type': string, 'amount': string }] }"
        },
        {
          role: "user",
          content: `Extract nutrition data from: ${JSON.stringify(extractedText)}`
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    throw new Error("Failed to analyze nutrition information");
  }
}

export async function generateChatResponse(question: string, productData: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "This prompt is for the chatbot. You are an AI assistant that answers user questions using only the provided product text and data. Be honest if the information is not present in the provided data. Keep responses helpful and concise."
        },
        {
          role: "user",
          content: `Product data: ${JSON.stringify(productData)}\n\nUser question: ${question}`
        },
      ],
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response to that question.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate chat response");
  }
}
