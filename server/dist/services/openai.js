export async function identifyProductAndExtractText(base64Image) {
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
export async function analyzeIngredients(extractedText) {
    return {
        ingredients: [
            { name: "Whole Grain Oats", safety: "Safe", reason: "Good source of fiber" },
            { name: "Sugar", safety: "Moderate", reason: "High glycemic impact" },
            { name: "Canola Oil", safety: "Safe", reason: "Heart-healthy fat" },
            { name: "Honey", safety: "Moderate", reason: "Natural sugar content" }
        ]
    };
}
export async function analyzeNutrition(extractedText) {
    return {
        calories: 190,
        totalSugars: "11g",
        sugarTypes: [
            { type: "Added Sugars", amount: "10g" },
            { type: "Natural Sugars (from honey)", amount: "1g" }
        ]
    };
}
export async function generateChatResponse(question, productData) {
    return "This is a demo response about the product. In a real implementation, this would use AI to answer your question.";
}
