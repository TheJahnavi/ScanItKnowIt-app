# ScanItKnowIt

This is the ScanItKnowIt application, a product analysis tool that uses AI to provide insights about products based on images.

## Features
- Product identification using OCR
- Ingredient analysis
- Nutritional information analysis
- Reddit review aggregation
- AI-powered chat responses
- User authentication and data persistence

## Deployment Status
- Fixed vercel.json syntax error
- Client and server builds configured
- Static file serving from client/public
- Updated vercel.json to use correct Vercel v2 syntax with rewrites and source/destination
- Fixed PostCSS build error with Node.js engine requirements

## Technologies Used
- React/Vite for frontend
- Express.js for backend
- OpenAI API for analysis
- Reddit API for reviews
- SQLite for data persistence
- Vercel for deployment

# ScanItKnowIt - Vercel Deployment

This document provides instructions for deploying the ScanItKnowIt application to Vercel with both frontend and backend.

## Project Structure

The project is organized as follows:
```
ScanItKnowIt/
├── client/                 # React frontend (Vite)
│   ├── src/
│   ├── dist/               # Built static files (output of `npm run build`)
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js/Express backend
│   ├── src/                # Backend source
│   ├── package.json
│   └── index.ts            # Backend entry point
├── shared/                 # Shared code (e.g., types, utilities)
├── package.json            # Root package for shared dependencies
└── vercel.json             # Vercel configuration file
```

## Deployment to Vercel

1. **Prepare the Repository**
   - Ensure all changes are committed and pushed to your GitHub repository

2. **Link Your GitHub Repo to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/)
   - Click "Import" → Connect your GitHub account → Select your `ScanItKnowIt` repo

3. **Configure the Project**
   - Vercel will auto-detect the `vercel.json` and build both frontend/backend
   - Set environment variables in the Vercel dashboard:
     - `OPENROUTER_API_KEY`
     - Reddit API credentials (if using Reddit integration)

4. **Environment Variables**
   - In Vercel → **Project Settings** → **Environment Variables**, add:
     - `OPENROUTER_API_KEY` (required for AI features)
     - Reddit API credentials (if applicable)
     - `API_NINJAS_KEY` (if using API Ninjas services)

5. **Deploy**
   - Vercel will automatically build and deploy your application
   - The frontend will be available at `https://your-app.vercel.app/`
   - API endpoints will be available at `https://your-app.vercel.app/api/`

For a complete deployment plan with all essential information, see [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md).

## Self-Hosting

For self-hosting instructions, see [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md).

## Deployment with API Keys

For detailed instructions on deploying with your API keys, see [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md).

## Production Deployment Enhancements

The application includes several production deployment enhancements:

- **Client-Side Environment Variables**: Proper configuration for separate frontend/backend deployments
- **CORS Configuration**: Secure cross-origin request handling
- **Enhanced Logging**: Comprehensive logging solution with multiple outputs
- **Security Improvements**: Proper CORS, no sensitive data logging
- **Performance Monitoring**: Request timing, external API tracking

For detailed information about these enhancements, see [PRODUCTION_DEPLOYMENT_ENHANCEMENTS.md](PRODUCTION_DEPLOYMENT_ENHANCEMENTS.md).

## PostCSS Build Error Fix

Fixed the `Cannot read properties of null (reading 'matches')` error by adding explicit Node.js engine requirements to all package.json files. For details, see [POSTCSS_BUILD_ERROR_FIX.md](POSTCSS_BUILD_ERROR_FIX.md).

## Local Development

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. The application will be available at `http://localhost:3001`

## Deployment Tools

The application includes several deployment tools to ensure smooth releases:

1. **Deployment Readiness Verification**:
   ```
   npm run verify-deployment
   ```
   Checks if the application is ready for deployment.

2. **Smoke Tests**:
   ```
   npm run smoke-test
   ```
   Runs basic tests to verify the application works after deployment.

3. **Deployment Report Generation**:
   ```
   npm run generate-deployment-report
   ```
   Generates a detailed report about the current deployment.

## Building for Production

To build the application for production:

1. Build both frontend and backend:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start
   ```

## API Endpoints

The backend provides the following API endpoints:

- `POST /api/register` - Register a new user
- `POST /api/login` - Login existing user
- `POST /api/analyze-product` - Analyze a product image
- `POST /api/analyze-ingredients/:analysisId` - Get ingredients analysis
- `POST /api/analyze-nutrition/:analysisId` - Get nutrition analysis
- `POST /api/analyze-reddit/:analysisId` - Get Reddit reviews
- `POST /api/chat/:analysisId` - Chat with AI about the product
- `GET /api/chat/:analysisId` - Get chat history
- `GET /api/user/analyses` - Get user's analysis history

## Production Readiness

The application has been enhanced with production-ready features:

- **Enhanced Security**: Rate limiting, input validation, and secure authentication
- **Robust Error Handling**: Retry logic with exponential backoff and circuit breaker patterns
- **Performance Optimizations**: Caching strategies and efficient database queries
- **Monitoring**: Health checks and detailed logging

For detailed information about production readiness enhancements, see:
- [PRODUCTION_READINESS_ENHANCEMENTS.md](PRODUCTION_READINESS_ENHANCEMENTS.md)
- [FINAL_PRODUCTION_READINESS_SUMMARY.md](FINAL_PRODUCTION_READINESS_SUMMARY.md)

## Notes

- The frontend is built using Vite and React
- The backend is built using Express.js with TypeScript
- Vercel Functions are used for serverless backend deployment
- Static files are served through Vercel's CDN
- All dependencies are properly configured for Vercel deployment
- Data is stored in SQLite database for persistence
- User authentication is implemented with JWT tokens