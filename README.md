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
- Updated CSS build tools to latest compatible versions

## Technologies Used
- React/Vite for frontend
- Express.js for backend
- OpenAI API for analysis
- Reddit API for reviews
- Firebase Firestore for data persistence (replacing SQLite)
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

## Firebase Integration

The application now supports Firebase Firestore as a data persistence layer, replacing the previous SQLite database. This provides a more scalable, serverless solution for production deployments.

### Migration from SQLite to Firebase

If you're migrating from the existing SQLite database:

1. Follow the setup instructions in [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Use the migration script at [server/migrate-to-firestore.ts](server/migrate-to-firestore.ts) to transfer existing data
3. Update your environment variables to include Firebase credentials

### Firebase Setup

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions on:
- Creating a Firebase project
- Generating service account keys
- Configuring Firestore database
- Setting environment variables
- Security rules for production

### Testing Firebase Integration

To test the Firebase integration:

1. Configure Firebase environment variables
2. Run the test script:
   ```bash
   cd server
   npx tsx test-firestore.ts
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
     - Firebase credentials (if using Firebase)
     - Reddit API credentials (if using Reddit integration)

4. **Environment Variables**
   - In Vercel → **Project Settings** → **Environment Variables**, add:
     - `OPENROUTER_API_KEY` (required for AI features)
     - Firebase credentials (if using Firebase):
       - `FIREBASE_PROJECT_ID`
       - `FIREBASE_CLIENT_EMAIL`
       - `FIREBASE_PRIVATE_KEY`
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

## PostCSS Build Error Resolution

Completely resolved the `Cannot read properties of null (reading 'matches')` error by:
1. Adding explicit Node.js engine requirements to all package.json files
2. Updating PostCSS, TailwindCSS, and Autoprefixer to latest versions
3. Creating comprehensive documentation for future reference

For complete details, see:
- [POSTCSS_BUILD_ERROR_FIX.md](POSTCSS_BUILD_ERROR_FIX.md)
- [POSTCSS_BUILD_ERROR_RESOLUTION.md](POSTCSS_BUILD_ERROR_RESOLUTION.md)

## Production Readiness Enhancements

The application has been enhanced with critical production readiness features:

### Database Persistence and Scalability
- Comprehensive guide for migrating from SQLite to Firebase Firestore for production
- See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for detailed instructions

### Enhanced Health Check Endpoint
- Robust health monitoring with dependency checks
- Database connectivity verification
- External API status monitoring
- See [HEALTH_CHECK_DOCUMENTATION.md](HEALTH_CHECK_DOCUMENTATION.md) for implementation details

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
- `GET /api/health` - Health check endpoint with dependency monitoring

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
- Data is stored in Firebase Firestore database for persistence (replacing SQLite)
- User authentication is implemented with JWT tokens