import OpenAI from "openai";

// Using OpenRouter with Llama model as requested by user
const openai = new OpenAI({ 
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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"
});

// Demo mode disabled - using real OpenRouter API
const DEMO_MODE = false;

export async function identifyProductAndExtractText(base64Image: string): Promise<{
  productName: string;
  extractedText: any;
  summary: string;
}> {
  if (DEMO_MODE) {
    // Return demo data for testing purposes
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return {
      productName: "Nature Valley Granola Bar",
      extractedText: {
        ingredients: "Whole Grain Oats, Sugar, Canola Oil, Rice Flour, Honey, Brown Sugar Syrup, Salt, Natural Flavor, Vitamin E (Mixed Tocopherols) Added to Retain Freshness",
        nutrition: "Calories 190, Total Fat 6g, Saturated Fat 1g, Trans Fat 0g, Cholesterol 0mg, Sodium 160mg, Total Carbohydrate 32g, Dietary Fiber 2g, Total Sugars 11g, Added Sugars 10g, Protein 4g",
        servingSize: "2 bars (42g)",
        brand: "Nature Valley"
      },
      summary: "Nature Valley Granola Bar is a wholesome snack made with whole grain oats and natural ingredients. Each serving contains 190 calories and provides sustained energy. Perfect for on-the-go snacking, hiking, or as a quick breakfast option. Contains 4g of protein and 2g of fiber per serving. Best enjoyed as part of an active lifestyle."
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "You are a product identification expert. Analyze the image to identify the product and extract all visible text. Respond with valid JSON only in this exact format: { \"productName\": \"string\", \"extractedText\": {\"ingredients\": \"string\", \"nutrition\": \"string\", \"brand\": \"string\"}, \"summary\": \"string\" }"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the product in this image, extract all visible text including ingredients and nutrition facts, and provide a 5-line summary. Return only valid JSON without any additional text or formatting."
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
    }, {
      headers: {
        "HTTP-Referer": "https://scan-it-know-it.replit.app",
        "X-Title": "Scan It Know It"
      }
    });

    const content = response.choices[0].message.content || "";
    let result;
    
    try {
      // Try to parse the entire response as JSON
      result = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // Fallback to parsing the content manually
          result = {
            productName: "Unknown Product",
            extractedText: {},
            summary: content || "Unable to analyze product"
          };
        }
      } else {
        result = {
          productName: "Unknown Product", 
          extractedText: {},
          summary: content || "Unable to analyze product"
        };
      }
    }
    
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
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      ingredients: [
        { name: "Whole Grain Oats", safety: "Safe", reason: "Natural whole grain" },
        { name: "Sugar", safety: "Moderate", reason: "High sugar content" },
        { name: "Canola Oil", safety: "Safe", reason: "Heart healthy oil" },
        { name: "Rice Flour", safety: "Safe", reason: "Gluten-free grain" },
        { name: "Honey", safety: "Safe", reason: "Natural sweetener" },
        { name: "Brown Sugar Syrup", safety: "Moderate", reason: "Added sugar source" },
        { name: "Salt", safety: "Safe", reason: "Natural preservative" },
        { name: "Natural Flavor", safety: "Safe", reason: "FDA approved flavoring" },
        { name: "Vitamin E", safety: "Safe", reason: "Essential nutrient antioxidant" }
      ]
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "You are a food scientist. Analyze ingredients and rate their safety. Respond with valid JSON only in this exact format: { \"ingredients\": [{ \"name\": \"string\", \"safety\": \"Safe|Moderate|Harmful\", \"reason\": \"string\" }] }"
        },
        {
          role: "user",
          content: `Analyze the ingredients from this product data and rate each ingredient's safety: ${JSON.stringify(extractedText)}. Return only valid JSON without any additional text.`
        },
      ],
    }, {
      headers: {
        "HTTP-Referer": "https://scan-it-know-it.replit.app",
        "X-Title": "Scan It Know It"
      }
    });

    const content = response.choices[0].message.content || "";
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          return { ingredients: [] };
        }
      }
      return { ingredients: [] };
    }
  } catch (error) {
    console.error("Error analyzing ingredients:", error);
    throw new Error("Failed to analyze ingredients");
  }
}

export async function analyzeNutrition(extractedText: any): Promise<any> {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      calories: 190,
      totalSugars: "11g",
      sugarTypes: [
        { type: "Added Sugars", amount: "10g" },
        { type: "Natural Sugars", amount: "1g" }
      ]
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "Extract nutrition data and respond with valid JSON only in this exact format: { \"calories\": number, \"totalSugars\": \"string\", \"sugarTypes\": [{ \"type\": \"string\", \"amount\": \"string\" }] }"
        },
        {
          role: "user",
          content: `Extract nutrition data from: ${JSON.stringify(extractedText)}. Return only valid JSON without any additional text.`
        },
      ],
    }, {
      headers: {
        "HTTP-Referer": "https://scan-it-know-it.replit.app",
        "X-Title": "Scan It Know It"
      }
    });

    const content = response.choices[0].message.content || "";
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          return { calories: 0, totalSugars: "0g", sugarTypes: [] };
        }
      }
      return { calories: 0, totalSugars: "0g", sugarTypes: [] };
    }
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    throw new Error("Failed to analyze nutrition information");
  }
}

export async function generateChatResponse(question: string, productData: any): Promise<string> {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple demo responses based on common questions
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("healthy") || lowerQuestion.includes("good for you")) {
      return "This Nature Valley Granola Bar has some healthy ingredients like whole grain oats and honey, but it also contains 11g of sugar per serving. It's a decent snack for active people, but should be eaten in moderation due to the sugar content.";
    }
    
    if (lowerQuestion.includes("ingredient") || lowerQuestion.includes("contain")) {
      return "The main ingredients are whole grain oats, sugar, canola oil, rice flour, and honey. It also contains brown sugar syrup, salt, natural flavor, and vitamin E. Most ingredients are considered safe, though it has moderate sugar levels.";
    }
    
    if (lowerQuestion.includes("calories") || lowerQuestion.includes("nutrition")) {
      return "Each serving (2 bars) contains 190 calories, 6g of fat, 32g of carbohydrates, and 4g of protein. It has 11g of total sugars, with 10g being added sugars.";
    }
    
    if (lowerQuestion.includes("allerg") || lowerQuestion.includes("gluten")) {
      return "Based on the ingredients shown, this product contains oats and may be processed in facilities that handle other allergens. For specific allergen information, please check the product packaging directly.";
    }
    
    return "I can help answer questions about this Nature Valley Granola Bar's ingredients, nutrition facts, or general product information. What would you like to know?";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that answers user questions using only the provided product data. Be helpful and concise."
        },
        {
          role: "user",
          content: `Product data: ${JSON.stringify(productData)}\n\nUser question: ${question}\n\nAnswer based only on the product data provided.`
        },
      ],
    }, {
      headers: {
        "HTTP-Referer": "https://scan-it-know-it.replit.app",
        "X-Title": "Scan It Know It"
      }
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response to that question.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate chat response");
  }
}
