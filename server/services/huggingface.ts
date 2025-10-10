// Hugging Face Inference API for free AI model access
// Using free models that don't require API keys

const HF_BASE_URL = "https://api-inference.huggingface.co/models";

// For image analysis and OCR, we'll use BLIP model
const VISION_MODEL = "Salesforce/blip-image-captioning-large";
const TEXT_MODEL = "microsoft/DialoGPT-medium"; // Free text generation model

export async function analyzeImageWithVision(base64Image: string): Promise<any> {
  try {
    // Use dynamic import for node-fetch
    const { default: fetch } = await import('node-fetch');
    
    // Use multiple HuggingFace models for better text extraction
    const models = [
      "Salesforce/blip-image-captioning-large",
      "microsoft/trocr-base-printed", // OCR model for text extraction
      "nlpconnect/vit-gpt2-image-captioning"
    ];
    
    let bestResult = null;
    let bestConfidence = 0;
    
    // Try multiple models to get the best text extraction
    for (const model of models) {
      try {
        const response = await fetch(`${HF_BASE_URL}/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: base64Image,
            options: { wait_for_model: true }
          })
        });

        if (response.ok) {
          const result = await response.json() as any;
          const caption = result[0]?.generated_text || result.generated_text || "";
          
          if (caption && caption.length > bestConfidence) {
            bestResult = caption;
            bestConfidence = caption.length;
          }
        }
      } catch (modelError) {
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }
    
    const caption = bestResult || "Unable to analyze image";
    console.log("HuggingFace analysis result:", caption);
    
    // Enhanced text extraction and product identification
    const extractedProductName = extractProductName(caption);
    const extractedBrand = extractBrand(caption);
    
    // Try to extract ingredients and nutrition from text
    const ingredientsMatch = caption.match(/ingredients?[:\s]+([^.\n]+)/i);
    const nutritionMatch = caption.match(/(\d+)\s*calories?|nutrition[:\s]+([^.\n]+)/i);
    
    return {
      productName: extractedProductName,
      extractedText: {
        ingredients: ingredientsMatch ? ingredientsMatch[1] : "Please check product packaging for complete ingredient list",
        nutrition: nutritionMatch ? nutritionMatch[0] : "Please check product packaging for nutrition facts",
        brand: extractedBrand,
        barcode: extractBarcode(caption),
        productType: extractProductType(caption),
        allText: caption
      },
      summary: generateSummaryFromCaption(caption, extractedProductName)
    };
    
  } catch (error) {
    console.error("Error with HuggingFace vision:", error);
    throw new Error("Failed to analyze image with HuggingFace");
  }
}

export async function analyzeIngredientsHF(extractedText: any): Promise<any> {
  // For ingredients analysis, we'll use a simpler approach with predefined safe/unsafe ingredients
  const commonSafeIngredients = [
    'water', 'salt', 'sugar', 'flour', 'oil', 'butter', 'milk', 'eggs', 'vanilla',
    'baking powder', 'baking soda', 'honey', 'oats', 'rice', 'wheat', 'corn'
  ];
  
  const commonHarmfulIngredients = [
    'aspartame', 'high fructose corn syrup', 'trans fat', 'artificial colors',
    'sodium nitrate', 'monosodium glutamate', 'msg', 'bha', 'bht'
  ];
  
  const ingredientText = extractedText.ingredients?.toLowerCase() || '';
  const ingredients = [];
  
  // Extract ingredients from text and classify them
  const words = ingredientText.split(/[,;\n\r]+/).map((w: string) => w.trim()).filter((w: string) => w.length > 2);
  
  for (const word of words.slice(0, 10)) { // Limit to first 10 ingredients
    let safety = "Safe";
    let reason = "Generally recognized as safe";
    
    if (commonHarmfulIngredients.some(harmful => word.includes(harmful))) {
      safety = "Harmful";
      reason = "Potential health concerns";
    } else if (word.includes('artificial') || word.includes('preservative')) {
      safety = "Moderate";
      reason = "Contains artificial additives";
    }
    
    ingredients.push({
      name: capitalizeFirst(word),
      safety,
      reason
    });
  }
  
  if (ingredients.length === 0) {
    ingredients.push({
      name: "No ingredients detected",
      safety: "Safe",
      reason: "Unable to parse ingredient list"
    });
  }
  
  return { ingredients };
}

export async function analyzeNutritionHF(extractedText: any): Promise<any> {
  // Simple nutrition extraction from text
  const nutritionText = extractedText.nutrition?.toLowerCase() || '';
  
  let calories = 0;
  let totalSugars = "0g";
  const sugarTypes = [];
  
  // Extract calories
  const caloriesMatch = nutritionText.match(/(\d+)\s*calories?/i);
  if (caloriesMatch) {
    calories = parseInt(caloriesMatch[1]);
  }
  
  // Extract sugars
  const sugarMatch = nutritionText.match(/(\d+(?:\.\d+)?)\s*g?\s*sugar/i);
  if (sugarMatch) {
    totalSugars = `${sugarMatch[1]}g`;
    sugarTypes.push({
      type: "Total Sugars",
      amount: totalSugars
    });
  }
  
  // Look for added sugars
  const addedSugarMatch = nutritionText.match(/added\s+sugar[s]?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
  if (addedSugarMatch) {
    sugarTypes.push({
      type: "Added Sugars",
      amount: `${addedSugarMatch[1]}g`
    });
  }
  
  if (sugarTypes.length === 0) {
    sugarTypes.push({
      type: "Not specified",
      amount: "Check packaging"
    });
  }
  
  return {
    calories,
    totalSugars,
    sugarTypes
  };
}

export async function generateChatResponseHF(question: string, productData: any): Promise<string> {
  const lowerQuestion = question.toLowerCase();
  
  // Simple rule-based responses based on common questions
  if (lowerQuestion.includes("healthy") || lowerQuestion.includes("good for you")) {
    return "Based on the available product information, I can help you understand the ingredients and nutritional content. For specific health advice, please consult with a healthcare professional.";
  }
  
  if (lowerQuestion.includes("ingredient") || lowerQuestion.includes("contain")) {
    const ingredients = productData?.extractedText?.ingredients || "No ingredient information available";
    return `The product ingredients include: ${ingredients}. Please check the actual product packaging for the complete and most up-to-date ingredient list.`;
  }
  
  if (lowerQuestion.includes("calories") || lowerQuestion.includes("nutrition")) {
    return "Nutritional information can vary by serving size and preparation method. Please refer to the nutrition label on the product packaging for accurate calorie and nutrient information.";
  }
  
  if (lowerQuestion.includes("allerg") || lowerQuestion.includes("gluten")) {
    return "For allergen information including gluten, dairy, nuts, and other potential allergens, please check the product packaging directly as formulations may change.";
  }
  
  return "I can help answer questions about this product's general information. What specific aspect would you like to know more about?";
}

// Helper functions
function extractProductName(caption: string): string {
  // Improved extraction from image caption using multiple strategies
  const lowerCaption = caption.toLowerCase();
  
  // Look for common food/product patterns
  const productPatterns = [
    /(\w+\s+\w+)\s+bar/i,  // "Nature Valley bar"
    /(\w+\s+\w+)\s+snack/i, // "Granola snack"
    /(\w+)\s+(granola|energy|protein|cereal|crackers|chips)/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g // Capitalized words
  ];
  
  for (const pattern of productPatterns) {
    const match = caption.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      const productName = match[1].trim();
      // Validate it's not a generic word
      if (!['image', 'photo', 'picture', 'food', 'item', 'product'].includes(productName.toLowerCase())) {
        return productName;
      }
    }
  }
  
  // Fallback: try to extract first meaningful words
  const words = caption.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'with', 'for', 'are', 'this', 'that'].includes(word.toLowerCase())
  );
  
  if (words.length >= 2) {
    return words.slice(0, 2).join(' ');
  } else if (words.length === 1) {
    return words[0] + ' Product';
  }
  
  return "Unidentified Product";
}

function extractBrand(caption: string): string {
  // Enhanced brand extraction
  const lowerCaption = caption.toLowerCase();
  
  // Look for known brand patterns
  const knownBrands = [
    'nature valley', 'clif', 'kind', 'quaker', 'kellogg', 'general mills',
    'nabisco', 'pepsi', 'coca cola', 'frito lay', 'doritos', 'lays'
  ];
  
  for (const brand of knownBrands) {
    if (lowerCaption.includes(brand)) {
      return brand.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  // Look for capitalized words that might be brands
  const words = caption.split(' ');
  for (const word of words) {
    if (word.length > 2 && word[0] === word[0].toUpperCase() && 
        !['The', 'And', 'With', 'For'].includes(word)) {
      return word;
    }
  }
  
  return "Brand not detected";
}

function generateSummaryFromCaption(caption: string, productName?: string): string {
  // Enhanced summary generation based on caption analysis
  const name = productName || "This product";
  const lowerCaption = caption.toLowerCase();
  
  // Detect product category for better summary
  let category = "consumer product";
  let usage = "general use";
  
  if (lowerCaption.includes('granola') || lowerCaption.includes('bar') || lowerCaption.includes('snack')) {
    category = "snack bar";
    usage = "convenient on-the-go nutrition and energy boost";
  } else if (lowerCaption.includes('cereal') || lowerCaption.includes('breakfast')) {
    category = "breakfast cereal";
    usage = "morning nutrition as part of a balanced breakfast";
  } else if (lowerCaption.includes('drink') || lowerCaption.includes('beverage')) {
    category = "beverage";
    usage = "refreshment and hydration";
  } else if (lowerCaption.includes('chip') || lowerCaption.includes('crackers')) {
    category = "snack food";
    usage = "casual snacking and entertainment";
  }
  
  return `${name} is a ${category} designed for ${usage} based on visual analysis.
The product appears to be intended for consumer use with focus on convenience and portability.
For specific usage instructions and nutritional information, refer to product packaging and labels.
Quality and safety information should be verified from official manufacturer sources.
Please check the product label for complete detailed information and dietary considerations.`;
}

function extractBarcode(caption: string): string {
  // Try to extract barcode/UPC numbers
  const barcodePattern = /\b\d{12,14}\b/;
  const match = caption.match(barcodePattern);
  return match ? match[0] : "";
}

function extractProductType(caption: string): string {
  // Extract product category from caption
  const lowerCaption = caption.toLowerCase();
  
  const typeMap = {
    'granola': 'Granola Bar',
    'energy': 'Energy Bar',
    'protein': 'Protein Bar',
    'cereal': 'Cereal',
    'crackers': 'Crackers',
    'chips': 'Chips',
    'drink': 'Beverage',
    'juice': 'Juice',
    'soda': 'Soft Drink',
    'bar': 'Snack Bar'
  };
  
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lowerCaption.includes(keyword)) {
      return type;
    }
  }
  
  return "Product";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}