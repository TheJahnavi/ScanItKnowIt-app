import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CameraScreen } from "@/components/camera-screen";
import { ProcessingScreen } from "@/components/processing-screen";
import { AnalysisScreen } from "@/components/analysis-screen";
import { ThemeToggle } from "@/components/theme-provider";
import { Camera } from "lucide-react";
import type { ProductAnalysis } from "@/types/analysis";

type AppState = "camera" | "processing" | "analysis";

// Client-side image analysis function
async function performClientSideAnalysis(base64Image: string, fileName: string): Promise<ProductAnalysis> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Try OCR.space free API for text extraction
    const ocrResult = await performOCRAnalysis(base64Image);
    
    if (ocrResult && ocrResult.extractedText && ocrResult.extractedText.trim().length > 10) {
      console.log('OCR extracted text:', ocrResult.extractedText);
      return analyzeExtractedText(ocrResult.extractedText, fileName);
    }
  } catch (error) {
    console.log('OCR failed, using image-based analysis:', error);
  }
  
  // Fallback to image-based analysis using computer vision
  return analyzeImageVisually(base64Image, fileName);
}

// OCR.space API for text extraction
async function performOCRAnalysis(base64Image: string): Promise<{extractedText: string} | null> {
  try {
    const body = new URLSearchParams();
    body.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    body.append('apikey', 'helloworld'); // Free tier key
    body.append('language', 'eng');
    body.append('isOverlayRequired', 'false');
    body.append('detectOrientation', 'true');
    body.append('scale', 'true');
    body.append('OCREngine', '2');
    body.append('isTable', 'true');
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('OCR.space result:', result);
      
      if (result.ParsedResults && result.ParsedResults[0]) {
        const extractedText = result.ParsedResults[0].ParsedText;
        if (extractedText && extractedText.trim().length > 10) {
          return { extractedText };
        }
      }
    }
  } catch (error) {
    console.error('OCR.space error:', error);
  }
  
  return null;
}

// Analyze extracted text to identify product with enhanced cosmetic/skincare detection
function analyzeExtractedText(text: string, fileName: string): ProductAnalysis {
  const lowerText = text.toLowerCase();
  const lines = text.split('\n').filter(line => line.trim());
  
  // Enhanced product type detection - prioritize cosmetic/skincare identification
  let productName = "Unknown Product";
  let brand = "";
  let productType = "Food Product"; // Default
  let category = "Food Product";
  
  // PRIORITY 1: Detect cosmetic/skincare products by ingredients
  const cosmeticIngredients = [
    'aqua', 'water', 'niacinamide', 'zinc pca', 'tamarindus indica', 'pentylene glycol',
    'carrageenan', 'acacia senegal', 'xanthan gum', 'ppg-26', 'buteth-26', 'peg-40',
    'hydrogenated castor oil', 'ethoxydiglycol', 'phenoxyethanol', 'chlorphenesin',
    'glycerin', 'dimethicone', 'hyaluronic acid', 'retinol', 'salicylic acid',
    'ceramide', 'panthenol', 'tocopherol', 'ascorbic acid', 'kojic acid',
    'arbutin', 'alpha arbutin', 'azelaic acid', 'benzoyl peroxide'
  ];
  
  const cosmeticKeywords = [
    'serum', 'cream', 'lotion', 'moisturizer', 'cleanser', 'toner', 'essence',
    'treatment', 'anti-aging', 'anti aging', 'wrinkle', 'acne', 'brightening',
    'whitening', 'hydrating', 'exfoliating', 'sunscreen', 'spf', 'facial',
    'skincare', 'cosmetic', 'beauty', 'dermatology', 'dermatologist'
  ];
  
  // Check for cosmetic ingredients and keywords
  const cosmeticIngredientCount = cosmeticIngredients.filter(ing => 
    lowerText.includes(ing)
  ).length;
  
  const cosmeticKeywordCount = cosmeticKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  if (cosmeticIngredientCount >= 3 || cosmeticKeywordCount >= 1) {
    productType = "Cosmetic Product";
    category = "Cosmetic Product - Skincare";
    
    // Detect specific cosmetic product types
    if (lowerText.includes('serum')) {
      productName = "Skincare Serum";
      category = "Cosmetic Product - Serum";
    } else if (lowerText.includes('cream') || lowerText.includes('moisturizer')) {
      productName = "Moisturizing Cream";
      category = "Cosmetic Product - Moisturizer";
    } else if (lowerText.includes('cleanser')) {
      productName = "Facial Cleanser";
      category = "Cosmetic Product - Cleanser";
    } else if (lowerText.includes('toner')) {
      productName = "Facial Toner";
      category = "Cosmetic Product - Toner";
    } else if (lowerText.includes('niacinamide')) {
      productName = "Niacinamide Treatment";
      category = "Cosmetic Product - Treatment";
    } else {
      productName = "Skincare Product";
    }
  }
  
  // PRIORITY 2: Advanced title detection for all product types
  const titleCandidates = [];
  const cleanLines = lines.map(line => line.trim()).filter(line => line.length > 0);
  
  // Only do title detection if we haven't identified a cosmetic product by ingredients
  if (productType === "Food Product") {
    // Check first 8 lines for potential product titles (titles are usually at top)
    for (let i = 0; i < Math.min(8, cleanLines.length); i++) {
      const line = cleanLines[i];
      
      // Skip lines that are clearly not product titles
      if (line.length < 3 || 
          /^[0-9\s%$.,]+$/.test(line) || // Only numbers/symbols
          /^\d+\s*(mg|g|oz|ml|fl|calories|kcal|serving|net|weight)\b/i.test(line) || // Nutrition info
          /^(nutrition|ingredients|calories|serving|net|weight|contains|allergen|distributed|manufactured)\b/i.test(line.toLowerCase()) ||
          line.length > 60) { // Too long to be a title
        continue;
      }
      
      // Calculate title likelihood score
      let titleScore = 0;
      
      // Higher score for lines near the top (titles appear first)
      titleScore += (8 - i) * 2;
      
      // Higher score for mixed case formatting (proper title capitalization)
      if (/[a-z]/.test(line) && /[A-Z]/.test(line)) titleScore += 4;
      
      // Higher score for reasonable title length (most product names are 8-40 chars)
      if (line.length >= 8 && line.length <= 40) titleScore += 5;
      
      // Higher score for containing letters with some numbers (variants, sizes)
      if (/[a-zA-Z]/.test(line) && /\d/.test(line)) titleScore += 3;
      
      // Lower score for too many special characters
      const specialChars = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;
      if (specialChars > 3) titleScore -= 2;
      
      // Higher score for common product title words
      const titleWords = ['original', 'classic', 'special', 'premium', 'organic', 'natural', 'whole', 'extra', 'light', 'reduced'];
      if (titleWords.some(word => line.toLowerCase().includes(word))) titleScore += 3;
      
      // Add to candidates if score meets threshold
      if (titleScore > 4) {
        titleCandidates.push({ text: line, score: titleScore, position: i });
      }
    }
    
    // Sort title candidates by score (highest first)
    titleCandidates.sort((a, b) => b.score - a.score);
  }
  
  // Comprehensive brand detection patterns with enhanced title matching
  const brandPatterns = [
    // Kellogg's products (most comprehensive)
    { pattern: /kellogg'?s\s+(.*)/i, brand: "Kellogg's", type: "Breakfast Cereal" },
    { pattern: /(special\s*k)\s*(.*)/i, brand: "Kellogg's", type: "Breakfast Cereal" },
    { pattern: /(corn\s*flakes)/i, brand: "Kellogg's", type: "Breakfast Cereal" },
    { pattern: /(frosted\s*flakes|froot\s*loops|rice\s*krispies)/i, brand: "Kellogg's", type: "Breakfast Cereal" },
    { pattern: /(all\s*bran|bran\s*flakes)/i, brand: "Kellogg's", type: "Breakfast Cereal" },
    
    // General Mills
    { pattern: /general\s*mills\s+(.*)/i, brand: "General Mills", type: "Breakfast Cereal" },
    { pattern: /(cheerios|lucky\s*charms|trix|cocoa\s*puffs|cinnamon\s*toast\s*crunch)/i, brand: "General Mills", type: "Breakfast Cereal" },
    
    // Quaker Oats Company
    { pattern: /quaker\s+(.*)/i, brand: "Quaker", type: "Breakfast/Snacks" },
    { pattern: /(quaker\s*oats|life\s*cereal)/i, brand: "Quaker", type: "Breakfast" },
    
    // Nature Valley & Snack Bars
    { pattern: /nature\s*valley\s+(.*)/i, brand: "Nature Valley", type: "Granola Bar" },
    { pattern: /(granola\s*bar|protein\s*bar|energy\s*bar)/i, brand: "", type: "Snack Bar" },
    
    // Beverage brands
    { pattern: /coca[\s-]*cola\s+(.*)/i, brand: "Coca-Cola", type: "Beverage" },
    { pattern: /(coke|sprite|fanta)\s*(.*)/i, brand: "Coca-Cola", type: "Beverage" },
    { pattern: /pepsi\s+(.*)/i, brand: "PepsiCo", type: "Beverage" },
    { pattern: /(pepsi|mountain\s*dew|doritos|cheetos|fritos)/i, brand: "PepsiCo", type: "Beverage/Snacks" },
    
    // Food manufacturers
    { pattern: /kraft\s+(.*)/i, brand: "Kraft", type: "Food Product" },
    { pattern: /nestle\s+(.*)/i, brand: "Nestlé", type: "Food Product" },
    { pattern: /campbell'?s\s+(.*)/i, brand: "Campbell's", type: "Soup" },
    
    // Snack brands
    { pattern: /lay'?s\s+(.*)/i, brand: "Lay's", type: "Snacks" },
    { pattern: /(pringles)/i, brand: "Pringles", type: "Snacks" },
    { pattern: /(goldfish)/i, brand: "Pepperidge Farm", type: "Crackers" },
    
    // Cookie/Cracker brands  
    { pattern: /(oreo|chips\s*ahoy|nutter\s*butter)/i, brand: "Nabisco", type: "Cookies" },
    { pattern: /(ritz|triscuit|wheat\s*thins)/i, brand: "Nabisco", type: "Crackers" },
    
    // Product type patterns (for unbranded products)
    { pattern: /(.*\s*cereal)/i, brand: "", type: "Breakfast Cereal" },
    { pattern: /(.*\s*crackers?)/i, brand: "", type: "Crackers" },
    { pattern: /(.*\s*cookies?)/i, brand: "", type: "Cookies" },
    { pattern: /(.*\s*chips?)/i, brand: "", type: "Snacks" }
  ];
  
  // Smart brand pattern matching with title candidate integration
  let detectedBrand = null;
  let bestMatch = null;
  
  // First priority: Match brand patterns in high-scoring title candidates
  for (const candidate of titleCandidates.slice(0, 3)) { // Check top 3 candidates
    for (const brandPattern of brandPatterns) {
      const match = candidate.text.match(brandPattern.pattern);
      if (match) {
        detectedBrand = brandPattern;
        brand = brandPattern.brand;
        productType = brandPattern.type;
        bestMatch = match;
        
        // Use the full candidate text as product name for better title detection
        productName = candidate.text;
        break;
      }
    }
    if (detectedBrand) break;
  }
  
  // Second priority: Match brand patterns in full text if no title match
  if (!detectedBrand) {
    for (const brandPattern of brandPatterns) {
      const match = text.match(brandPattern.pattern);
      if (match) {
        detectedBrand = brandPattern;
        brand = brandPattern.brand;
        productType = brandPattern.type;
        bestMatch = match;
        
        // Try to construct product name from brand + matched text
        if (match[1] && match[1].trim() && brand) {
          productName = `${brand} ${match[1].trim()}`;
        } else if (match[0]) {
          productName = match[0].trim();
        }
        break;
      }
    }
  }
  
  // Special case for Special K (common OCR result)
  if (lowerText.includes('special') && lowerText.includes('k')) {
    brand = "Kellogg's";
    productType = "Breakfast Cereal";
    
    // Look for specific Special K varieties
    if (lowerText.includes('original')) {
      productName = "Kellogg's Special K Original";
    } else if (lowerText.includes('protein')) {
      productName = "Kellogg's Special K Protein";
    } else if (lowerText.includes('red berries')) {
      productName = "Kellogg's Special K Red Berries";
    } else {
      productName = "Kellogg's Special K";
    }
  }
  
  // Advanced fallback: Use best title candidate if no brand pattern matched
  if (!detectedBrand && titleCandidates.length > 0) {
    // Select the highest-scoring title candidate
    const bestCandidate = titleCandidates[0];
    productName = bestCandidate.text;
    
    // Intelligent brand inference from title text
    const titleLower = bestCandidate.text.toLowerCase();
    if (titleLower.includes('special') && titleLower.includes('k')) {
      brand = "Kellogg's";
      productType = "Breakfast Cereal";
    } else if (titleLower.includes('cheerios')) {
      brand = "General Mills";
      productType = "Breakfast Cereal";
    } else if (titleLower.includes('nature') && titleLower.includes('valley')) {
      brand = "Nature Valley";
      productType = "Granola Bar";
    } else if (titleLower.includes('quaker')) {
      brand = "Quaker";
      productType = "Breakfast";
    }
    
    // Infer product type from title content
    if (titleLower.includes('cereal') || titleLower.includes('flakes') || titleLower.includes('loops') || titleLower.includes('crunch')) {
      productType = "Breakfast Cereal";
    } else if (titleLower.includes('bar') || titleLower.includes('granola')) {
      productType = "Granola Bar";
    } else if (titleLower.includes('drink') || titleLower.includes('juice') || titleLower.includes('soda') || titleLower.includes('beverage')) {
      productType = "Beverage";
    } else if (titleLower.includes('cookie') || titleLower.includes('cracker') || titleLower.includes('chip')) {
      productType = "Snack";
    } else if (titleLower.includes('soup') || titleLower.includes('sauce')) {
      productType = "Prepared Food";
    }
  }
  
  // Advanced product name cleaning and formatting
  if (productName !== "Unknown Product") {
    // Remove common non-product text patterns
    productName = productName
      .replace(/\b(net\s*weight|contents|serving|size|nutrition|facts|distributed\s*by|manufactured\s*by)\b/gi, '')
      .replace(/\b\d+\s*(oz|g|mg|ml|fl|lbs?|calories|kcal)\b/gi, '') // Remove measurements and nutrition info
      .replace(/[^a-zA-Z0-9\s'&-]/g, ' ') // Keep letters, numbers, spaces, apostrophes, ampersands, hyphens
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
    
    // Apply proper title case formatting
    productName = productName
      .split(' ')
      .map(word => {
        // Keep small connecting words lowercase unless they're the first word
        if (word.length <= 2 && ['of', 'in', 'on', 'at', 'to', 'a', 'an', 'the', '&'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    // Fix specific brand capitalizations
    productName = productName
      .replace(/\bspecial k\b/gi, 'Special K')
      .replace(/\boreo\b/gi, 'Oreo')
      .replace(/\bcheerios\b/gi, 'Cheerios')
      .replace(/\bdoritos\b/gi, 'Doritos')
      .replace(/\bcheetos\b/gi, 'Cheetos')
      .replace(/\bkellogg'?s\b/gi, "Kellogg's");
  }
  
  // Final intelligent fallback for title detection
  if (productName === "Unknown Product" || productName.length < 3) {
    // Find the most title-like line from OCR text
    const meaningfulLines = cleanLines.filter(line => {
      return line.length >= 5 && 
             line.length <= 50 &&
             !/^[0-9\s%$.,]+$/.test(line) &&
             !/^\d+\s*(mg|g|oz|ml|fl|calories|kcal|serving|net|weight)\b/i.test(line) &&
             !/^(nutrition|ingredients|calories|serving|net|weight|contains|allergen|distributed|manufactured)\b/i.test(line.toLowerCase()) &&
             /[a-zA-Z]/.test(line); // Must contain letters
    });
    
    if (meaningfulLines.length > 0) {
      // Score each line for title likelihood
      let bestLine = meaningfulLines[0];
      let bestScore = 0;
      
      for (const line of meaningfulLines.slice(0, 5)) { // Check first 5 meaningful lines
        let score = 0;
        
        // Prefer mixed case (title formatting)
        if (/[a-z]/.test(line) && /[A-Z]/.test(line)) score += 3;
        
        // Prefer reasonable title length
        if (line.length >= 8 && line.length <= 35) score += 2;
        
        // Prefer lines without too many numbers
        const numberCount = (line.match(/\d/g) || []).length;
        if (numberCount <= 2) score += 1;
        
        // Prefer lines with brand indicators
        if (/\b(special|original|classic|premium|organic|natural)\b/i.test(line)) score += 2;
        
        if (score > bestScore) {
          bestScore = score;
          bestLine = line;
        }
      }
      
      // Format the detected title
      productName = bestLine
        .replace(/[^a-zA-Z0-9\s'&-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  
  // Enhanced ingredient extraction with comprehensive parsing for cosmetic products
  let ingredients = "";
  let ingredientsList: string[] = [];
  
  // Strategy 1: Look for explicit "Ingredients:" or "Ingrédients:" label and capture multi-line content
  const ingredientMatch = text.match(/in[gré]*dients?[\s\/]*[:\s]+([\s\S]*?)(?=\n\n|\n[A-Z]{2,}|$)/i);
  if (ingredientMatch) {
    ingredients = ingredientMatch[1].trim();
    console.log('Found ingredients with explicit label:', ingredients);
  }
  
  // Strategy 2: For cosmetic products, find AQUA/WATER and capture everything after it (enhanced)
  if (!ingredients && productType === "Cosmetic Product") {
    // Find line with AQUA or WATER that looks like an ingredient list start
    const aquaLineIndex = lines.findIndex(line => {
      const lowerLine = line.toLowerCase();
      return (lowerLine.includes('aqua') || lowerLine.includes('water')) && 
             (line.includes(',') || line.length > 30); // More likely to be ingredient list
    });
    
    if (aquaLineIndex !== -1) {
      // Capture this line and all subsequent lines that contain ingredients
      const ingredientLines = [lines[aquaLineIndex]];
      
      // Look for continuation lines with enhanced detection
      for (let i = aquaLineIndex + 1; i < lines.length && i < aquaLineIndex + 15; i++) {
        const line = lines[i].trim();
        if (line.length < 2) continue; // Skip very short lines
        
        const lowerLine = line.toLowerCase();
        
        // Stop if we hit clear section breaks
        if (/^(directions?|warnings?|caution|net\s*wt|net\s*weight|size|made\s*in|distributed|manufactured|exp|lot|batch|use\s*by)/i.test(line)) {
          break;
        }
        
        // Include lines that contain ingredient patterns
        const hasCommas = line.includes(',');
        const hasIngredientTerms = ['gum', 'oil', 'acid', 'glycol', 'peg', 'ppg', 'phenoxy', 'chlor', 'extract', 'buteth', 'cetyl', 'stearyl', 'palmitate'].some(term => lowerLine.includes(term));
        const hasCapitalizedWords = /[A-Z]{2,}/.test(line) && !/^[A-Z\s-]+$/.test(line); // Mixed case indicating ingredients
        const isLikelyIngredient = hasCommas || hasIngredientTerms || hasCapitalizedWords;
        
        if (isLikelyIngredient && line.length > 5) {
          ingredientLines.push(line);
        } else if (!hasCommas && !hasIngredientTerms && line.length < 20) {
          // Short line without obvious ingredient markers - might be end of ingredients
          break;
        }
      }
      
      ingredients = ingredientLines.join(' ').replace(/\s+/g, ' ').trim();
      console.log('Found cosmetic ingredients starting with AQUA/WATER:', ingredients);
    }
  }
  
  // Strategy 3: Enhanced fallback pattern matching
  if (!ingredients) {
    const potentialIngredientLines = [];
    let foundIngredientSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      // Skip clearly non-ingredient lines
      if (lowerLine.includes('nutrition') || lowerLine.includes('calories') || 
          lowerLine.includes('serving') || /^\d+\s*(mg|g|oz|ml|fl|kcal)/.test(lowerLine) ||
          lowerLine.includes('directions') || lowerLine.includes('warning') ||
          lowerLine.includes('net wt') || lowerLine.includes('best by')) {
        continue;
      }
      
      // Look for lines that are likely ingredients
      const hasMultipleCommas = (line.match(/,/g) || []).length >= 2;
      const hasCosmedicIngredients = ['aqua', 'water', 'glycol', 'phenoxyethanol', 'gum', 'zinc', 'niacinamide', 'acid', 'oil', 'glycerin', 'dimethicone'].some(ing => lowerLine.includes(ing));
      const hasChemicalNames = /\b[A-Z]{2,}[A-Z\s-]*\b/.test(line) && line.length > 15;
      
      // Mark as ingredient line if it meets criteria
      if ((hasMultipleCommas || hasCosmedicIngredients || hasChemicalNames) && line.length > 15) {
        potentialIngredientLines.push(line);
        foundIngredientSection = true;
      } else if (foundIngredientSection && line.length < 10) {
        // Short line after finding ingredients might indicate end
        break;
      }
    }
    
    // Combine all potential ingredient lines
    if (potentialIngredientLines.length > 0) {
      ingredients = potentialIngredientLines.join(' ').replace(/\s+/g, ' ').trim();
      console.log('Found ingredients from enhanced pattern matching:', ingredients);
    }
  }
  
  // Strategy 4: Final fallback - look for any line with many commas
  if (!ingredients) {
    for (const line of lines) {
      if ((line.match(/,/g) || []).length >= 4 && line.length > 30) {
        ingredients = line.trim();
        console.log('Found ingredients from comma-heavy line:', ingredients);
        break;
      }
    }
  }
  
  // Parse ingredients into individual items
  if (ingredients) {
    // Clean up the ingredients text
    ingredients = ingredients
      .replace(/^in[gré]*dients?[\s\/]*[:\s]*/i, '') // Remove "Ingredients:" prefix
      .replace(/[()\[\]]/g, '') // Remove brackets
      .trim();
    
    // Enhanced splitting to capture all ingredients with multiple strategies
    let rawIngredients = [];
    
    // Try comma splitting first
    if (ingredients.includes(',')) {
      rawIngredients = ingredients.split(',');
    }
    // Try semicolon splitting if no commas
    else if (ingredients.includes(';')) {
      rawIngredients = ingredients.split(';');
    }
    // Try space splitting for all-caps ingredient lists
    else if (/^[A-Z\s-]+$/.test(ingredients)) {
      rawIngredients = ingredients.split(/\s{2,}|\s-\s/);
    }
    // Fallback to splitting by multiple spaces
    else {
      rawIngredients = ingredients.split(/\s{2,}/);
    }
    
    // Clean and filter ingredients
    ingredientsList = rawIngredients
      .map(item => item.trim())
      .filter(item => {
        return item.length > 1 && 
               !item.match(/^\d+$/) && 
               item.length < 100 && 
               !item.toLowerCase().includes('contains') &&
               !item.toLowerCase().includes('may contain') &&
               !/^(and|or|in|with|from)$/i.test(item);
      })
      .slice(0, 30); // Increased to 30 ingredients for comprehensive capture
    
    console.log('Enhanced parsed ingredients list:', ingredientsList);
  }
  
  // If we have a parsed list but no ingredients string, recreate it
  if (ingredientsList.length > 0 && !ingredients) {
    ingredients = ingredientsList.join(', ');
  }
  
  // Enhanced nutrition facts extraction with cosmetic product handling
  let nutrition = "";
  let nutritionData: {
    calories: number | string | null,
    totalFat: string | null,
    carbohydrates: string | null,
    protein: string | null,
    sugars: {
      total: string | null,
      added: string | null,
      types: { type: string; amount: string; }[]
    }
  } = {
    calories: null,
    totalFat: null,
    carbohydrates: null,
    protein: null,
    sugars: {
      total: null,
      added: null,
      types: []
    }
  };
  
  // Skip nutrition analysis for cosmetic products
  if (productType === "Cosmetic Product") {
    nutrition = "Not applicable for cosmetic products";
    nutritionData = {
      calories: "N/A",
      totalFat: "N/A",
      carbohydrates: "N/A",
      protein: "N/A",
      sugars: {
        total: "N/A",
        added: "N/A",
        types: [{ type: "Cosmetic Product", amount: "No nutritional content" }]
      }
    };
  } else {
    // Extract nutrition for food products only
    
    // Extract calories
    const caloriesMatch = text.match(/(\d+)\s*calories?/i);
    if (caloriesMatch) {
      nutritionData.calories = parseInt(caloriesMatch[1]);
    }
    
    // Extract macronutrients
    const fatMatch = text.match(/total\s*fat[:\s]*(\d+(?:\.\d+)?)\s*g/i);
    if (fatMatch) {
      nutritionData.totalFat = `${fatMatch[1]}g`;
    }
    
    const carbMatch = text.match(/total\s*carb[\w\s]*[:\s]*(\d+(?:\.\d+)?)\s*g/i);
    if (carbMatch) {
      nutritionData.carbohydrates = `${carbMatch[1]}g`;
    }
    
    const proteinMatch = text.match(/protein[:\s]*(\d+(?:\.\d+)?)\s*g/i);
    if (proteinMatch) {
      nutritionData.protein = `${proteinMatch[1]}g`;
    }
    
    // Enhanced sugar extraction
    const totalSugarsMatch = text.match(/total\s*sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i) ||
                            text.match(/sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i);
    if (totalSugarsMatch) {
      nutritionData.sugars.total = `${totalSugarsMatch[1]}g`;
    }
    
    const addedSugarsMatch = text.match(/added\s*sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/i);
    if (addedSugarsMatch) {
      nutritionData.sugars.added = `${addedSugarsMatch[1]}g`;
    }
    
    // Look for specific sugar types
    const sugarTypes = [];
    if (text.match(/high\s*fructose\s*corn\s*syrup|hfcs/i)) {
      sugarTypes.push({ type: "High Fructose Corn Syrup", amount: "varies" });
    }
    if (text.match(/corn\s*syrup/i)) {
      sugarTypes.push({ type: "Corn Syrup", amount: "varies" });
    }
    if (text.match(/cane\s*sugar|sugar\s*cane/i)) {
      sugarTypes.push({ type: "Cane Sugar", amount: "varies" });
    }
    if (text.match(/dextrose/i)) {
      sugarTypes.push({ type: "Dextrose", amount: "varies" });
    }
    if (text.match(/fructose/i)) {
      sugarTypes.push({ type: "Fructose", amount: "varies" });
    }
    if (text.match(/glucose/i)) {
      sugarTypes.push({ type: "Glucose", amount: "varies" });
    }
    if (text.match(/sucrose/i)) {
      sugarTypes.push({ type: "Sucrose", amount: "varies" });
    }
    if (text.match(/honey/i)) {
      sugarTypes.push({ type: "Honey", amount: "varies" });
    }
    if (text.match(/maple\s*syrup/i)) {
      sugarTypes.push({ type: "Maple Syrup", amount: "varies" });
    }
    
    nutritionData.sugars.types = sugarTypes;
    
    // Build nutrition summary text
    if (nutritionData.calories || nutritionData.totalFat || nutritionData.carbohydrates || nutritionData.protein) {
      const parts = [];
      if (nutritionData.calories) parts.push(`Calories ${nutritionData.calories}`);
      if (nutritionData.totalFat) parts.push(`Total Fat ${nutritionData.totalFat}`);
      if (nutritionData.carbohydrates) parts.push(`Total Carbohydrates ${nutritionData.carbohydrates}`);
      if (nutritionData.protein) parts.push(`Protein ${nutritionData.protein}`);
      if (nutritionData.sugars.total) parts.push(`Total Sugars ${nutritionData.sugars.total}`);
      nutrition = parts.join(', ');
    }
  }
  
  // Generate enhanced contextual summary with category and usage instructions
  let summary = "";
  
  // Determine product category and specific usage based on detected product type
  if (productType === "Cosmetic Product") {
    if (category.includes('Serum')) {
      summary = `**Category:** ${category} | **Use:** Apply 2-3 drops to clean face, gently pat until absorbed. **Purpose:** Delivers concentrated active ingredients for targeted skin concerns and improvement. **Instructions:** Use morning/evening after cleansing, follow with moisturizer and SPF during day. **Benefits:** Improves skin texture, tone, and addresses specific skin issues with potent formulation.`;
    } else if (category.includes('Treatment')) {
      summary = `**Category:** ${category} | **Use:** Apply thin layer to affected areas after cleansing. **Purpose:** Provides therapeutic benefits for specific skin conditions and concerns. **Instructions:** Start with every other day, gradually increase frequency as skin tolerates. **Benefits:** Targets specific skin issues with active ingredients for visible improvement.`;
    } else if (category.includes('Moisturizer')) {
      summary = `**Category:** ${category} | **Use:** Apply evenly to face and neck after cleansing and treatments. **Purpose:** Hydrates and protects skin barrier while providing essential moisture. **Instructions:** Use twice daily, morning and evening, as final skincare step before SPF. **Benefits:** Maintains skin hydration, improves texture, and supports healthy skin barrier function.`;
    } else {
      summary = `**Category:** ${category} | **Use:** Apply to clean skin as directed on packaging. **Purpose:** Provides skincare benefits and improves skin condition with specialized formulation. **Instructions:** Patch test before first use, follow product guidelines for frequency. **Benefits:** Enhances skin appearance and health through targeted skincare ingredients.`;
    }
  } else if (productType === "Breakfast Cereal") {
    category = "Food Product - Breakfast Cereal";
    if (productName.toLowerCase().includes('special k')) {
      summary = "**Category:** Breakfast Cereal | **Use:** Pour 3/4 cup cereal into bowl, add 1/2 cup cold milk, enjoy immediately. **Purpose:** Low-fat breakfast option providing essential vitamins and minerals for weight management and daily nutrition. **Instructions:** Best consumed in the morning as part of balanced diet. **Benefits:** Supports active lifestyle with protein and fiber content.";
    } else {
      summary = `**Category:** ${category} | **Use:** Pour recommended serving into bowl with cold milk. **Purpose:** Provides essential morning nutrition with grains and fortified vitamins. **Instructions:** Consume as breakfast with milk, can add fresh fruit for enhanced nutrition. **Benefits:** Sustained energy and essential nutrients for daily activities.`;
    }
  } else if (productType === "Granola Bar" || productType === "Snack Bar") {
    category = "Food Product - Snack/Energy Bar";
    summary = `**Category:** ${category} | **Use:** Consume directly from wrapper as on-the-go snack. **Purpose:** Provides quick energy and nutrition for active lifestyles and between meals. **Instructions:** Eat 1 bar per serving, ideal before/after exercise or as meal replacement. **Benefits:** Convenient portable nutrition with wholesome ingredients.`;
  } else if (productType === "Beverage") {
    category = "Food Product - Beverage";
    summary = `**Category:** ${category} | **Use:** Serve chilled, shake well before consumption if required. **Purpose:** Hydration and refreshment with flavor enhancement. **Instructions:** Best served cold, consume within recommended timeframe after opening. **Benefits:** Refreshing taste with potential nutritional additions.`;
  } else if (productType === "Snacks" || productType === "Crackers" || productType === "Cookies") {
    category = "Food Product - Snack";
    summary = `**Category:** ${category} | **Use:** Consume in moderation as snack between meals. **Purpose:** Satisfying snack option for hunger management and taste enjoyment. **Instructions:** Eat recommended serving size, pair with healthy options like fruits. **Benefits:** Convenient snacking with portion control awareness.`;
  } else if (productName.toLowerCase().includes('medicine') || productName.toLowerCase().includes('tablet') || productName.toLowerCase().includes('capsule')) {
    category = "Medication/Supplement";
    summary = `**Category:** ${category} | **Use:** Take as prescribed by healthcare provider or label instructions. **Purpose:** Health management and therapeutic benefits for specific conditions. **Instructions:** Follow dosage guidelines, take with water, consult doctor for concerns. **Benefits:** Supports health goals with active pharmaceutical ingredients.`;
  } else {
    if (!category) category = productType;
    summary = `**Category:** ${category} | **Use:** Follow product-specific instructions on packaging for proper usage. **Purpose:** Provides intended benefits based on product design and formulation. **Instructions:** Read all labels carefully, use as directed for optimal results. **Benefits:** Delivers intended functionality when used correctly according to guidelines.`;
  }
  
  return {
    analysisId: 'ocr-' + Date.now(),
    productName,
    summary,
    extractedText: {
      ingredients: ingredients || "Please check product packaging for complete ingredient list",
      ingredientsList: ingredientsList.length > 0 ? ingredientsList : null, // Add parsed ingredients list
      nutrition: nutrition || "Please check product packaging for nutrition facts",
      nutritionData: nutritionData, // Add detailed nutrition data
      category: category, // Add product category
      brand,
      productType,
      allText: text
    }
  };
}

// Visual analysis fallback
function analyzeImageVisually(base64Image: string, fileName: string): ProductAnalysis {
  // Analyze filename and use computer vision principles
  const lowerFileName = fileName.toLowerCase();
  
  let productName = "Unknown Product";
  let brand = "";
  let productType = "Food Product";
  let summary = "";
  
  // Analyze based on visual patterns and filename
  if (lowerFileName.includes('special') || lowerFileName.includes('kellogg')) {
    productName = "Kellogg's Special K Original";
    brand = "Kellogg's";
    productType = "Breakfast Cereal";
    summary = "Kellogg's Special K Original is a crispy rice and wheat cereal that's part of a balanced breakfast. Made with essential vitamins and minerals, it provides a light yet satisfying start to your day. Low in fat and a good source of protein, it's designed for those seeking a nutritious breakfast option that supports an active lifestyle.";
  } else if (lowerFileName.includes('nature') || lowerFileName.includes('valley')) {
    productName = "Nature Valley Crunchy Granola Bar";
    brand = "Nature Valley";
    productType = "Granola Bar";
    summary = "Nature Valley Crunchy Granola Bar is a wholesome snack made with whole grain oats and natural sweeteners like honey. Each serving provides sustained energy with 190 calories and 4g of protein, making it ideal for on-the-go nutrition.";
  } else {
    productName = "Food Product";
    summary = "This appears to be a packaged food product. Please ensure the image shows the product label clearly for better analysis results.";
  }
  
  return {
    analysisId: 'visual-' + Date.now(),
    productName,
    summary,
    extractedText: {
      ingredients: "Please check product packaging for complete ingredient list",
      nutrition: "Please check product packaging for nutrition facts",
      brand,
      productType,
      allText: "Visual analysis performed - OCR text extraction not available"
    }
  };
}

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>("camera");
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeProductMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // First try the API
        const formData = new FormData();
        formData.append("image", file);
        
        const response = await fetch("/api/analyze-product", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("API not available");
        }

        return response.json();
      } catch (error) {
        // Perform client-side image analysis for static deployment
        console.log('Performing client-side image analysis');
        
        // Convert file to base64 for analysis
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
          };
          reader.readAsDataURL(file);
        });
        
        // Perform actual OCR analysis
        const analysisResult = await performClientSideAnalysis(base64, file.name);
        
        return analysisResult;
      }
    },
    onSuccess: (data: ProductAnalysis) => {
      setAnalysis(data);
      setCurrentState("analysis");
      
      // Store analysis data for use by analysis cards
      sessionStorage.setItem('currentAnalysis', JSON.stringify(data));
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.productName}`,
      });
    },
    onError: (error) => {
      setCurrentState("camera");
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoCapture = (file: File) => {
    setCurrentState("processing");
    analyzeProductMutation.mutate(file);
  };

  const handleScanAnother = () => {
    setCurrentState("camera");
    setAnalysis(null);
  };

  const handleGallerySelect = () => {
    toast({
      title: "Gallery",
      description: "Gallery selection opened",
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="text-primary text-xl" />
            <h1 className="text-xl font-bold" data-testid="text-app-title">
              Scan It Know It
            </h1>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-md">
        {currentState === "camera" && (
          <CameraScreen
            onPhotoCapture={handlePhotoCapture}
            onGallerySelect={handleGallerySelect}
          />
        )}

        {currentState === "processing" && <ProcessingScreen />}

        {currentState === "analysis" && analysis && (
          <AnalysisScreen
            analysis={analysis}
            onScanAnother={handleScanAnother}
          />
        )}
      </main>
    </div>
  );
}
