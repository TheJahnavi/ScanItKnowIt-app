# Detailed Business Logic and Data Structures - ScanItKnowIt

## 1. Core Business Logic (The "KnowIt" Part)

### Product Scanning/Lookup

**1. How does the application acquire the product code (e.g., UPC, EAN)?**
The application uses a two-pronged approach:
- **Camera Scanning**: Users capture product images using their device's camera through the [CameraScreen](file:///c:/Users/deepa/Downloads/ScanItKnowIt/ScanItKnowIt/client/src/components/camera-screen.tsx#L75-L197) component, which utilizes the [useCamera](file:///c:/Users/deepa/Downloads/ScanItKnowIt/ScanItKnowIt/client/src/hooks/use-camera.tsx#L5-L267) hook for media device access
- **Image Processing**: The captured image is processed through OCR (Optical Character Recognition) using the OpenRouter API to extract text from the product packaging
- **Product Identification**: The extracted text is analyzed using AI prompts to identify the product name, ingredients, nutrition facts, and other relevant information

**2. Process flow for a product code that is not found in our database:**
- When OCR fails or doesn't extract sufficient information, the application falls back to filename-based detection and visual analysis
- The system generates a generic product analysis with placeholder information indicating that OCR was not successful
- Users are prompted to check the product packaging for complete information
- No external database lookup is currently implemented for product codes - the system relies on AI analysis of the captured image

### AI Feature Integration

**1. Specific inputs sent to the OpenAI API/OpenRouter:**
The application sends various inputs depending on the analysis stage:

- **Product Identification**: Base64-encoded image with prompt to extract product text and structure it as JSON
- **Ingredient Analysis**: Extracted ingredients text with prompt to evaluate safety and classify ingredients
- **Nutrition Analysis**: Nutritional information with prompt to analyze and format nutritional data
- **Reddit Review Analysis**: Product name with prompt to search Reddit and summarize customer sentiment
- **Chat Interface**: Conversation history and user questions with product context for contextual responses

**2. Key prompts or AI directives:**
- **Product Identification**: "Please analyze this product image and extract all visible text. Structure your response as a JSON object..."
- **Ingredient Analysis**: "As a product health analyst, your task is to evaluate the ingredients list and create a comprehensive safety assessment..."
- **Nutrition Analysis**: "You are a nutritional data expert. Analyze the provided nutritional information and format it as follows..."
- **Reddit Review Analysis**: "Based on the following product text and reddit web search results, provide a brief summary of the overall customer sentiment..."
- **Chat Interface**: "You are a helpful product expert chatbot. You have access to detailed information about a product..."

### User/Product Data

**1. Top 3-5 most critical data fields stored in Firestore for a User:**
```typescript
interface User {
  id: string;           // Unique user identifier
  username: string;     // User's chosen username
  password: string;     // Hashed password for authentication
  createdAt: Date;      // Account creation timestamp
}
```

**2. Top 3-5 most critical data fields stored for a Product:**
```typescript
interface ProductAnalysis {
  id: string;                    // Unique analysis identifier
  userId: string;                // Owner of the analysis
  productName: string;           // Identified product name
  productSummary: string;        // AI-generated product summary
  extractedText: any;            // Full OCR extracted data including ingredients, nutrition
  ingredientsData: any | null;   // Detailed ingredient analysis
  nutritionData: any | null;     // Detailed nutrition analysis
  redditData: any | null;        // Reddit review analysis
  createdAt: Date;               // Analysis creation timestamp
}
```

## 2. Data & Stability (The "Firestore/Testing" Part)

### Firestore Security & Structure

**1. Firestore Security Rules Summary:**
The application implements strict security rules to ensure data isolation:

```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Product analyses are accessible only to their owners
match /product_analyses/{analysisId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

// Chat messages are accessible only to their owners
match /chat_messages/{messageId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

**2. Related entities linking in Firestore:**
- **User-Product Relationship**: Product analyses are linked to users via the [userId](file:///c:/Users/deepa/Downloads/ScanItKnowIt/ScanItKnowIt/server/database.ts#L14-L14) field in the product_analyses collection
- **Product-Chat Relationship**: Chat messages are linked to product analyses via the [analysisId](file:///c:/Users/deepa/Downloads/ScanItKnowIt/ScanItKnowIt/server/database.ts#L25-L25) field in the chat_messages collection
- **Structure**: Flat document structure with cross-references via document IDs rather than subcollections

### Testing Gaps

**1. Currently untested features/endpoints:**
- **AI Integration**: The core OpenRouter/OpenAI API calls are not unit tested
- **OCR Processing**: The OCR.space API integration lacks automated tests
- **Reddit Integration**: Reddit API calls and sentiment analysis are not tested
- **Camera Functionality**: Client-side camera access and image capture are not unit tested
- **Error Handling**: Comprehensive error scenarios are not validated
- **Rate Limiting**: The rate limiting middleware is not tested
- **Authentication Middleware**: The authentication middleware lacks unit tests

**2. Manual validation process:**
The current manual validation process includes:
- Running the comprehensive test script: `node server/comprehensive-test.js`
- Manually testing camera functionality in the browser
- Verifying health check endpoint: `GET /api/health`
- Testing user registration and login flows
- Testing product analysis with sample images
- Validating chat functionality with sample questions

### Environment Variables

**1. Environment-specific variables affecting core behavior:**
Beyond API keys and Firebase credentials, the application uses:
- **NODE_ENV**: Controls development vs. production behavior
- **PORT**: Server port configuration
- **CORS_ORIGIN**: CORS configuration for cross-origin requests
- **JWT_SECRET**: Secret key for JWT token generation
- No explicit feature toggle flags or logging level configurations are currently implemented

## 3. Operations & Dependencies

### External API Rate Limits

**1. OpenRouter/OpenAI API rate limits and throttling:**
- **Rate Limits**: OpenRouter provides different rate limits based on the model and pricing tier
- **Current Implementation**: The application implements retry logic with exponential backoff and circuit breaker patterns
- **Throttling**: The analysisRateLimiter middleware limits requests to 20 per hour per IP
- **Circuit Breaker**: 3 failures within 30 seconds will temporarily disable API calls

### Deployment Strategy Detail

**1. Vercel deployment as Serverless Function:**
- **Confirmation**: Yes, the server (Express.js) runs as Serverless Functions on Vercel
- **Configuration**: The `vercel.json` file routes API requests to serverless functions
- **Architecture**: Client-side static files are served from CDN, API endpoints are handled by serverless functions

**2. Build time and optimizations:**
- **Typical Build Time**: 1-3 minutes depending on dependencies and caching
- **Optimizations**: 
  - Vite for client-side bundling with tree-shaking
  - TypeScript compilation for server code
  - Asset optimization through Vercel's build pipeline
  - No explicit webpack configuration (uses Vite's built-in optimizations)

## Additional Technical Details

### Data Flow Architecture

1. **User Interaction**: User captures product image via camera or uploads from gallery
2. **Image Processing**: Client converts image to base64 and sends to `/api/analyze-product`
3. **OCR Analysis**: Server uses OpenRouter to extract text from image
4. **Data Structuring**: AI processes extracted text into structured data
5. **Storage**: Analysis results stored in Firestore with user association
6. **Additional Analysis**: Separate endpoints for ingredients, nutrition, and Reddit reviews
7. **User Interface**: Client displays analysis results and enables chat functionality

### Error Handling and Resilience

- **Retry Logic**: Exponential backoff for external API calls
- **Circuit Breaker**: Prevents cascading failures when external services are down
- **Fallback Responses**: Demo data provided when AI analysis fails
- **Graceful Degradation**: Core functionality remains available even when optional services fail

### Security Considerations

- **Authentication**: JWT tokens with secure storage
- **Data Isolation**: Firestore rules ensure users only access their own data
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Sanitization of user inputs
- **Secure Storage**: Passwords hashed with bcrypt

This documentation provides a comprehensive view of the application's business logic, data structures, and operational characteristics, enabling safe and efficient development and maintenance.