import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Demo data for static deployment fallback
const demoData = {
  ingredients: {
    ingredients: [
      {
        name: "Rice",
        safety: "Safe",
        reason: "Whole grain source"
      },
      {
        name: "Wheat Bran",
        safety: "Safe",
        reason: "High fiber content"
      },
      {
        name: "Vitamins (A, C, D)",
        safety: "Safe",
        reason: "Essential nutrients"
      },
      {
        name: "Iron",
        safety: "Safe",
        reason: "Essential mineral"
      },
      {
        name: "Sugar",
        safety: "Moderate",
        reason: "High sugar content"
      },
      {
        name: "Salt",
        safety: "Moderate",
        reason: "High sodium levels"
      },
      {
        name: "Malt Flavor",
        safety: "Safe",
        reason: "Natural flavoring"
      },
      {
        name: "Folic Acid",
        safety: "Safe",
        reason: "B vitamin supplement"
      }
    ]
  },
  nutrition: {
    calories: 110,
    totalSugars: "4g",
    sugarTypes: [
      { type: "Total Sugars", amount: "4g" },
      { type: "Added Sugars", amount: "3g" }
    ]
  },
  reddit: {
    pros: [
      "Great for weight management and portion control",
      "Stays crispy in milk longer than other cereals",
      "Good source of vitamins and minerals",
      "Light and not too sweet - perfect for breakfast"
    ],
    cons: [
      "Can get boring with just milk - needs fruit",
      "More expensive than regular cereals",
      "Some find it too plain without toppings",
      "Portion size feels small for the price"
    ]
  }
};

// Analyze ingredients from extracted text
function analyzeIngredientsFromText(extractedText: any): any {
  const ingredientsText = extractedText?.ingredients || extractedText?.allText || "";
  
  if (!ingredientsText || ingredientsText.includes("Please check product packaging")) {
    return demoData.ingredients;
  }
  
  // Parse ingredients and analyze safety
  const ingredientsList = ingredientsText.split(',').map((ing: string) => ing.trim()).filter((ing: string) => ing.length > 0);
  
  const analyzedIngredients = ingredientsList.map((ingredient: string) => {
    const cleanName = ingredient.replace(/[()\[\]]/g, '').trim();
    
    // Enhanced safety analysis based on ingredient name and health standards
    let safety = "Safe";
    let reason = "Generally recognized as safe";
    
    const lowerName = cleanName.toLowerCase();
    
    // Harmful ingredients (RED)
    if (lowerName.includes('trans fat') || lowerName.includes('hydrogenated oil') || lowerName.includes('partially hydrogenated')) {
      safety = "Harmful";
      reason = "Contains trans fats";
    } else if (lowerName.includes('high fructose corn syrup') || lowerName.includes('hfcs')) {
      safety = "Harmful";
      reason = "Linked to obesity";
    } else if (lowerName.includes('sodium nitrite') || lowerName.includes('sodium nitrate')) {
      safety = "Harmful";
      reason = "Potential carcinogen";
    } else if (lowerName.includes('bha') || lowerName.includes('bht') || lowerName.includes('butylated hydroxyanisole')) {
      safety = "Harmful";
      reason = "Suspected carcinogen";
    } else if (lowerName.includes('monosodium glutamate') || lowerName.includes('msg')) {
      safety = "Harmful";
      reason = "May cause headaches";
    } else if (lowerName.includes('aspartame') || lowerName.includes('saccharin')) {
      safety = "Harmful";
      reason = "Artificial sweetener risks";
    }
    
    // Moderate concern ingredients (YELLOW)
    else if (lowerName.includes('sugar') || lowerName.includes('syrup') || lowerName.includes('sweetener') || lowerName.includes('dextrose')) {
      safety = "Moderate";
      reason = "High sugar content";
    } else if (lowerName.includes('sodium') || lowerName.includes('salt') && !lowerName.includes('sea salt')) {
      safety = "Moderate";
      reason = "High sodium levels";
    } else if (lowerName.includes('artificial flavor') || lowerName.includes('artificial color') || lowerName.includes('artificial')) {
      safety = "Moderate";
      reason = "Artificial additive";
    } else if (lowerName.includes('preservative') || lowerName.includes('citric acid') || lowerName.includes('potassium sorbate')) {
      safety = "Moderate";
      reason = "Chemical preservative";
    } else if (lowerName.includes('corn syrup') || lowerName.includes('glucose syrup')) {
      safety = "Moderate";
      reason = "Processed sweetener";
    } else if (lowerName.includes('modified') || lowerName.includes('modified starch') || lowerName.includes('modified corn')) {
      safety = "Moderate";
      reason = "Processed ingredient";
    }
    
    // Safe ingredients (GREEN)
    else if (lowerName.includes('wheat') || lowerName.includes('rice') || lowerName.includes('oat') || lowerName.includes('barley')) {
      safety = "Safe";
      reason = "Whole grain source";
    } else if (lowerName.includes('vitamin') || lowerName.includes('mineral') || lowerName.includes('iron') || lowerName.includes('calcium')) {
      safety = "Safe";
      reason = "Essential nutrient";
    } else if (lowerName.includes('fiber') || lowerName.includes('bran') || lowerName.includes('cellulose')) {
      safety = "Safe";
      reason = "Dietary fiber";
    } else if (lowerName.includes('natural flavor') || lowerName.includes('vanilla extract') || lowerName.includes('cocoa')) {
      safety = "Safe";
      reason = "Natural flavoring";
    } else if (lowerName.includes('sea salt') || lowerName.includes('himalayan salt')) {
      safety = "Safe";
      reason = "Natural mineral salt";
    } else if (lowerName.includes('honey') || lowerName.includes('maple') || lowerName.includes('molasses')) {
      safety = "Safe";
      reason = "Natural sweetener";
    } else if (lowerName.includes('protein') || lowerName.includes('amino acid')) {
      safety = "Safe";
      reason = "Protein source";
    } else if (lowerName.includes('oil') && (lowerName.includes('olive') || lowerName.includes('sunflower') || lowerName.includes('coconut'))) {
      safety = "Safe";
      reason = "Natural oil source";
    }
    
    return {
      name: cleanName,
      safety,
      reason
    };
  });
  
  // Sort by safety level for better visual organization
  const sortedIngredients = analyzedIngredients.sort((a, b) => {
    const order = { "Safe": 0, "Moderate": 1, "Harmful": 2 };
    return order[a.safety as keyof typeof order] - order[b.safety as keyof typeof order];
  });
  
  return {
    ingredients: sortedIngredients.slice(0, 12) // Limit to 12 ingredients for display
  };
}

// Analyze nutrition from extracted text
function analyzeNutritionFromText(extractedText: any): any {
  const nutritionText = extractedText?.nutrition || extractedText?.allText || "";
  
  if (!nutritionText || nutritionText.includes("Please check product packaging")) {
    return demoData.nutrition;
  }
  
  // Extract calories
  const caloriesMatch = nutritionText.match(/(\d+)\s*calories?/i);
  const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 110;
  
  // Extract sugars
  const sugarMatch = nutritionText.match(/total\s*sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i) || 
                    nutritionText.match(/sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i);
  const totalSugars = sugarMatch ? `${sugarMatch[1]}g` : "4g";
  
  const addedSugarMatch = nutritionText.match(/added\s*sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i);
  const addedSugars = addedSugarMatch ? `${addedSugarMatch[1]}g` : "3g";
  
  return {
    calories,
    totalSugars,
    sugarTypes: [
      { type: "Total Sugars", amount: totalSugars },
      { type: "Added Sugars", amount: addedSugars }
    ]
  };
}

// Generate contextual Reddit reviews
function generateContextualRedditReviews(productName: string): any {
  const lowerProductName = productName.toLowerCase();
  
  if (lowerProductName.includes('special k')) {
    return {
      pros: [
        "Perfect for my weight loss journey - keeps me satisfied",
        "Love that it stays crunchy in milk and doesn't get soggy",
        "Great source of vitamins and iron for busy mornings",
        "Light but filling - helps with portion control"
      ],
      cons: [
        "Gets boring quickly - I have to add berries or banana",
        "More expensive than other cereals in my grocery store",
        "Wish the serving size was a bit larger for the price",
        "Too plain on its own - needs fruit to make it interesting"
      ]
    };
  } else if (lowerProductName.includes('granola')) {
    return {
      pros: [
        "Great for hiking and outdoor activities",
        "Crunchy texture is very satisfying",
        "Good source of whole grains and fiber",
        "Convenient portable snack option"
      ],
      cons: [
        "High sugar content for a health bar",
        "Can be too sweet for some people",
        "Crumbs everywhere when eating",
        "More expensive than regular granola bars"
      ]
    };
  }
  
  // Default reviews
  return demoData.reddit;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Fallback for static deployment (GitHub Pages)
    console.log('API request failed, using dynamic analysis for:', url);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the current analysis data from sessionStorage if available
    const currentAnalysis = sessionStorage.getItem('currentAnalysis');
    let extractedText = null;
    let productName = "Unknown Product";
    
    if (currentAnalysis) {
      const analysis = JSON.parse(currentAnalysis);
      extractedText = analysis.extractedText;
      productName = analysis.productName;
    }
    
    // Return analysis based on extracted text and endpoint
    let responseData;
    if (url.includes('analyze-ingredients')) {
      responseData = extractedText ? analyzeIngredientsFromText(extractedText) : demoData.ingredients;
    } else if (url.includes('analyze-nutrition')) {
      responseData = extractedText ? analyzeNutritionFromText(extractedText) : demoData.nutrition;
    } else if (url.includes('analyze-reddit')) {
      responseData = generateContextualRedditReviews(productName);
    } else {
      throw error; // Re-throw for non-analysis endpoints
    }
    
    // Create a mock Response object
    return {
      ok: true,
      status: 200,
      json: async () => responseData
    } as Response;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
