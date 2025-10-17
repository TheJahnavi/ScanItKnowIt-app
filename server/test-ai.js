// Simple test script to verify AI functionality
import { identifyProductAndExtractText, analyzeIngredients, analyzeNutrition } from './services/openai.js';

// Test data - mock base64 image data
const mockBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="; // 1x1 transparent PNG

async function testAI() {
  console.log("Testing AI functionality...");
  
  try {
    // Test product identification
    console.log("Testing product identification...");
    const productResult = await identifyProductAndExtractText(mockBase64Image);
    console.log("Product identification result:", productResult);
    
    // Test ingredient analysis
    console.log("Testing ingredient analysis...");
    const ingredientResult = await analyzeIngredients({
      ingredients: "Whole Grain Oats, Sugar, Canola Oil, Rice Flour, Honey"
    });
    console.log("Ingredient analysis result:", ingredientResult);
    
    // Test nutrition analysis
    console.log("Testing nutrition analysis...");
    const nutritionResult = await analyzeNutrition({
      nutrition: "Calories 190 per serving, Total Fat 6g, Total Sugars 11g, Protein 4g"
    });
    console.log("Nutrition analysis result:", nutritionResult);
    
    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testAI();